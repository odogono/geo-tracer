import { Feature, FeatureCollection } from 'geojson';

import { DrawMode } from '@types';

export type WorldContextType = {
  drawMode: DrawMode;
  featureCollection: FeatureCollection | null;
  featureCollections: FeatureCollection[];
  highlightedFeature: Feature | null;
  selectedFeatureCollectionIndex: number;
  setDrawMode: (mode: DrawMode) => void;
  setFeatureCollection: (featureCollection: FeatureCollection) => void;
  setFeatureCollections: (collections: FeatureCollection[]) => void;
  setHighlightedFeature: (feature: Feature | null) => void;
  setSelectedFeatureCollectionIndex: (index: number) => void;
};
