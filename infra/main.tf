terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    # Populated by environment tfvars or CLI flags
    # bucket = "my-terraform-state"
    # key    = "xliz/dev/terraform.tfstate"
    # region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

data "aws_caller_identity" "current" {}

locals {
  prefix = "xliz-${var.environment}"

  common_tags = {
    Project     = "xliz"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# ─── VPC default ─────────────────────────────────────────────────────────────
# Reutiliza a VPC default (já existe em toda conta AWS, custo zero).
# Cria gateway endpoints gratuitos para S3 e DynamoDB — elimina tráfego
# pela internet pública para os Lambdas que rodam dentro da VPC.

module "vpc" {
  source     = "../modules/vpc"
  prefix     = local.prefix
  aws_region = var.aws_region
}

# ─── Storage & CDN ───────────────────────────────────────────────────────────

module "s3_cloudfront" {
  source     = "../modules/s3-cloudfront"
  prefix     = local.prefix
  account_id = data.aws_caller_identity.current.account_id
}

# ─── Messaging ───────────────────────────────────────────────────────────────

module "sqs" {
  source = "../modules/sqs"
  prefix = local.prefix
}

# ─── Database ────────────────────────────────────────────────────────────────

module "dynamodb" {
  source = "../modules/dynamodb"
  prefix = local.prefix
}

# ─── Lambda: xliz-api ────────────────────────────────────────────────────────

data "archive_file" "api" {
  type        = "zip"
  source_dir  = "../../services/api/dist"
  output_path = "/tmp/xliz-api.zip"
}

module "lambda_api" {
  source           = "../modules/lambda"
  function_name    = "${local.prefix}-api"
  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256
  timeout          = 30
  memory_size      = 256

  environment_variables = {
    JOBS_TABLE_NAME   = module.dynamodb.table_name
    JOBS_QUEUE_URL    = module.sqs.queue_url
    RESULTS_BUCKET    = module.s3_cloudfront.results_bucket_name
    ENVIRONMENT       = var.environment
  }

  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query"]
        Resource = module.dynamodb.table_arn
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = module.sqs.queue_arn
      },
      {
        Effect   = "Allow"
        Action   = ["s3:GetObject"]
        Resource = "${module.s3_cloudfront.results_bucket_arn}/*"
      }
    ]
  })
}

# ─── Lambda: xliz-job-dispatcher ─────────────────────────────────────────────

data "archive_file" "dispatcher" {
  type        = "zip"
  source_dir  = "../../services/dispatcher/dist"
  output_path = "/tmp/xliz-dispatcher.zip"
}

module "lambda_dispatcher" {
  source           = "../modules/lambda"
  function_name    = "${local.prefix}-job-dispatcher"
  filename         = data.archive_file.dispatcher.output_path
  source_code_hash = data.archive_file.dispatcher.output_base64sha256
  timeout          = 900
  memory_size      = 512
  sqs_queue_arn    = module.sqs.queue_arn

  # Na VPC default — DynamoDB e S3 acessados via gateway endpoints gratuitos.
  # O polling da fila SQS é feito pelo serviço Lambda (não pelo código da função),
  # portanto não requer acesso à internet a partir da VPC.
  vpc_subnet_ids         = module.vpc.subnet_ids
  vpc_security_group_ids = [module.vpc.lambda_security_group_id]

  environment_variables = {
    JOBS_TABLE_NAME = module.dynamodb.table_name
    RESULTS_BUCKET  = module.s3_cloudfront.results_bucket_name
    ENVIRONMENT     = var.environment
  }

  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:UpdateItem"]
        Resource = module.dynamodb.table_arn
      },
      {
        Effect   = "Allow"
        Action   = ["sqs:ReceiveMessage", "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = module.sqs.queue_arn
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject"]
        Resource = "${module.s3_cloudfront.results_bucket_arn}/*"
      }
    ]
  })
}

# ─── Lambda: xliz-job-executor ───────────────────────────────────────────────

data "archive_file" "executor" {
  type        = "zip"
  source_dir  = "../../services/executor/dist"
  output_path = "/tmp/xliz-executor.zip"
}

module "lambda_executor" {
  source           = "../modules/lambda"
  function_name    = "${local.prefix}-job-executor"
  filename         = data.archive_file.executor.output_path
  source_code_hash = data.archive_file.executor.output_base64sha256
  timeout          = 300
  # 256 MB é suficiente para o mock. Aumentar para 1024+ quando Playwright for ativado.
  memory_size = 256

  # Na VPC default — DynamoDB e S3 acessados via gateway endpoints gratuitos.
  # Nota: para Playwright (produção), será necessário NAT Gateway ou mover
  # para fora da VPC, pois o browser precisa de acesso à internet.
  vpc_subnet_ids         = module.vpc.subnet_ids
  vpc_security_group_ids = [module.vpc.lambda_security_group_id]

  environment_variables = {
    JOBS_TABLE_NAME = module.dynamodb.table_name
    RESULTS_BUCKET  = module.s3_cloudfront.results_bucket_name
    ENVIRONMENT     = var.environment
  }

  policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:UpdateItem"]
        Resource = module.dynamodb.table_arn
      },
      {
        Effect   = "Allow"
        Action   = ["s3:PutObject"]
        Resource = "${module.s3_cloudfront.results_bucket_arn}/*"
      }
    ]
  })
}

# ─── API Gateway ─────────────────────────────────────────────────────────────

module "api_gateway" {
  source               = "../modules/api-gateway"
  prefix               = local.prefix
  lambda_invoke_arn    = module.lambda_api.invoke_arn
  lambda_function_name = module.lambda_api.function_name
}
