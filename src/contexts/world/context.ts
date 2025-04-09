import { createContext, useContext } from 'react';

// import { Feature, FeatureCollection } from 'geojson';

// import { DrawMode } from '@types';
import { WorldContextType } from './types';

export const WorldContext = createContext<WorldContextType | null>(null);

export const useWorld = () => {
  const context = useContext(WorldContext);
  if (!context) {
    throw new Error('useWorld must be used within a WorldProvider');
  }
  return context;
};
