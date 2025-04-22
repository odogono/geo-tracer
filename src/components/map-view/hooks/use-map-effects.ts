import { useEffect } from 'react';

import { useWorld } from '@contexts/world/use-world';
import { RouteCollection } from '@types';

export const useMapEffects = (
  mapInstance: maplibregl.Map | null,
  fitMapToFeatureCollection: (
    featureCollection?: RouteCollection | undefined
  ) => void,
  updateLayerIds: () => void
) => {
  const { drawMode, featureCollection, featureCollections } = useWorld();

  // Fit map to bounds when drawMode changes
  useEffect(() => {
    if (drawMode === 'none') {
      // fitMapToFeatureCollections();
    }
  }, [fitMapToFeatureCollection, drawMode]);

  // Fit map to bounds when map instance is loaded
  useEffect(() => {
    if (
      mapInstance &&
      featureCollections.length > 0 &&
      featureCollections.some(collection => collection.features.length > 0)
    ) {
      // console.debug('fitMapToFeatureCollection', featureCollection);
      fitMapToFeatureCollection(featureCollection as RouteCollection);
    }
  }, [
    mapInstance,
    fitMapToFeatureCollection,
    featureCollections,
    featureCollection
  ]);

  // Update layer IDs when feature collections change
  useEffect(() => {
    updateLayerIds();
  }, [updateLayerIds]);
};
