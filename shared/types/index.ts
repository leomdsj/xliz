// ─── Job ─────────────────────────────────────────────────────────────────────

export type JobStatus = 'pending' | 'running' | 'done' | 'failed';

export interface Job {
  job_id: string;
  workflow_id: string;
  status: JobStatus;
  inputs: JobInputs;
  progress: JobProgress;
  created_at: string;
  updated_at: string;
  error?: string;
  expires_at?: number; // Unix timestamp for DynamoDB TTL
}

export interface JobInputs {
  barcodes: string[];
  [key: string]: unknown; // extensible for other workflow types
}

export interface JobProgress {
  total: number;
  completed: number;
  failed: number;
}

// ─── Job Results ─────────────────────────────────────────────────────────────

export interface JobResult {
  job_id: string;
  workflow_id: string;
  completed_at: string;
  items: ItemResult[];
  summary: {
    total: number;
    succeeded: number;
    failed: number;
  };
}

export interface ItemResult {
  barcode: string;
  success: boolean;
  steps_completed: number;
  error?: string;
  duration_ms: number;
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

export interface Workflow {
  workflow_id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
}

export type WorkflowStep =
  | NavigateStep
  | FillStep
  | ClickStep
  | WaitForStep
  | ScreenshotStep;

interface BaseStep {
  action: string;
  description?: string;
}

export interface NavigateStep extends BaseStep {
  action: 'navigate';
  url: string;
}

export interface FillStep extends BaseStep {
  action: 'fill';
  selector: string;
  value: string; // supports {{variable}} interpolation
}

export interface ClickStep extends BaseStep {
  action: 'click';
  selector: string;
}

export interface WaitForStep extends BaseStep {
  action: 'wait_for';
  selector: string;
  timeout_ms?: number;
}

export interface ScreenshotStep extends BaseStep {
  action: 'screenshot';
  filename?: string;
}

// ─── API contracts ────────────────────────────────────────────────────────────

export interface CreateJobRequest {
  workflow_id: string;
  inputs: JobInputs;
}

export interface CreateJobResponse {
  job_id: string;
  status: JobStatus;
}

export interface GetJobResponse extends Job {}

export interface ApiError {
  error: string;
  details?: string;
}
