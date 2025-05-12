import { nearestPointOnLine } from '@turf/turf';
import { Feature, FeatureCollection, LineString, Position } from 'geojson';

import { createLog } from '@helpers/log';
import {
  GeoHash,
  MappedGpsPointFeature,
  RoadFeature,
  RoadGeoHash,
  RoadHash
} from '@types';

import { distanceBetweenPoints } from '../geo';
import { createPointHash, decodePointHash } from '../hash';
import { NodeMap, VisitContext } from './types';

const log = createLog('route/helpers');

export const flatCoords = (
  feature: FeatureCollection<LineString> | Feature<LineString> | undefined
) => {
  if (!feature) {
    return [];
  }
  if (feature.type === 'FeatureCollection') {
    return feature.features.flatMap(f =>
      f.geometry.coordinates.flat().map(n => Number(n.toFixed(1)))
    );
  }
  return feature.geometry.coordinates.flat().map(n => Number(n.toFixed(1)));
};

export const hashCoords = (
  feature: FeatureCollection<LineString> | Feature<LineString> | undefined,
  shorten: boolean = true
) => {
  if (!feature) {
    return [];
  }
  if (feature.type === 'FeatureCollection') {
    return feature.features.flatMap(f =>
      f.geometry.coordinates
        .map(p => createPointHash(p))
        .map(h => (shorten ? h.slice(-4) : h))
    );
  }
  return feature.geometry.coordinates
    .map(p => createPointHash(p))
    .map(h => (shorten ? h.slice(-4) : h));
};

export const hashToS = (hash: GeoHash | RoadGeoHash | undefined) => {
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

export const getRoadNodeIds = (roadHash: RoadGeoHash) => roadHash.split('.');

export const doesRoadHashContainNode = (
  roadHash: RoadGeoHash,
  nodeHash: GeoHash
) => {
  const [start, end] = getRoadNodeIds(roadHash);
  return start === nodeHash || end === nodeHash;
};

export const getRoadByStartEnd = (
  context: VisitContext,
  start: string,
  end: string
): RoadFeature | undefined => {
  const { nodeMap } = context;
  const road = nodeMap.get(`${start}.${end}`);
  if (road) {
    return road as RoadFeature;
  }
  return nodeMap.get(`${end}.${start}`) as RoadFeature | undefined;
};

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

export const isNodeRoadPoint = (nodeMap: NodeMap, hash: string): boolean => {
  const node = nodeMap.get(hash);
  if (!node) {
    return false;
  }
  if (!isNodeGpsPoint(node)) {
    return false;
  }

  return node.properties.isRoadPoint ?? false;
};

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

export const createRoadPointFeature = (
  road: RoadFeature,
  hash: string
): MappedGpsPointFeature => {
  const [start, end] = getRoadNodeIds(road.properties.hash);

  const isStart = start === hash;

  const index = isStart ? 0 : road.geometry.coordinates.length - 1;

  const coordinates = road.geometry.coordinates[index];

  return {
    geometry: {
      coordinates,
      type: 'Point'
    },
    properties: {
      dist: 0,
      hash,
      index,
      isRoadPoint: true,
      location: 0,
      multiFeatureIndex: 0,
      roadHash: road.properties.hash,
      srcHash: isStart ? end : start
    },
    type: 'Feature'
  };
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
  if (roadAEnd === roadBEnd) {
    return roadAEnd;
  }
  if (roadAStart === roadBStart) {
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
    // console.error('roadSet not found', { hashA, hashB, roadSetA, roadSetB });
    return undefined;
  }

  for (const roadHash of roadSetA) {
    if (roadSetB.has(roadHash)) {
      return nodeMap.get(roadHash) as RoadFeature;
    }
  }

  const node = nodeMap.get(hashA) as MappedGpsPointFeature | undefined;
  if (!node) {
    return undefined;
  }

  // fall-back to defined road
  return getNodeRoad(nodeMap, node.properties.roadHash ?? node.properties.hash);
};

export const getRoadIndex = (
  _context: VisitContext,
  road: RoadFeature,
  node: MappedGpsPointFeature,
  nodeHash: string
) => {
  const hash = node.properties.hash;

  if (isNodeRoad(node)) {
    const [start, end] = getRoadNodeIds(hash);
    // console.debug('[getRoadIndex] road node', {
    //   end,
    //   hash: nodeHash,
    //   start
    //   //   index: node.properties.index,
    //   //   road: road.properties.hash,
    //   //   roadHash: node.properties.roadHash
    // });
    if (start === nodeHash) {
      return 0;
    }
    if (end === nodeHash) {
      return road.geometry.coordinates.length - 1;
    }
    return 0;
  }

  const roadHash = node.properties.roadHash;

  // console.debug('[getRoadIndex]', {
  //   hash,
  //   index: node.properties.index,
  //   road: road.properties.hash,
  //   roadHash
  // });
  // console.debug('node', node);

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

export const getClosestRoadPointToHash = (
  roadHash: RoadGeoHash,
  hash: GeoHash
): GeoHash => {
  // log.debug('getClosestRoadPointToHash', { hash, roadHash });

  const [start, end] = getRoadNodeIds(roadHash);

  const startPoint = decodePointHash(start);
  const endPoint = decodePointHash(end);

  const hashPoint = decodePointHash(hash);

  const distanceToStart = distanceBetweenPoints(startPoint, hashPoint);
  const distanceToEnd = distanceBetweenPoints(endPoint, hashPoint);

  // log.debug('distanceTo start', hashToS(start), distanceToStart);
  // log.debug('distanceTo end', hashToS(end), distanceToEnd);

  if (distanceToStart < distanceToEnd) {
    return start;
  }
  return end;
};

export const getClosestHashOnRoad = (
  road: RoadFeature,
  hash: GeoHash
): GeoHash | undefined => {
  const point = decodePointHash(hash);

  const nearest = nearestPointOnLine(road.geometry, point);

  if (!nearest) {
    return undefined;
  }

  return createPointHash(nearest.geometry.coordinates);
};

export const createMappedGpsPointFeatureFromHash = (
  hash: GeoHash,
  roadHash: RoadHash
): MappedGpsPointFeature => ({
  geometry: { coordinates: decodePointHash(hash), type: 'Point' },
  properties: {
    dist: 0,
    hash,
    index: 0,
    isRoadPoint: false,
    location: 0,
    multiFeatureIndex: 0,
    roadHash,
    srcHash: ''
  },
  type: 'Feature'
});

export const countCurrentPath = (context: VisitContext) => {
  const { path } = context;
  const index = path.lastIndexOf('-');
  return index === -1 ? path.length : path.length - (index + 1);
};

export const countVisitContextPath = (path: GeoHash[]) => {
  const index = path.lastIndexOf('-');
  return index === -1 ? path.length : path.length - (index + 1);
};

/**
 * Trims the path if it is only a single point
 * @param context
 * @returns
 */
export const trimVisitContextPath = (context: VisitContext) => {
  const currentPathlength = countCurrentPath(context);

  if (currentPathlength === 1) {
    return {
      ...context,
      path: context.path.slice(0, -1)
    };
  }

  return context;
};
