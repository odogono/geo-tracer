import { useState } from 'react';

import { Feature } from 'geojson';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

import { DrawMode } from '@types';

import {
  featureCollectionAtom,
  featureCollectionsAtom,
  selectedFeatureCollectionIndexAtom,
  selectedFeaturesAtom,
  setFeatureCollectionAtom,
  setSelectedFeatureCollectionIndexAtom
} from '../atoms';

export type UseModelResult = ReturnType<typeof useModel>;

export const useModel = () => {
  const [drawMode, setDrawMode] = useState<DrawMode>('none');
  const [highlightedFeature, setHighlightedFeature] = useState<Feature | null>(
    null
  );
  const [selectedFeatures, setSelectedFeatures] = useAtom(selectedFeaturesAtom);

  const [featureCollections, setFeatureCollections] = useAtom(
    featureCollectionsAtom
  );
  const featureCollection = useAtomValue(featureCollectionAtom);
  const setFeatureCollection = useSetAtom(setFeatureCollectionAtom);

  const selectedFeatureCollectionIndex = useAtomValue(
    selectedFeatureCollectionIndexAtom
  );
  const setSelectedFeatureCollectionIndex = useSetAtom(
    setSelectedFeatureCollectionIndexAtom
  );

  return {
    drawMode,
    featureCollection,
    featureCollections,
    highlightedFeature,
    selectedFeatureCollectionIndex,
    selectedFeatures,
    setDrawMode,
    setFeatureCollection,
    setFeatureCollections,
    setHighlightedFeature,
    setSelectedFeatureCollectionIndex,
    setSelectedFeatures
  };
};
