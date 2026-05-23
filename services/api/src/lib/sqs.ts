import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({});
const QUEUE_URL = process.env.JOBS_QUEUE_URL!;

export async function enqueueJob(payload: Record<string, unknown>): Promise<void> {
  await sqs.send(
    new SendMessageCommand({
      QueueUrl: QUEUE_URL,
      MessageBody: JSON.stringify(payload),
    })
  );
}
