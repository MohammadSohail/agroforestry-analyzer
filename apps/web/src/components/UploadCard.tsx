import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { api } from '../api/client';
import { Card, SectionTitle } from './ui';

export function UploadCard({ plotId }: { plotId: string }) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (file: File) => api.uploadAnalysis(plotId, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['analyses', plotId] });
      setFileName(null);
      if (inputRef.current) inputRef.current.value = '';
    },
  });

  return (
    <Card>
      <SectionTitle>Run a canopy analysis</SectionTitle>
      <p className="mb-3 text-sm text-stone-500">
        Upload drone or satellite imagery (PNG/JPEG/WEBP/TIFF, ≤20 MB). The WeatherAI provider returns
        tree count, canopy coverage, and health.
      </p>
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/tiff"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setFileName(file.name);
              mutation.mutate(file);
            }
          }}
          className="block w-full text-sm text-stone-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-700 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-green-800"
        />
      </div>
      {mutation.isPending && <p className="mt-2 text-sm text-stone-500">Analyzing {fileName}…</p>}
      {mutation.isError && (
        <p className="mt-2 text-sm text-red-600">{(mutation.error as Error).message}</p>
      )}
    </Card>
  );
}
