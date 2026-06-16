import type {
  Analysis,
  CreatePlotInput,
  Paginated,
  Plot,
  Quota,
  WeatherInsight,
} from './types';

const BASE = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const API = `${BASE}/api/v1`;

/** Surfaces the API's RFC7807 `problem+json` detail as the error message. */
async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      detail = body.detail ?? body.message ?? detail;
    } catch {
      /* ignore non-JSON bodies */
    }
    throw new Error(detail);
  }
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T);
}

export const api = {
  listPlots: () => fetch(`${API}/plots?limit=100`).then((r) => handle<Paginated<Plot>>(r)),

  createPlot: (input: CreatePlotInput) =>
    fetch(`${API}/plots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then((r) => handle<Plot>(r)),

  listAnalyses: (plotId: string) =>
    fetch(`${API}/plots/${plotId}/analyses?limit=50`).then((r) => handle<Paginated<Analysis>>(r)),

  uploadAnalysis: (plotId: string, file: File) => {
    const form = new FormData();
    form.append('image', file);
    return fetch(`${API}/plots/${plotId}/analyses`, { method: 'POST', body: form }).then((r) =>
      handle<Analysis>(r),
    );
  },

  getInsight: (plotId: string) =>
    fetch(`${API}/plots/${plotId}/insight`).then((r) => handle<WeatherInsight>(r)),

  getQuota: () => fetch(`${API}/quota`).then((r) => handle<Quota>(r)),
};
