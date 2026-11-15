import type { MartianRegion, RoutesResponse } from './types';

export const demoRegion: MartianRegion = {
  name: 'Gale Crater — Mount Sharp',
  planet: 'Mars',
  dataSource: 'Synthetic Demo Data (Gale Crater Analog)',
  bounds: { south: -5.2, west: 137.2, north: -4.6, east: 137.9 },
  landingPoint: { lat: -4.9, lon: 137.4 },
  landingPointName: 'Landing Point · sample',
  targets: [
    {
      id: 'boxwork-demo-1',
      name: 'Mount Sharp Boxwork Formations',
      coordinate: { lat: -4.92, lon: 137.43 },
      description: 'Network of intersecting mineral ridges.',
      importance: 'High — Key biomarker indicator.',
      images: [{ url: '/manus-storage/mount-sharp-nasa_914df2c1.jpg', type: 'context', credit: 'NASA/JPL-Caltech/ESA/DLR/FU Berlin/MSSS' }],
      raw: {},
    },
  ],
  raw: {},
};

export const demoRoutes: RoutesResponse = {
  regionName: demoRegion.name,
  targetName: demoRegion.targets[0].name,
  routes: [
    {
      profile: 'shortest',
      distanceKm: 4.2,
      durationMin: 95,
      maxSlopeDeg: 18.5,
      averageRadiation: 0.67,
      risk: 'high',
      path: [
        { lat: -4.9, lon: 137.4 },
        { lat: -4.88, lon: 137.45 },
        { lat: -4.92, lon: 137.43 },
      ],
      elevationProfile: [-4400, -4380, -4350],
      minerals: [],
      raw: {},
    },
    {
      profile: 'safest',
      distanceKm: 1.8,
      durationMin: 25,
      risk: 'low',
      path: [
        { lat: -4.9, lon: 137.4 },
        { lat: -4.91, lon: 137.415 },
        { lat: -4.92, lon: 137.43 },
      ],
      elevationProfile: [],
      visualTerrain: 'Smooth rolling plains…',
      surfaceTempC: -12.5,
      pressurePa: 715.2,
      minerals: ['Hydrated sulfates'],
      raw: {},
    },
    {
      profile: 'balanced',
      distanceKm: 2.7,
      durationMin: 39,
      maxSlopeDeg: 8.2,
      averageRadiation: 0.46,
      risk: 'medium',
      path: [
        { lat: -4.9, lon: 137.4 },
        { lat: -4.895, lon: 137.415 },
        { lat: -4.905, lon: 137.425 },
        { lat: -4.92, lon: 137.43 },
      ],
      elevationProfile: [-4400, -4391, -4376, -4365],
      minerals: [],
      raw: {},
    },
  ],
  raw: {},
};
