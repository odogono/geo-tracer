import { ReactNode, useState } from 'react';

import { Feature } from 'geojson';
import { useAtom } from 'jotai';

import { DrawMode, RouteCollection } from '@types';

import {
  currentEdgeAtom,
  currentRoadPointsAtom,
  roadCollectionAtom
} from './atoms';
import { WorldContext } from './context';

type Props = {
  children: ReactNode;
};

export const WorldProvider = ({ children }: Props) => {
  const [drawMode, setDrawMode] = useState<DrawMode>('none');
  const [currentRoadPoints, setCurrentRoadPoints] = useAtom(
    currentRoadPointsAtom
  );
  const [currentEdge, setCurrentEdge] = useAtom(currentEdgeAtom);
  const [roadCollection, setRoadCollection] =
    useAtom<RouteCollection>(roadCollectionAtom);
  const [highlightedFeature, setHighlightedFeature] = useState<Feature | null>(
    null
  );

  return (
    <WorldContext.Provider
      value={{
        currentEdge,
        currentRoadPoints,
        drawMode,
        highlightedFeature,
        roadCollection,
        setCurrentEdge,
        setCurrentRoadPoints,
        setDrawMode,
        setHighlightedFeature,
        setRoadCollection
      }}
    >
      {children}
    </WorldContext.Provider>
  );
};
