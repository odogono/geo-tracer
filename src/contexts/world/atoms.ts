import { FeatureCollection } from 'geojson';
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

import { DrawMode, EdgeFeature, FeatureCollectionWithProps } from '@types';

import { createLog } from '../../helpers/log';

const log = createLog('world/atoms');

export const drawModeAtom = atomWithStorage<DrawMode>(
  'geo-path-tracer:drawMode',
  'none'
);

const defaultFeatureCollections: FeatureCollectionWithProps[] = [
  {
    features: [],
    properties: {
      name: 'Route'
    },
    type: 'FeatureCollection'
  },
  {
    features: [],
    properties: {
      name: 'Roads'
    },
    type: 'FeatureCollection'
  },
  {
    features: [],
    properties: {
      name: 'Computed'
    },
    type: 'FeatureCollection'
  }
];

export const featureCollectionsAtom = atomWithStorage<
  FeatureCollectionWithProps[]
>('geo-path-tracer:featureCollections', defaultFeatureCollections);

export const resetFeatureCollectionsAtom = atom(null, (get, set) => {
  set(featureCollectionsAtom, defaultFeatureCollections);
});

export const selectedFeatureCollectionIndexAtom = atom<number>(0);

export const setSelectedFeatureCollectionIndexAtom = atom(
  null,
  (get, set, index: number) => {
    const featureCollections = get(featureCollectionsAtom);
    index = Math.max(0, Math.min(index, featureCollections.length - 1));
    log.debug('setSelectedFeatureCollectionIndexAtom', {
      featureCollections,
      index
    });
    set(selectedFeatureCollectionIndexAtom, index);
  }
);

export const selectedFeatureCollectionAtom = atom<FeatureCollection | null>(
  get => {
    const index = get(selectedFeatureCollectionIndexAtom);
    const featureCollections = get(featureCollectionsAtom);
    return featureCollections[index] || null;
  }
);

export const featureCollectionAtom = atom<FeatureCollection | null>(get => {
  const index = get(selectedFeatureCollectionIndexAtom);
  const featureCollections = get(featureCollectionsAtom);
  return featureCollections[index] || null;
});

/**
 * Set the currently selected feature collection
 */
export const setFeatureCollectionAtom = atom(
  null,
  (get, set, featureCollection: FeatureCollectionWithProps) => {
    const featureCollections = get(featureCollectionsAtom);
    // log.debug(
    //   '[setFeatureCollectionAtom] featureCollections',
    //   featureCollections
    // );
    const index = get(selectedFeatureCollectionIndexAtom);
    // log.debug(
    //   '[setFeatureCollectionAtom] setting featureCollection',
    //   featureCollection
    // );
    // log.debug('[setFeatureCollectionAtom] index', index);

    // featureCollections[index] = featureCollection;
    set(featureCollectionsAtom, [
      ...featureCollections.slice(0, index),
      featureCollection,
      ...featureCollections.slice(index + 1)
    ]);
  }
);

/**
 * Set a feature collection at a specific index
 */
export const setFeatureCollectionAtIndexAtom = atom(
  null,
  (get, set, index: number, featureCollection: FeatureCollectionWithProps) => {
    const featureCollections = get(featureCollectionsAtom);

    // featureCollections[index] = featureCollection;

    const newFeatureCollections = [...featureCollections];
    newFeatureCollections[index] = featureCollection;

    set(featureCollectionsAtom, newFeatureCollections);
  }
);

// Current road being drawn
export const currentRoadPointsAtom = atom<GeoJSON.Position[] | null>(null);

// Current edge being drawn
export const currentEdgeAtom = atom<EdgeFeature | null>(null);
