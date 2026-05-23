import type { WorkflowStep } from '../../../../shared/types';

export interface StepResult {
  action: string;
  success: boolean;
  duration_ms: number;
  note?: string;
}

/**
 * Interpolates {{variable}} placeholders in a string with provided context values.
 */
function interpolate(template: string, context: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] ?? `{{${key}}}`);
}

/**
 * Mock runner: simulates workflow step execution without a real browser.
 * Replace this with a Playwright implementation when the real site credentials
 * are available. Use a container Lambda or Lambda Layer with Chromium for that.
 */
export async function runWorkflow(
  steps: WorkflowStep[],
  context: Record<string, string>
): Promise<{ results: StepResult[]; stepsCompleted: number }> {
  const results: StepResult[] = [];

  for (const step of steps) {
    const start = Date.now();

    // Simulate network/browser latency
    await delay(50 + Math.random() * 100);

    const result = simulateStep(step, context);
    result.duration_ms = Date.now() - start;
    results.push(result);

    console.log(
      `  [${step.action}] ${result.success ? '✓' : '✗'} ${result.note ?? ''}`
    );

    if (!result.success) {
      return { results, stepsCompleted: results.length - 1 };
    }
  }

  return { results, stepsCompleted: steps.length };
}

function simulateStep(
  step: WorkflowStep,
  context: Record<string, string>
): StepResult {
  switch (step.action) {
    case 'navigate':
      return {
        action: step.action,
        success: true,
        duration_ms: 0,
        note: `→ ${step.url}`,
      };

    case 'fill': {
      const value = interpolate(step.value, context);
      return {
        action: step.action,
        success: true,
        duration_ms: 0,
        note: `${step.selector} = "${value}"`,
      };
    }

    case 'click':
      return {
        action: step.action,
        success: true,
        duration_ms: 0,
        note: step.selector,
      };

    case 'wait_for':
      return {
        action: step.action,
        success: true,
        duration_ms: 0,
        note: step.selector,
      };

    case 'screenshot':
      return {
        action: step.action,
        success: true,
        duration_ms: 0,
        note: step.filename
          ? interpolate(step.filename, context)
          : 'screenshot.png',
      };

    default:
      return {
        action: (step as WorkflowStep).action,
        success: false,
        duration_ms: 0,
        note: 'Unknown step action',
      };
  }
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
