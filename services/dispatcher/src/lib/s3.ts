import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { JobResult } from '../../../../shared/types';

const s3 = new S3Client({});
const BUCKET = process.env.RESULTS_BUCKET!;

export async function putJobResult(job_id: string, result: JobResult): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `results/${job_id}.json`,
      Body: JSON.stringify(result, null, 2),
      ContentType: 'application/json',
    })
  );
}
