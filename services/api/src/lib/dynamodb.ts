import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import type { Job, JobProgress, JobStatus } from '../../../../shared/types';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE = process.env.JOBS_TABLE_NAME!;

export async function putJob(job: Job): Promise<void> {
  await ddb.send(
    new PutCommand({
      TableName: TABLE,
      Item: job,
    })
  );
}

export async function getJob(job_id: string): Promise<Job | null> {
  const result = await ddb.send(
    new GetCommand({
      TableName: TABLE,
      Key: { job_id },
    })
  );
  return (result.Item as Job) ?? null;
}

export async function updateJobStatus(
  job_id: string,
  status: JobStatus,
  progress?: Partial<JobProgress>,
  error?: string
): Promise<void> {
  const now = new Date().toISOString();

  let updateExpr = 'SET #status = :status, updated_at = :now';
  const exprNames: Record<string, string> = { '#status': 'status' };
  const exprValues: Record<string, unknown> = { ':status': status, ':now': now };

  if (progress) {
    updateExpr += ', progress = :progress';
    exprValues[':progress'] = progress;
  }

  if (error) {
    updateExpr += ', #err = :error';
    exprNames['#err'] = 'error';
    exprValues[':error'] = error;
  }

  await ddb.send(
    new UpdateCommand({
      TableName: TABLE,
      Key: { job_id },
      UpdateExpression: updateExpr,
      ExpressionAttributeNames: exprNames,
      ExpressionAttributeValues: exprValues,
    })
  );
}
