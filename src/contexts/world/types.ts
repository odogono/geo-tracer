import type { UseActionsResult } from './hooks/use-actions';
import type { UseModelResult } from './hooks/use-model';

export type WorldContextType = {
  // drawMode: DrawMode;
  // featureCollection: FeatureCollection | null;
  // featureCollections: FeatureCollection[];
  // highlightedFeature: Feature | null;
  // selectedFeatureCollectionIndex: number;
  // setDrawMode: (mode: DrawMode) => void;
  // setFeatureCollection: (featureCollection: FeatureCollectionWithProps) => void;
  // setFeatureCollections: (collections: FeatureCollectionWithProps[]) => void;
  // setHighlightedFeature: (feature: Feature | null) => void;
  // setSelectedFeatureCollectionIndex: (index: number) => void;
} & UseModelResult &
  UseActionsResult;
