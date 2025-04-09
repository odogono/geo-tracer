import { createContext, useContext } from 'react';

import { Feature } from 'geojson';

import { DrawMode } from '@types';

export type WorldContextType = {
  drawMode: DrawMode;
  highlightedFeature: Feature | null;
  roadCollection: GeoJSON.FeatureCollection;
  setDrawMode: (mode: DrawMode) => void;
  setHighlightedFeature: (feature: Feature | null) => void;
  setRoadCollection: (collection: GeoJSON.FeatureCollection) => void;
};

export const WorldContext = createContext<WorldContextType | null>(null);

export const useWorld = () => {
  const context = useContext(WorldContext);
  if (!context) {
    throw new Error('useWorld must be used within a WorldProvider');
  }
  return context;
};
