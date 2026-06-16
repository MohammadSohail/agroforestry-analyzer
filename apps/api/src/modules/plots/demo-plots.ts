import { NewPlot } from './domain/plot.entity';

/**
 * Demo dataset used to populate an empty database (boot-time seeder + `prisma db seed`),
 * so the dashboard isn't empty on first load. Realistic agroforestry parcels.
 */
export const DEMO_PLOTS: NewPlot[] = [
  {
    name: 'Bomet Highland Block A',
    latitude: -0.7813,
    longitude: 35.3416,
    areaAcres: 12.5,
    primarySpecies: 'Grevillea robusta',
    notes: 'Agroforestry intercrop with tea; monitored for canopy thinning.',
  },
  {
    name: 'Embu Coffee Shade Block',
    latitude: -0.538,
    longitude: 37.4575,
    areaAcres: 9.5,
    primarySpecies: 'Cordia africana',
    notes: 'Shade trees over smallholder coffee.',
  },
  {
    name: 'Meru Avocado Belt B',
    latitude: 0.047,
    longitude: 37.649,
    areaAcres: 7.0,
    primarySpecies: 'Persea americana',
    notes: 'Boundary planting around avocado orchards.',
  },
  {
    name: 'Nakuru Riparian Strip',
    latitude: -0.3031,
    longitude: 36.08,
    areaAcres: 4.2,
    primarySpecies: 'Acacia xanthophloea',
    notes: 'Riverbank stabilisation planting.',
  },
  {
    name: 'Kericho Shade Plot 7',
    latitude: -0.3677,
    longitude: 35.2831,
    areaAcres: 8.0,
    primarySpecies: 'Eucalyptus grandis',
    notes: 'Shade trees over smallholder tea.',
  },
  {
    name: 'Machakos Dryland Trial',
    latitude: -1.517,
    longitude: 37.263,
    areaAcres: 15.3,
    primarySpecies: 'Melia volkensii',
    notes: 'Drought-tolerant species trial on semi-arid land.',
  },
  {
    name: 'Kakamega Forest Edge 12',
    latitude: 0.287,
    longitude: 34.865,
    areaAcres: 6.4,
    primarySpecies: 'Markhamia lutea',
    notes: 'Buffer planting along indigenous forest boundary.',
  },
  {
    name: 'Eldoret Windbreak Row 4',
    latitude: 0.514,
    longitude: 35.2698,
    areaAcres: 3.1,
    primarySpecies: 'Cupressus lusitanica',
    notes: 'Windbreak rows protecting maize fields.',
  },
];
