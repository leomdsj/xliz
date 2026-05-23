import type {
  CreateJobRequest,
  CreateJobResponse,
  Job,
  JobResult,
} from '../../../shared/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export const api = {
  createJob(body: CreateJobRequest): Promise<CreateJobResponse> {
    return request<CreateJobResponse>('/jobs', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  getJob(job_id: string): Promise<Job> {
    return request<Job>(`/jobs/${job_id}`);
  },

  getJobResults(job_id: string): Promise<JobResult> {
    return request<JobResult>(`/jobs/${job_id}/results`);
  },
};
