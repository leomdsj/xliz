variable "prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "lambda_invoke_arn" {
  description = "Invoke ARN of the API Lambda function"
  type        = string
}

variable "lambda_function_name" {
  description = "Name of the API Lambda function (for permission)"
  type        = string
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}
