import { MappedGpsPointFeature, RoadFeature } from '@types';

export type NodeMap = Map<string, MappedGpsPointFeature | RoadFeature>;

export type VisitContext = {
  currentGpsIndex: number;
  currentHash: string;
  gpsPoints: MappedGpsPointFeature[];
  nodeMap: NodeMap;
  path: string[];
  roads: RoadFeature[];
  visitedNodes: Set<string>;
};
