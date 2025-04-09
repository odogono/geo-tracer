import { ReactNode, useState } from 'react';

import { Feature } from 'geojson';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

import { DrawMode } from '@types';

import {
  featureCollectionAtom,
  featureCollectionsAtom,
  selectedFeatureCollectionIndexAtom,
  setFeatureCollectionAtom,
  setSelectedFeatureCollectionIndexAtom
} from './atoms';
import { WorldContext } from './context';

type Props = {
  children: ReactNode;
};

export const WorldProvider = ({ children }: Props) => {
  const [drawMode, setDrawMode] = useState<DrawMode>('none');
  // const [currentRoadPoints, setCurrentRoadPoints] = useAtom(
  //   currentRoadPointsAtom
  // );
  // const [currentEdge, setCurrentEdge] = useAtom(currentEdgeAtom);
  const [highlightedFeature, setHighlightedFeature] = useState<Feature | null>(
    null
  );

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

  return (
    <WorldContext.Provider
      value={{
        drawMode,
        featureCollection,
        featureCollections,
        highlightedFeature,
        selectedFeatureCollectionIndex,
        setDrawMode,
        setFeatureCollection,
        setFeatureCollections,
        setHighlightedFeature,
        setSelectedFeatureCollectionIndex
      }}
    >
      {children}
    </WorldContext.Provider>
  );
};
