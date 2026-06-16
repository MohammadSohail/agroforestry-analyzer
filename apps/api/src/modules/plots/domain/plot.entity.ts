/**
 * Plot — a parcel of land under agroforestry management. Plain domain type with
 * no ORM/framework coupling; repositories map persistence rows into this shape.
 */
export interface Plot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  areaAcres: number | null;
  primarySpecies: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewPlot {
  name: string;
  latitude: number;
  longitude: number;
  areaAcres?: number | null;
  primarySpecies?: string | null;
  notes?: string | null;
}

export type PlotUpdate = Partial<NewPlot>;
