import type { Workflow } from '../../../../shared/types';

// In production, workflows could be stored in S3 or DynamoDB.
// For MVP, they are defined here.
import transportadoraWorkflow from '../../../../../shared/workflows/transportadora-entrada-saida.json';

const registry: Record<string, Workflow> = {
  'transportadora-entrada-saida': transportadoraWorkflow as Workflow,
};

export function getWorkflow(workflow_id: string): Workflow | null {
  return registry[workflow_id] ?? null;
}
