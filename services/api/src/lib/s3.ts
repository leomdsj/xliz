import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import type { JobResult } from '../../../../shared/types';

const s3 = new S3Client({});
const BUCKET = process.env.RESULTS_BUCKET!;

export async function getJobResult(job_id: string): Promise<JobResult | null> {
  try {
    const response = await s3.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: `results/${job_id}.json`,
      })
    );
    const body = await response.Body?.transformToString();
    return body ? (JSON.parse(body) as JobResult) : null;
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      'name' in err &&
      err.name === 'NoSuchKey'
    ) {
      return null;
    }
    throw err;
  }
}
