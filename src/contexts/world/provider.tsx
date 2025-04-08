import { useAtom } from 'jotai';

import { RouteCollection } from '@types';

import {
  currentEdgeAtom,
  currentRoadPointsAtom,
  drawModeAtom,
  roadCollectionAtom
} from './atoms';
import { WorldContext } from './context';

export const WorldProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [drawMode, setDrawMode] = useAtom(drawModeAtom);
  const [currentRoadPoints, setCurrentRoadPoints] = useAtom(
    currentRoadPointsAtom
  );
  const [currentEdge, setCurrentEdge] = useAtom(currentEdgeAtom);
  const [roadCollection, setRoadCollection] =
    useAtom<RouteCollection>(roadCollectionAtom);

  return (
    <WorldContext.Provider
      value={{
        currentEdge,
        currentRoadPoints,
        drawMode,
        roadCollection,
        setCurrentEdge,
        setCurrentRoadPoints,
        setDrawMode,
        setRoadCollection
      }}
    >
      {children}
    </WorldContext.Provider>
  );
};
