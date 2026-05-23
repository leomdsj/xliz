output "api_url" {
  description = "HTTP API endpoint URL"
  value       = module.api_gateway.api_url
}

output "cloudfront_url" {
  description = "CloudFront distribution URL for the frontend"
  value       = "https://${module.s3_cloudfront.cloudfront_domain}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (used for cache invalidation)"
  value       = module.s3_cloudfront.cloudfront_distribution_id
}

output "frontend_bucket" {
  description = "S3 bucket name for the frontend"
  value       = module.s3_cloudfront.frontend_bucket_name
}

output "results_bucket" {
  description = "S3 bucket name for job results"
  value       = module.s3_cloudfront.results_bucket_name
}

output "jobs_table" {
  description = "DynamoDB table name for jobs"
  value       = module.dynamodb.table_name
}

output "jobs_queue_url" {
  description = "SQS queue URL"
  value       = module.sqs.queue_url
}
