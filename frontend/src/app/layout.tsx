import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'xliz — Automação Web',
  description: 'Plataforma de automação de tarefas repetitivas na web',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur border-b border-zinc-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <Logo />
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                href="/jobs/new"
                className="bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                + Novo Job
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
          {children}
        </main>

        <footer className="border-t border-zinc-900 py-4 text-center text-xs text-zinc-700">
          xliz &mdash; automação web para times operacionais
        </footer>
      </body>
    </html>
  );
}
