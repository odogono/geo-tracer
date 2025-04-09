import { FeatureCollection } from 'geojson';
import { createStore } from 'jotai';
import { describe, expect, it } from 'vitest';

import { EdgeFeature } from '@types';

import { createLog } from '../../../helpers/log';
import {
  currentEdgeAtom,
  currentRoadPointsAtom,
  drawModeAtom,
  featureCollectionAtom,
  featureCollectionsAtom,
  selectedFeatureCollectionAtom,
  selectedFeatureCollectionIndexAtom,
  setFeatureCollectionAtom,
  setSelectedFeatureCollectionIndexAtom
} from '../atoms';

const log = createLog('test/atoms');

// Create a store for testing
const createTestStore = () => {
  const store = createStore();
  return store;
};

describe('World Atoms', () => {
  describe('drawModeAtom', () => {
    it('should initialize with default value', () => {
      const store = createTestStore();
      const value = store.get(drawModeAtom);
      expect(value).toBe('none');
    });

    it('should update when set', () => {
      const store = createTestStore();
      store.set(drawModeAtom, 'road');
      const value = store.get(drawModeAtom);
      expect(value).toBe('road');
    });
  });

  describe('featureCollectionsAtom', () => {
    it('should initialize with empty feature collection', () => {
      const store = createTestStore();
      const value = store.get(featureCollectionsAtom);
      expect(value).toEqual([{ features: [], type: 'FeatureCollection' }]);
    });

    it('should update when set', () => {
      const store = createTestStore();
      const newCollection: FeatureCollection = {
        features: [],
        type: 'FeatureCollection'
      };
      store.set(featureCollectionsAtom, [newCollection]);
      const value = store.get(featureCollectionsAtom);
      expect(value).toEqual([newCollection]);
    });
  });

  describe('selectedFeatureCollectionIndexAtom', () => {
    it('should initialize with 0', () => {
      const store = createTestStore();
      const value = store.get(selectedFeatureCollectionIndexAtom);
      expect(value).toBe(0);
    });

    it('should update when set', () => {
      const store = createTestStore();
      store.set(selectedFeatureCollectionIndexAtom, 1);
      const value = store.get(selectedFeatureCollectionIndexAtom);
      expect(value).toBe(1);
    });
  });

  describe('setSelectedFeatureCollectionIndexAtom', () => {
    it('should set index within valid range', () => {
      const store = createTestStore();
      // Set up feature collections with 3 items
      store.set(featureCollectionsAtom, [
        { features: [], type: 'FeatureCollection' },
        { features: [], type: 'FeatureCollection' },
        { features: [], type: 'FeatureCollection' }
      ]);

      // Test setting to a valid index
      store.set(setSelectedFeatureCollectionIndexAtom, 1);
      expect(store.get(selectedFeatureCollectionIndexAtom)).toBe(1);

      // Test setting to an index below range (should clamp to 0)
      store.set(setSelectedFeatureCollectionIndexAtom, -1);
      expect(store.get(selectedFeatureCollectionIndexAtom)).toBe(0);

      // Test setting to an index above range (should clamp to length-1)
      store.set(setSelectedFeatureCollectionIndexAtom, 5);
      expect(store.get(selectedFeatureCollectionIndexAtom)).toBe(2);
    });
  });

  describe('selectedFeatureCollectionAtom', () => {
    it('should return the selected feature collection', () => {
      const store = createTestStore();
      const collections: FeatureCollection[] = [
        { features: [], type: 'FeatureCollection' },
        {
          features: [
            {
              geometry: { coordinates: [0, 0], type: 'Point' },
              properties: {},
              type: 'Feature'
            }
          ],
          type: 'FeatureCollection'
        }
      ];

      store.set(featureCollectionsAtom, collections);
      store.set(selectedFeatureCollectionIndexAtom, 1);

      const value = store.get(selectedFeatureCollectionAtom);
      expect(value).toEqual(collections[1]);
    });

    it('should return null if index is out of bounds', () => {
      const store = createTestStore();
      const collections: FeatureCollection[] = [
        { features: [], type: 'FeatureCollection' }
      ];

      store.set(featureCollectionsAtom, collections);
      store.set(selectedFeatureCollectionIndexAtom, 1); // Out of bounds

      const value = store.get(selectedFeatureCollectionAtom);
      expect(value).toBeNull();
    });
  });

  describe('featureCollectionAtom', () => {
    it('should return the selected feature collection', () => {
      const store = createTestStore();
      const collections: FeatureCollection[] = [
        { features: [], type: 'FeatureCollection' },
        {
          features: [
            {
              geometry: { coordinates: [0, 0], type: 'Point' },
              properties: {},
              type: 'Feature'
            }
          ],
          type: 'FeatureCollection'
        }
      ];

      store.set(featureCollectionsAtom, collections);
      store.set(selectedFeatureCollectionIndexAtom, 1);

      const value = store.get(featureCollectionAtom);
      expect(value).toEqual(collections[1]);
    });

    it('should return null if index is out of bounds', () => {
      const store = createTestStore();
      const collections: FeatureCollection[] = [
        { features: [], type: 'FeatureCollection' }
      ];

      store.set(featureCollectionsAtom, collections);
      store.set(selectedFeatureCollectionIndexAtom, 1); // Out of bounds

      const value = store.get(featureCollectionAtom);
      expect(value).toBeNull();
    });
  });

  describe.only('setFeatureCollectionAtom', () => {
    it('should update the selected feature collection', () => {
      const store = createTestStore();
      const collections: FeatureCollection[] = [
        { features: [], type: 'FeatureCollection' },
        { features: [], type: 'FeatureCollection' }
      ];

      store.set(featureCollectionsAtom, collections);
      store.set(selectedFeatureCollectionIndexAtom, 1);

      const newCollection: FeatureCollection = {
        features: [
          {
            geometry: { coordinates: [0, 0], type: 'Point' },
            properties: {},
            type: 'Feature'
          }
        ],
        type: 'FeatureCollection'
      };

      log.debug('setFeatureCollectionAtom', newCollection);
      store.set(setFeatureCollectionAtom, newCollection);

      const updatedCollections = store.get(featureCollectionsAtom);
      expect(updatedCollections[1]).toEqual(newCollection);

      log.debug('updatedCollections', updatedCollections);
    });
  });

  describe('currentRoadPointsAtom', () => {
    it('should initialize with null', () => {
      const store = createTestStore();
      const value = store.get(currentRoadPointsAtom);
      expect(value).toBeNull();
    });

    it('should update when set', () => {
      const store = createTestStore();
      const points: GeoJSON.Position[] = [
        [0, 0],
        [1, 1]
      ];
      store.set(currentRoadPointsAtom, points);
      const value = store.get(currentRoadPointsAtom);
      expect(value).toEqual(points);
    });
  });

  describe('currentEdgeAtom', () => {
    it('should initialize with null', () => {
      const store = createTestStore();
      const value = store.get(currentEdgeAtom);
      expect(value).toBeNull();
    });

    it('should update when set', () => {
      const store = createTestStore();
      const edge: EdgeFeature = {
        geometry: {
          coordinates: [
            [0, 0],
            [1, 1]
          ],
          type: 'LineString'
        },
        properties: {
          hash: 'test',
          length: 1,
          type: 'edge'
        },
        type: 'Feature'
      };
      store.set(currentEdgeAtom, edge);
      const value = store.get(currentEdgeAtom);
      expect(value).toEqual(edge);
    });
  });
});
