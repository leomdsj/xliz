import {
  LambdaClient,
  InvokeCommand,
  InvocationType,
} from '@aws-sdk/client-lambda';
import type { ItemResult, WorkflowStep } from '../../../../shared/types';

const lambda = new LambdaClient({});
const EXECUTOR_FUNCTION = process.env.EXECUTOR_FUNCTION!;

export interface ExecutorPayload {
  job_id: string;
  barcode: string;
  steps: WorkflowStep[];
}

export interface ExecutorResult {
  success: boolean;
  barcode: string;
  steps_completed: number;
  error?: string;
  duration_ms: number;
}

export async function invokeExecutor(payload: ExecutorPayload): Promise<ItemResult> {
  const response = await lambda.send(
    new InvokeCommand({
      FunctionName: EXECUTOR_FUNCTION,
      InvocationType: InvocationType.RequestResponse,
      Payload: Buffer.from(JSON.stringify(payload)),
    })
  );

  if (response.FunctionError) {
    return {
      barcode: payload.barcode,
      success: false,
      steps_completed: 0,
      error: `Executor error: ${response.FunctionError}`,
      duration_ms: 0,
    };
  }

  const result = JSON.parse(
    Buffer.from(response.Payload!).toString()
  ) as ExecutorResult;

  return result;
}
