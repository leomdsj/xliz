'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

const WORKFLOWS = [
  {
    id: 'transportadora-entrada-saida',
    name: 'Entrada e Saída — Transportadora',
    description: 'Registra entrada e saída de encomendas no portal da transportadora',
  },
];

export default function NewJobPage() {
  const router = useRouter();
  const [workflowId, setWorkflowId] = useState(WORKFLOWS[0].id);
  const [barcodesRaw, setBarcodesRaw] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const barcodes = barcodesRaw
    .split('\n')
    .map((b) => b.trim())
    .filter(Boolean);

  const selectedWorkflow = WORKFLOWS.find((w) => w.id === workflowId)!;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!barcodes.length) {
      setError('Informe ao menos um código de barras.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { job_id } = await api.createJob({
        workflow_id: workflowId,
        inputs: { barcodes },
      });

      // Persist job_id locally so the dashboard can list it
      const stored: string[] = JSON.parse(localStorage.getItem('xliz:job_ids') ?? '[]');
      localStorage.setItem('xliz:job_ids', JSON.stringify([job_id, ...stored]));

      router.push(`/jobs/${job_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar job');
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-1">Novo Job</h1>
      <p className="text-zinc-400 text-sm mb-8">
        Selecione o workflow e cole os códigos de barras para executar
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Workflow selector */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Workflow
          </label>
          <div className="space-y-2">
            {WORKFLOWS.map((w) => (
              <label
                key={w.id}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                  workflowId === w.id
                    ? 'border-violet-600 bg-violet-900/20'
                    : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'
                }`}
              >
                <input
                  type="radio"
                  name="workflow"
                  value={w.id}
                  checked={workflowId === w.id}
                  onChange={() => setWorkflowId(w.id)}
                  className="mt-0.5 accent-violet-600"
                />
                <div>
                  <p className="text-white font-medium text-sm">{w.name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">{w.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Barcodes textarea */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Códigos de barras{' '}
            {barcodes.length > 0 && (
              <span className="text-violet-400 font-normal">({barcodes.length} detectados)</span>
            )}
          </label>
          <textarea
            value={barcodesRaw}
            onChange={(e) => setBarcodesRaw(e.target.value)}
            placeholder={'123456789\n987654321\n456789123'}
            rows={10}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white font-mono text-sm placeholder-zinc-700 focus:outline-none focus:border-violet-600 resize-none"
          />
          <p className="text-xs text-zinc-600 mt-1.5">Um código por linha</p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || barcodes.length === 0}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            {submitting && (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            {submitting ? 'Enviando…' : `Executar ${barcodes.length > 0 ? `(${barcodes.length})` : ''}`}
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="text-zinc-400 hover:text-zinc-200 text-sm px-4 py-2.5 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
