import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api/client';
import type { Plot } from '../api/types';

const FIELD = 'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none';

export function NewPlotForm({ onCreated }: { onCreated: (plot: Plot) => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', latitude: '', longitude: '', primarySpecies: '' });

  const mutation = useMutation({
    mutationFn: () =>
      api.createPlot({
        name: form.name.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        primarySpecies: form.primarySpecies.trim() || undefined,
      }),
    onSuccess: (plot) => {
      qc.invalidateQueries({ queryKey: ['plots'] });
      setForm({ name: '', latitude: '', longitude: '', primarySpecies: '' });
      onCreated(plot);
    },
  });

  const valid = form.name.trim() && form.latitude !== '' && form.longitude !== '';

  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (valid) mutation.mutate();
      }}
    >
      <input
        className={FIELD}
        placeholder="Plot name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <div className="flex gap-2">
        <input
          className={FIELD}
          placeholder="Latitude"
          inputMode="decimal"
          value={form.latitude}
          onChange={(e) => setForm({ ...form, latitude: e.target.value })}
        />
        <input
          className={FIELD}
          placeholder="Longitude"
          inputMode="decimal"
          value={form.longitude}
          onChange={(e) => setForm({ ...form, longitude: e.target.value })}
        />
      </div>
      <input
        className={FIELD}
        placeholder="Primary species (optional)"
        value={form.primarySpecies}
        onChange={(e) => setForm({ ...form, primarySpecies: e.target.value })}
      />
      <button
        type="submit"
        disabled={!valid || mutation.isPending}
        className="w-full rounded-lg bg-green-700 px-3 py-2 text-sm font-medium text-white hover:bg-green-800 disabled:opacity-40"
      >
        {mutation.isPending ? 'Adding…' : 'Add plot'}
      </button>
      {mutation.isError && <p className="text-xs text-red-600">{(mutation.error as Error).message}</p>}
    </form>
  );
}
