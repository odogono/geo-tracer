import { useEffect } from 'react';

import { useWorld } from '@contexts/world/use-world';

export const useMapEffects = (
  mapInstance: maplibregl.Map | null,
  fitMapToFeatureCollections: () => void,
  updateLayerIds: () => void
) => {
  const { drawMode, featureCollections } = useWorld();

  // Fit map to bounds when drawMode changes
  useEffect(() => {
    if (drawMode === 'none') {
      // fitMapToFeatureCollections();
    }
  }, [fitMapToFeatureCollections, drawMode]);

  // Fit map to bounds when map instance is loaded
  useEffect(() => {
    if (
      mapInstance &&
      featureCollections.length > 0 &&
      featureCollections.some(collection => collection.features.length > 0)
    ) {
      fitMapToFeatureCollections();
    }
  }, [mapInstance, fitMapToFeatureCollections, featureCollections]);

  // Update layer IDs when feature collections change
  useEffect(() => {
    updateLayerIds();
  }, [updateLayerIds]);
};
