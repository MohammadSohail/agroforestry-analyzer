import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { api } from '../api/client';
import { Card, SectionTitle } from './ui';

const SAMPLES = [
  { file: 'aerial-forest.webp', label: 'Aerial photo', type: 'image/webp' },
  { file: 'canopy-dense.png', label: 'Dense canopy', type: 'image/png' },
  { file: 'canopy-sparse.png', label: 'Sparse canopy', type: 'image/png' },
  { file: 'canopy-stressed.png', label: 'Stressed canopy', type: 'image/png' },
];

export function UploadCard({ plotId }: { plotId: string }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (file: File) => api.uploadAnalysis(plotId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analyses', plotId] });
      qc.invalidateQueries({ queryKey: ['quota'] });
      setPending(null);
      if (inputRef.current) inputRef.current.value = '';
    },
    onError: () => setPending(null),
  });

  async function runSample(sample: { file: string; label: string; type: string }) {
    setPending(sample.label);
    const res = await fetch(`${import.meta.env.BASE_URL}samples/${sample.file}`);
    const blob = await res.blob();
    mutation.mutate(new File([blob], sample.file, { type: sample.type }));
  }

  return (
    <Card>
      <SectionTitle>Run a canopy analysis</SectionTitle>
      <p className="mb-3 text-sm text-stone-500">
        Upload drone or satellite imagery (PNG/JPEG/WEBP/TIFF, ≤20 MB), or try a bundled sample.
        The WeatherAI provider returns tree count, canopy coverage, and health.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/tiff"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setPending(file.name);
            mutation.mutate(file);
          }
        }}
        className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-green-800"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-stone-400">Try a sample:</span>
        {SAMPLES.map((s) => (
          <button
            key={s.file}
            type="button"
            disabled={mutation.isPending}
            onClick={() => runSample(s)}
            className="rounded-full border border-green-700 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-50 disabled:opacity-40"
          >
            {s.label}
          </button>
        ))}
      </div>

      {mutation.isPending && <p className="mt-2 text-sm text-stone-500">Analyzing {pending}…</p>}
      {mutation.isError && (
        <p className="mt-2 text-sm text-red-600">{(mutation.error as Error).message}</p>
      )}
    </Card>
  );
}
