import { MappedGpsPointFeature } from '@types';

import { RoadFeature } from '../../types';
import { NodeMap } from './types';

export const hashToS = (hash: string | undefined) => {
  if (!hash) {
    return 'undefined';
  }
  return hash.indexOf('.') > -1
    ? hash
        .split('.')
        .map(s => s.slice(-4))
        .join('.')
    : hash.slice(-4);
};

export const getRoadNodeIds = (roadHash: string) => roadHash.split('.');

export const isNodeRoad = (
  node: MappedGpsPointFeature | RoadFeature | undefined
): node is RoadFeature =>
  node ? node.properties.roadHash === undefined : false;

export const isNodeGpsPoint = (
  node: MappedGpsPointFeature | RoadFeature | undefined
): node is MappedGpsPointFeature => node?.properties.roadHash !== undefined;

export const getNodeRoadHash = (
  node: MappedGpsPointFeature | RoadFeature | undefined
) => (isNodeRoad(node) ? node.properties.hash : node?.properties.roadHash);

export const getNodeGpsPoint = (node: MappedGpsPointFeature | RoadFeature) =>
  isNodeGpsPoint(node) ? node.properties.hash : undefined;

export const getNodeRoad = (
  map: NodeMap,
  nodeHash: string | undefined
): RoadFeature | undefined => {
  if (!nodeHash) {
    return undefined;
  }
  const node = map.get(nodeHash);

  if (!node) {
    return undefined;
  }

  if (isNodeRoad(node)) {
    return node;
  }

  return map.get(node.properties.roadHash) as RoadFeature | undefined;
};

export const getNodeRoadFromStartEnd = (
  map: NodeMap,
  start: string,
  end: string
): RoadFeature | undefined =>
  map.get(`${start}.${end}`) as RoadFeature | undefined;

export const isRoadLinked = (
  roadHash: string | undefined,
  nextRoadHash: string | undefined
) => {
  if (!roadHash || !nextRoadHash) {
    return false;
  }
  const [roadAStart, roadAEnd] = getRoadNodeIds(roadHash);
  const [roadBStart, roadBEnd] = getRoadNodeIds(nextRoadHash);
  return roadAEnd === roadBStart || roadAStart === roadBEnd;
};

export const getLinkedNode = (
  roadAHash: string | undefined,
  roadBHash: string | undefined
) => {
  if (!roadAHash || !roadBHash) {
    return undefined;
  }
  const [roadAStart, roadAEnd] = getRoadNodeIds(roadAHash);
  const [roadBStart, roadBEnd] = getRoadNodeIds(roadBHash);
  if (roadAEnd === roadBStart) {
    return roadAEnd;
  }
  if (roadAStart === roadBEnd) {
    return roadAStart;
  }
  return undefined;
};
