import { Position } from 'geojson';

import { MappedGpsPointFeature, RoadFeature } from '@types';

import { NodeMap, VisitContext } from './types';

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

export const getCommonRoad = (
  context: VisitContext,
  hashA: string,
  hashB: string
): RoadFeature | undefined => {
  const { nodeMap, nodeRoadMap } = context;
  const roadSetA = nodeRoadMap.get(hashA);
  const roadSetB = nodeRoadMap.get(hashB);

  if (!roadSetA || !roadSetB) {
    console.error('roadSet not found', { hashA, hashB, roadSetA, roadSetB });
    return undefined;
  }

  for (const roadHash of roadSetA) {
    if (roadSetB.has(roadHash)) {
      return nodeMap.get(roadHash) as RoadFeature;
    }
  }

  const node = nodeMap.get(hashA) as MappedGpsPointFeature | undefined;
  if (!node) {
    console.error('node not found', hashA);
    return undefined;
  }

  // fall-back to defined road
  return getNodeRoad(nodeMap, node.properties.roadHash ?? node.properties.hash);
};

export const getRoadIndex = (
  _context: VisitContext,
  road: RoadFeature,
  node: MappedGpsPointFeature
) => {
  const hash = node.properties.hash;
  const roadHash = node.properties.roadHash;

  // console.debug('[getRoadIndex]', {
  //   hash,
  //   index: node.properties.index,
  //   road: road.properties.hash,
  //   roadHash
  // });

  if (roadHash === road.properties.hash) {
    return node.properties.index;
  }

  const [start, end] = getRoadNodeIds(road.properties.hash);

  // console.debug('[getRoadIndex]', {
  //   end,
  //   start
  // });

  if (start === hash) {
    return 0;
  }

  if (end === hash) {
    return road.geometry.coordinates.length - 1;
  }

  return node.properties.index;
};

export const arePositionsEqual = (
  pos1: Position | undefined,
  pos2: Position | undefined
): boolean => {
  if (!pos1 || !pos2) {
    return false;
  }
  if (pos1.length !== pos2.length) {
    return false;
  }
  for (let i = 0; i < pos1.length; i++) {
    if (pos1[i] !== pos2[i]) {
      return false;
    }
  }
  return true;
};
