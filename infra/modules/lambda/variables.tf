variable "function_name" {
  description = "Lambda function name"
  type        = string
}

variable "handler" {
  description = "Lambda handler (file.export)"
  type        = string
  default     = "index.handler"
}

variable "filename" {
  description = "Path to the deployment package zip"
  type        = string
}

variable "source_code_hash" {
  description = "Base64-encoded SHA256 hash of the deployment package"
  type        = string
}

variable "timeout" {
  description = "Function timeout in seconds"
  type        = number
  default     = 30
}

variable "memory_size" {
  description = "Function memory in MB"
  type        = number
  default     = 256
}

variable "environment_variables" {
  description = "Environment variables for the function"
  type        = map(string)
  default     = {}
}

variable "policy_json" {
  description = "Additional IAM policy JSON to attach to the execution role"
  type        = string
  default     = ""
}

variable "sqs_queue_arn" {
  description = "SQS queue ARN to use as event source (leave empty to skip)"
  type        = string
  default     = ""
}

variable "vpc_subnet_ids" {
  description = "Subnet IDs for VPC config. Empty list = Lambda runs outside VPC (default, no NAT needed)."
  type        = list(string)
  default     = []
}

variable "vpc_security_group_ids" {
  description = "Security group IDs for VPC config. Required when vpc_subnet_ids is non-empty."
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
