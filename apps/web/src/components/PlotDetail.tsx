import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import type { Plot } from '../api/types';
import { AnalysisCard } from './AnalysisCard';
import { InsightPanel } from './InsightPanel';
import { UploadCard } from './UploadCard';
import { Card, SectionTitle } from './ui';

export function PlotDetail({ plot }: { plot: Plot }) {
  const { data, isLoading } = useQuery({
    queryKey: ['analyses', plot.id],
    queryFn: () => api.listAnalyses(plot.id),
  });

  const analyses = data?.data ?? [];
  const [latest, ...history] = analyses;

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-800">{plot.name}</h1>
            <p className="text-sm text-stone-500">
              {plot.latitude.toFixed(4)}, {plot.longitude.toFixed(4)}
              {plot.primarySpecies ? ` · ${plot.primarySpecies}` : ''}
              {plot.areaAcres ? ` · ${plot.areaAcres} acres` : ''}
            </p>
          </div>
        </div>
      </Card>

      <InsightPanel plotId={plot.id} />
      <UploadCard plotId={plot.id} />

      {isLoading && <p className="text-sm text-stone-400">Loading analyses…</p>}

      {latest && (
        <div>
          <SectionTitle>Latest analysis</SectionTitle>
          <AnalysisCard analysis={latest} />
        </div>
      )}

      {history.length > 0 && (
        <div>
          <SectionTitle>History ({history.length})</SectionTitle>
          <div className="space-y-3">
            {history.map((a) => (
              <AnalysisCard key={a.id} analysis={a} />
            ))}
          </div>
        </div>
      )}

      {!isLoading && analyses.length === 0 && (
        <p className="text-sm text-stone-400">No analyses yet — upload an image to run the first one.</p>
      )}
    </div>
  );
}
