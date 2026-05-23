resource "aws_sqs_queue" "dlq" {
  name                      = "${var.prefix}-jobs-dlq"
  message_retention_seconds = 1209600

  tags = var.tags
}

resource "aws_sqs_queue" "main" {
  name                       = "${var.prefix}-jobs-queue"
  visibility_timeout_seconds = 900
  message_retention_seconds  = 86400

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })

  tags = var.tags
}
