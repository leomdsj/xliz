import type { JobStatus } from '../../../shared/types';

const styles: Record<JobStatus, string> = {
  pending:
    'bg-zinc-700 text-zinc-300 border border-zinc-600',
  running:
    'bg-violet-900/50 text-violet-300 border border-violet-700 animate-pulse',
  done:
    'bg-emerald-900/50 text-emerald-300 border border-emerald-700',
  failed:
    'bg-red-900/50 text-red-300 border border-red-700',
};

const labels: Record<JobStatus, string> = {
  pending: 'Pendente',
  running: 'Executando',
  done: 'Concluído',
  failed: 'Falhou',
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status === 'running' && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-violet-400" />
      )}
      {labels[status]}
    </span>
  );
}
