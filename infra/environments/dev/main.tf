terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment and configure after creating the state bucket:
  # backend "s3" {
  #   bucket = "xliz-terraform-state-<account_id>"
  #   key    = "xliz/dev/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

module "xliz" {
  source      = "../../"
  environment = var.environment
  aws_region  = var.aws_region
}

output "api_url" {
  value = module.xliz.api_url
}

output "cloudfront_url" {
  value = module.xliz.cloudfront_url
}

output "cloudfront_distribution_id" {
  value = module.xliz.cloudfront_distribution_id
}

output "frontend_bucket" {
  value = module.xliz.frontend_bucket
}
