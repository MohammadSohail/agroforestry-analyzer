import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Card, Chip, SectionTitle, Stat, riskLabel } from './ui';

export function InsightPanel({ plotId }: { plotId: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['insight', plotId],
    queryFn: () => api.getInsight(plotId),
  });

  return (
    <Card>
      <SectionTitle>Agronomic weather insight</SectionTitle>
      {isLoading && <p className="text-sm text-stone-400">Loading insight…</p>}
      {isError && <p className="text-sm text-red-600">Could not load insight.</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Temp" value={`${data.current.temperatureC}°C`} />
            <Stat label="Humidity" value={`${data.current.humidityPct}%`} />
            <Stat label="Wind" value={`${data.current.windKph} kph`} />
            <Stat label="Sky" value={data.current.conditions} />
          </div>
          <p className="mt-3 text-sm text-stone-700">{data.agronomic.summary}</p>
          {data.agronomic.riskFlags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {data.agronomic.riskFlags.map((f) => (
                <Chip key={f} tone="amber">
                  ⚠ {riskLabel(f)}
                </Chip>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
