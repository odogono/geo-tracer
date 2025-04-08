import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { DrawMode, EdgeFeature, RouteCollection } from '@types';

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

// Current road being drawn
export const currentRoadPointsAtom = atom<GeoJSON.Position[] | null>(null);

// Current edge being drawn
export const currentEdgeAtom = atom<EdgeFeature | null>(null);
