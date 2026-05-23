import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import type { JobProgress, JobStatus } from '../../../../shared/types';

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const TABLE = process.env.JOBS_TABLE_NAME!;

export async function updateJobStatus(
  job_id: string,
  status: JobStatus,
  progress?: JobProgress,
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
