# Reusa a VPC default que já existe em toda conta AWS — custo zero.
# Não cria VPC customizada, subnets privadas nem NAT Gateway.

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "defaultForAz"
    values = ["true"]
  }
}

data "aws_route_tables" "default" {
  vpc_id = data.aws_vpc.default.id
}

# Security group para as Lambdas que rodam dentro da VPC.
# Sem inbound (Lambda não recebe conexões), outbound liberado para
# os endpoints de serviço AWS acessados via gateway endpoint.
resource "aws_security_group" "lambda" {
  name        = "${var.prefix}-lambda-sg"
  description = "xliz Lambda functions inside default VPC"
  vpc_id      = data.aws_vpc.default.id

  egress {
    description = "HTTPS para endpoints de serviços AWS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = var.tags
}

# Gateway endpoint para S3 — gratuito, sem custo por hora ou por GB.
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = data.aws_vpc.default.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = data.aws_route_tables.default.ids

  tags = merge(var.tags, { Name = "${var.prefix}-s3-endpoint" })
}

# Gateway endpoint para DynamoDB — gratuito, sem custo por hora ou por GB.
resource "aws_vpc_endpoint" "dynamodb" {
  vpc_id            = data.aws_vpc.default.id
  service_name      = "com.amazonaws.${var.aws_region}.dynamodb"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = data.aws_route_tables.default.ids

  tags = merge(var.tags, { Name = "${var.prefix}-dynamodb-endpoint" })
}
