import type { Analysis } from '../api/types';
import { Card, Chip, HealthBar, Stat } from './ui';

export function AnalysisCard({ analysis }: { analysis: Analysis }) {
  if (analysis.status === 'FAILED') {
    return (
      <Card className="border-red-200 bg-red-50">
        <div className="font-semibold text-red-800">Analysis failed</div>
        <p className="mt-1 text-sm text-red-700">{analysis.failureReason ?? 'Unknown error.'}</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Chip tone="green">COMPLETED</Chip>
          {analysis.speciesGuess && <Chip>{analysis.speciesGuess}</Chip>}
        </div>
        <span className="text-xs text-stone-400">{new Date(analysis.createdAt).toLocaleString()}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="Trees" value={analysis.treeCount ?? '—'} />
        <Stat label="Canopy" value={`${analysis.canopyCoveragePct ?? '—'}%`} />
        <Stat label="Density / acre" value={analysis.densityPerAcre ?? '—'} />
        <Stat
          label="Confidence"
          value={analysis.confidenceScore != null ? `${Math.round(analysis.confidenceScore * 100)}%` : '—'}
        />
      </div>

      {analysis.healthBreakdown && (
        <div className="mt-4">
          <div className="mb-1 text-xs font-medium text-stone-500">Canopy health</div>
          <HealthBar {...analysis.healthBreakdown} />
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {analysis.observations.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-medium text-stone-500">Observations</div>
            <ul className="list-disc pl-4 text-sm text-stone-700">
              {analysis.observations.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </div>
        )}
        {analysis.recommendations.length > 0 && (
          <div>
            <div className="mb-1 text-xs font-medium text-stone-500">Recommendations</div>
            <ul className="list-disc pl-4 text-sm text-stone-700">
              {analysis.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {(analysis.sourceImageUrl || analysis.overlayImageUrl) && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {analysis.sourceImageUrl && (
            <figure>
              <img
                src={analysis.sourceImageUrl}
                alt="Source"
                className="h-40 w-full rounded-lg object-cover"
              />
              <figcaption className="mt-1 text-center text-xs text-stone-400">Source image</figcaption>
            </figure>
          )}
          {analysis.overlayImageUrl && (
            <figure>
              <img
                src={analysis.overlayImageUrl}
                alt="Canopy overlay"
                className="h-40 w-full rounded-lg object-cover"
              />
              <figcaption className="mt-1 text-center text-xs text-stone-400">Canopy overlay</figcaption>
            </figure>
          )}
        </div>
      )}
    </Card>
  );
}
