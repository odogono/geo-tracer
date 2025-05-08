import { MappedGpsPointFeature, RoadFeature } from '@types';

export type NodeMap = Map<string, MappedGpsPointFeature | RoadFeature>;

export type NodeRoadMap = Map<string, Set<string>>;

export type VisitContext = {
  currentGpsIndex: number;
  currentHash: string;
  gpsPoints: MappedGpsPointFeature[];
  includeAllGpsPoints: boolean;
  nodeMap: NodeMap;
  nodeRoadMap: NodeRoadMap;
  path: string[];
  roads: RoadFeature[];
};
