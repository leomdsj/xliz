import type { SQSHandler, SQSRecord } from 'aws-lambda';
import { updateJobStatus } from './lib/dynamodb';
import { putJobResult } from './lib/s3';
// O runner do executor é importado diretamente — sem chamada SDK ao Lambda API.
// Isso permite que o Dispatcher rode na VPC default sem precisar de NAT Gateway
// ou interface endpoint para Lambda (ambos custosos). Em produção, quando o
// executor precisar de Playwright e acesso à internet, este import volta a ser
// uma invocação Lambda separada (com NAT ou fora da VPC).
import { runWorkflow } from '../../executor/src/lib/runner';
import { getWorkflow } from './workflows';
import type { JobInputs, ItemResult, JobResult } from '../../../shared/types';

interface JobMessage {
  job_id: string;
  workflow_id: string;
  inputs: JobInputs;
}

async function processRecord(record: SQSRecord): Promise<void> {
  const message = JSON.parse(record.body) as JobMessage;
  const { job_id, workflow_id, inputs } = message;

  console.log(`[${job_id}] Starting dispatch — workflow: ${workflow_id}, barcodes: ${inputs.barcodes.length}`);

  const workflow = getWorkflow(workflow_id);
  if (!workflow) {
    await updateJobStatus(job_id, 'failed', undefined, `Unknown workflow: ${workflow_id}`);
    throw new Error(`Unknown workflow: ${workflow_id}`);
  }

  await updateJobStatus(job_id, 'running', {
    total: inputs.barcodes.length,
    completed: 0,
    failed: 0,
  });

  const items: ItemResult[] = [];
  let completed = 0;
  let failed = 0;

  for (const barcode of inputs.barcodes) {
    console.log(`[${job_id}] Processing barcode: ${barcode}`);
    const start = Date.now();

    const context: Record<string, string> = {
      barcode,
      USERNAME: process.env.TRANSPORTADORA_USERNAME ?? 'demo-user',
      PASSWORD: process.env.TRANSPORTADORA_PASSWORD ?? '***',
    };

    let result: ItemResult;
    try {
      const { results, stepsCompleted } = await runWorkflow(workflow.steps, context);
      const allSucceeded = results.every((r) => r.success);
      result = {
        barcode,
        success: allSucceeded,
        steps_completed: stepsCompleted,
        duration_ms: Date.now() - start,
      };
    } catch (err) {
      result = {
        barcode,
        success: false,
        steps_completed: 0,
        error: err instanceof Error ? err.message : String(err),
        duration_ms: Date.now() - start,
      };
    }

    items.push(result);

    if (result.success) {
      completed++;
    } else {
      failed++;
      console.warn(`[${job_id}] Barcode ${barcode} failed: ${result.error}`);
    }

    await updateJobStatus(job_id, 'running', {
      total: inputs.barcodes.length,
      completed,
      failed,
    });
  }

  const finalStatus = failed === inputs.barcodes.length ? 'failed' : 'done';

  const jobResult: JobResult = {
    job_id,
    workflow_id,
    completed_at: new Date().toISOString(),
    items,
    summary: {
      total: inputs.barcodes.length,
      succeeded: completed,
      failed,
    },
  };

  await putJobResult(job_id, jobResult);
  await updateJobStatus(job_id, finalStatus, { total: inputs.barcodes.length, completed, failed });

  console.log(`[${job_id}] Done — ${completed} succeeded, ${failed} failed`);
}

export const handler: SQSHandler = async (event) => {
  for (const record of event.Records) {
    await processRecord(record);
  }
};
