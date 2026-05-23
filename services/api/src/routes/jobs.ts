import { v4 as uuidv4 } from 'uuid';
import { putJob, getJob } from '../lib/dynamodb';
import { enqueueJob } from '../lib/sqs';
import { getJobResult } from '../lib/s3';
import type {
  CreateJobRequest,
  CreateJobResponse,
  Job,
  ApiError,
} from '../../../../shared/types';

type Response = {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
};

const json = (statusCode: number, data: unknown): Response => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

const SUPPORTED_WORKFLOWS = ['transportadora-entrada-saida'];

export async function createJob(body: unknown): Promise<Response> {
  const req = body as CreateJobRequest;

  if (!req.workflow_id || !req.inputs?.barcodes?.length) {
    return json(400, { error: 'workflow_id and inputs.barcodes are required' } as ApiError);
  }

  if (!SUPPORTED_WORKFLOWS.includes(req.workflow_id)) {
    return json(400, { error: `Unknown workflow: ${req.workflow_id}` } as ApiError);
  }

  const job_id = uuidv4();
  const now = new Date().toISOString();
  const ttlDays = 7;
  const expires_at = Math.floor(Date.now() / 1000) + ttlDays * 86400;

  const job: Job = {
    job_id,
    workflow_id: req.workflow_id,
    status: 'pending',
    inputs: req.inputs,
    progress: {
      total: req.inputs.barcodes.length,
      completed: 0,
      failed: 0,
    },
    created_at: now,
    updated_at: now,
    expires_at,
  };

  await putJob(job);

  await enqueueJob({ job_id, workflow_id: req.workflow_id, inputs: req.inputs });

  const response: CreateJobResponse = { job_id, status: 'pending' };
  return json(201, response);
}

export async function getJobById(job_id: string): Promise<Response> {
  if (!job_id) {
    return json(400, { error: 'job_id is required' } as ApiError);
  }

  const job = await getJob(job_id);
  if (!job) {
    return json(404, { error: 'Job not found' } as ApiError);
  }

  return json(200, job);
}

export async function getJobResults(job_id: string): Promise<Response> {
  if (!job_id) {
    return json(400, { error: 'job_id is required' } as ApiError);
  }

  const job = await getJob(job_id);
  if (!job) {
    return json(404, { error: 'Job not found' } as ApiError);
  }

  if (job.status !== 'done' && job.status !== 'failed') {
    return json(202, { message: 'Job not yet complete', status: job.status });
  }

  const result = await getJobResult(job_id);
  if (!result) {
    return json(404, { error: 'Results not available yet' } as ApiError);
  }

  return json(200, result);
}
