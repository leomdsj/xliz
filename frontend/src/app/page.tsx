'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { JobCard } from '@/components/JobCard';
import type { Job } from '../../../shared/types';

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // For MVP: the API doesn't have a list endpoint yet.
    // Jobs are stored in localStorage client-side so we can poll them.
    const stored = localStorage.getItem('xliz:job_ids');
    if (!stored) {
      setLoading(false);
      return;
    }

    const ids: string[] = JSON.parse(stored);
    if (!ids.length) {
      setLoading(false);
      return;
    }

    Promise.all(ids.map((id) => api.getJob(id).catch(() => null)))
      .then((results) => {
        const valid = results.filter(Boolean) as Job[];
        // Sort newest first
        valid.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setJobs(valid);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">Acompanhe seus jobs de automação</p>
        </div>
        <Link
          href="/jobs/new"
          className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Novo Job
        </Link>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-300 text-sm">
          Erro ao carregar jobs: {error}
        </div>
      )}

      {!loading && !error && jobs.length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">⚡</div>
          <h2 className="text-xl font-semibold text-white mb-2">Nenhum job ainda</h2>
          <p className="text-zinc-500 text-sm mb-6">
            Crie seu primeiro job de automação para começar
          </p>
          <Link
            href="/jobs/new"
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            Criar primeiro job
          </Link>
        </div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.job_id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
