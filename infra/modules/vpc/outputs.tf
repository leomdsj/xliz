output "vpc_id" {
  description = "Default VPC ID"
  value       = data.aws_vpc.default.id
}

output "subnet_ids" {
  description = "Default public subnet IDs (one per AZ)"
  value       = data.aws_subnets.default.ids
}

output "lambda_security_group_id" {
  description = "Security group ID to attach to Lambda functions in the VPC"
  value       = aws_security_group.lambda.id
}
