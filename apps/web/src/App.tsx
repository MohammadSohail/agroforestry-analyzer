import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { api } from './api/client';
import { NewPlotForm } from './components/NewPlotForm';
import { PlotDetail } from './components/PlotDetail';
import { Card, Chip, SectionTitle } from './components/ui';

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const plots = useQuery({ queryKey: ['plots'], queryFn: () => api.listPlots() });
  const quota = useQuery({ queryKey: ['quota'], queryFn: () => api.getQuota() });

  // Default to the first plot once loaded.
  useEffect(() => {
    if (!selectedId && plots.data?.data.length) setSelectedId(plots.data.data[0].id);
  }, [plots.data, selectedId]);

  const selected = plots.data?.data.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-lg font-bold">🌳 Agroforestry Analyzer</h1>
            <p className="text-xs text-stone-500">Tree-canopy analytics on the WeatherAI API</p>
          </div>
          {quota.data && (
            <div className="flex items-center gap-2 text-sm">
              <Chip tone="green">plan: {quota.data.plan}</Chip>
              <Chip>
                {quota.data.remaining}/{quota.data.limit} analyses left
              </Chip>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-6 py-6 md:grid-cols-[300px_1fr]">
        <aside className="space-y-4">
          <Card>
            <SectionTitle>New plot</SectionTitle>
            <NewPlotForm onCreated={(p) => setSelectedId(p.id)} />
          </Card>

          <Card>
            <SectionTitle>Plots</SectionTitle>
            {plots.isLoading && <p className="text-sm text-stone-400">Loading…</p>}
            {plots.isError && (
              <p className="text-sm text-red-600">
                Cannot reach the API. Is it running at {import.meta.env.VITE_API_URL ?? 'localhost:3000'}?
              </p>
            )}
            <ul className="space-y-1">
              {plots.data?.data.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => setSelectedId(p.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                      p.id === selectedId
                        ? 'bg-green-700 text-white'
                        : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </aside>

        <section>
          {selected ? (
            <PlotDetail plot={selected} />
          ) : (
            <Card>
              <p className="text-sm text-stone-500">
                {plots.isLoading ? 'Loading…' : 'Create or select a plot to get started.'}
              </p>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
