import Link from 'next/link';
import type { Job } from '../../../shared/types';
import { StatusBadge } from './StatusBadge';

export function JobCard({ job }: { job: Job }) {
  const progress =
    job.progress.total > 0
      ? Math.round(((job.progress.completed + job.progress.failed) / job.progress.total) * 100)
      : 0;

  const createdAt = new Date(job.created_at).toLocaleString('pt-BR');

  return (
    <Link href={`/jobs/${job.job_id}`}>
      <div className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-violet-700 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-zinc-400 font-mono truncate">{job.job_id}</p>
            <p className="text-white font-medium mt-0.5">{job.workflow_id}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
            <span>{job.progress.completed + job.progress.failed} / {job.progress.total} itens</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-600 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {job.progress.failed > 0 && (
            <p className="text-xs text-red-400 mt-1">{job.progress.failed} erros</p>
          )}
        </div>

        <p className="text-xs text-zinc-600 mt-3">{createdAt}</p>
      </div>
    </Link>
  );
}
