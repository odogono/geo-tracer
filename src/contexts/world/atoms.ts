import { atomWithStorage } from 'jotai/utils';

import { DrawMode, RouteCollection } from '@types';

export const drawModeAtom = atomWithStorage<DrawMode>(
  'geo-path-tracer:drawMode',
  'none'
);

export const routeCollectionAtom = atomWithStorage<RouteCollection>(
  'geo-path-tracer:routeCollection',
  {
    features: [],
    type: 'FeatureCollection'
  }
);

export const roadCollectionAtom = atomWithStorage<RouteCollection>(
  'geo-path-tracer:roadCollection',
  {
    features: [],
    type: 'FeatureCollection'
  }
);
