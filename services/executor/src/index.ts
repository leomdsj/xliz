import type { Handler } from 'aws-lambda';
import { runWorkflow } from './lib/runner';
import type { WorkflowStep } from '../../../shared/types';

interface ExecutorPayload {
  job_id: string;
  barcode: string;
  steps: WorkflowStep[];
}

interface ExecutorResult {
  success: boolean;
  barcode: string;
  steps_completed: number;
  error?: string;
  duration_ms: number;
}

export const handler: Handler<ExecutorPayload, ExecutorResult> = async (event) => {
  const { job_id, barcode, steps } = event;
  const start = Date.now();

  console.log(`[${job_id}] Executing ${steps.length} steps for barcode: ${barcode}`);

  try {
    const context: Record<string, string> = {
      barcode,
      // Credentials would be loaded from SSM Parameter Store in production
      USERNAME: process.env.TRANSPORTADORA_USERNAME ?? 'demo-user',
      PASSWORD: process.env.TRANSPORTADORA_PASSWORD ?? '***',
    };

    const { results, stepsCompleted } = await runWorkflow(steps, context);
    const duration_ms = Date.now() - start;

    const allSucceeded = results.every((r) => r.success);

    console.log(
      `[${job_id}] barcode=${barcode} steps=${stepsCompleted}/${steps.length} success=${allSucceeded} duration=${duration_ms}ms`
    );

    return {
      success: allSucceeded,
      barcode,
      steps_completed: stepsCompleted,
      duration_ms,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[${job_id}] barcode=${barcode} failed:`, message);

    return {
      success: false,
      barcode,
      steps_completed: 0,
      error: message,
      duration_ms: Date.now() - start,
    };
  }
};
