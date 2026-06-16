import type { PropsWithChildren, ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`rounded-xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-stone-500">{children}</h2>;
}

export function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg bg-stone-50 px-3 py-2">
      <div className="text-xs text-stone-500">{label}</div>
      <div className="text-lg font-semibold text-stone-800">{value}</div>
    </div>
  );
}

const RISK_LABELS: Record<string, string> = {
  high_wind: 'High wind',
  fungal_pressure: 'Fungal pressure',
  heat_stress: 'Heat stress',
};

export function Chip({ children, tone = 'stone' }: PropsWithChildren<{ tone?: 'stone' | 'amber' | 'green' }>) {
  const tones = {
    stone: 'bg-stone-100 text-stone-700',
    amber: 'bg-amber-100 text-amber-800',
    green: 'bg-green-100 text-green-800',
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function riskLabel(flag: string): string {
  return RISK_LABELS[flag] ?? flag;
}

/** Stacked horizontal bar for the canopy health breakdown. */
export function HealthBar({
  healthy,
  stressed,
  dead,
}: {
  healthy: number;
  stressed: number;
  dead: number;
}) {
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        <div className="bg-green-500" style={{ width: pct(healthy) }} title={`Healthy ${pct(healthy)}`} />
        <div className="bg-amber-400" style={{ width: pct(stressed) }} title={`Stressed ${pct(stressed)}`} />
        <div className="bg-red-500" style={{ width: pct(dead) }} title={`Dead ${pct(dead)}`} />
      </div>
      <div className="mt-1 flex gap-3 text-xs text-stone-500">
        <span>🟢 Healthy {pct(healthy)}</span>
        <span>🟡 Stressed {pct(stressed)}</span>
        <span>🔴 Dead {pct(dead)}</span>
      </div>
    </div>
  );
}
