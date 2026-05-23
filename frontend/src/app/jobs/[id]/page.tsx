'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';
import type { Job, JobResult } from '../../../../../shared/types';

const POLL_INTERVAL_MS = 3000;

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [result, setResult] = useState<JobResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingResult, setLoadingResult] = useState(false);

  const fetchJob = useCallback(async () => {
    try {
      const data = await api.getJob(id);
      setJob(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar job');
      return null;
    }
  }, [id]);

  const fetchResult = useCallback(async () => {
    setLoadingResult(true);
    try {
      const data = await api.getJobResults(id);
      setResult(data);
    } catch {
      // results may not be available immediately after status change
    } finally {
      setLoadingResult(false);
    }
  }, [id]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      const data = await fetchJob();
      if (!data) return;

      if (data.status === 'done' || data.status === 'failed') {
        await fetchResult();
        return;
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS);
    }

    poll();
    return () => clearTimeout(timer);
  }, [fetchJob, fetchResult]);

  const progress =
    job && job.progress.total > 0
      ? Math.round(
          ((job.progress.completed + job.progress.failed) / job.progress.total) * 100
        )
      : 0;

  if (error) {
    return (
      <div className="max-w-2xl">
        <div className="bg-red-900/20 border border-red-800 rounded-xl p-6 text-center">
          <p className="text-red-300 mb-4">{error}</p>
          <Link href="/" className="text-violet-400 hover:text-violet-300 text-sm">
            ← Voltar ao dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isTerminal = job.status === 'done' || job.status === 'failed';
  const createdAt = new Date(job.created_at).toLocaleString('pt-BR');
  const updatedAt = new Date(job.updated_at).toLocaleString('pt-BR');

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <Link
            href="/"
            className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors"
          >
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">{job.workflow_id}</h1>
          <p className="text-zinc-500 font-mono text-xs mt-1">{job.job_id}</p>
        </div>
        <StatusBadge status={job.status} />
      </div>

      {/* Progress card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">Progresso</span>
          <span className="text-sm font-medium text-white">{progress}%</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              job.status === 'failed' ? 'bg-red-600' : 'bg-violet-600'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{job.progress.total}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-emerald-400">{job.progress.completed}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Sucesso</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-400">{job.progress.failed}</p>
            <p className="text-xs text-zinc-500 mt-0.5">Erros</p>
          </div>
        </div>
      </div>

      {/* Status/timestamps */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6 text-sm">
        <dl className="space-y-2">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Criado em</dt>
            <dd className="text-zinc-200">{createdAt}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-500">Atualizado em</dt>
            <dd className="text-zinc-200">{updatedAt}</dd>
          </div>
          {job.error && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Erro</dt>
              <dd className="text-red-400 text-right max-w-xs">{job.error}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Results */}
      {isTerminal && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <h2 className="font-semibold text-white mb-4">Resultados por código</h2>

          {loadingResult && (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {result && (
            <div className="space-y-2">
              {result.items.map((item) => (
                <div
                  key={item.barcode}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    item.success
                      ? 'bg-emerald-900/20 border border-emerald-900'
                      : 'bg-red-900/20 border border-red-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-sm font-medium ${
                        item.success ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {item.success ? '✓' : '✗'}
                    </span>
                    <span className="font-mono text-sm text-zinc-200">{item.barcode}</span>
                  </div>
                  <div className="text-right">
                    {item.error ? (
                      <p className="text-xs text-red-400">{item.error}</p>
                    ) : (
                      <p className="text-xs text-zinc-500">{item.duration_ms}ms</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingResult && !result && (
            <p className="text-zinc-500 text-sm text-center py-4">
              Resultados ainda não disponíveis
            </p>
          )}
        </div>
      )}

      {/* Polling indicator */}
      {!isTerminal && (
        <div className="flex items-center gap-2 text-zinc-500 text-xs mt-4">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
          Atualizando a cada {POLL_INTERVAL_MS / 1000}s…
        </div>
      )}

      {isTerminal && (
        <div className="mt-6 flex gap-3">
          <button
            onClick={() => router.push('/jobs/new')}
            className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Novo Job
          </button>
          <Link
            href="/"
            className="text-zinc-400 hover:text-zinc-200 text-sm px-4 py-2 transition-colors"
          >
            Ver todos os jobs
          </Link>
        </div>
      )}
    </div>
  );
}
