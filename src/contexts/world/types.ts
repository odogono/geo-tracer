import { DrawMode, EdgeFeature, RouteCollection } from '@types';

export type WorldContextType = {
  currentEdge: EdgeFeature | null;
  // Road drawing state
  currentRoadPoints: GeoJSON.Position[];

  drawMode: DrawMode;
  roadCollection: RouteCollection;
  setCurrentEdge: (edge: EdgeFeature | null) => void;
  setCurrentRoadPoints: (points: GeoJSON.Position[]) => void;
  setDrawMode: (drawMode: DrawMode) => void;
  setRoadCollection: (collection: RouteCollection) => void;
};
