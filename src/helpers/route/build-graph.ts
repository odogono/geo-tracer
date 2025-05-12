import {
  GeoHash,
  MappedGpsPointFeature,
  RoadFeature,
  RoadGeoHash,
  RoadHash
} from '@types';

import { createLog } from '../log';
import {
  countCurrentPath,
  countVisitContextPath,
  createMappedGpsPointFeatureFromHash,
  createRoadPointFeature,
  doesRoadHashContainNode,
  getClosestRoadPointToHash,
  getLinkedNode,
  getNodeGpsPoint,
  getNodeRoad,
  getNodeRoadHash,
  getRoadByStartEnd,
  getRoadNodeIds,
  hashToS,
  isNodeRoadPoint
} from './helpers';
import { NodeMap, VisitContext } from './types';

const log = createLog('buildGraph');

export type BuildGraphOptions = {
  includeAllGpsPoints: boolean;
};

const PATH_BREAK = '-';

const addPointToContext = (
  context: VisitContext,
  point: GeoHash,
  roadHash: RoadHash
) => {
  const { nodeMap, nodeRoadMap } = context;
  const existing = nodeMap.get(point);

  if (existing) {
    return context;
  }

  // create a feature for the point
  const feature = createMappedGpsPointFeatureFromHash(point, roadHash);

  nodeMap.set(point, feature);
  nodeRoadMap.set(point, new Set([roadHash]));
  // return {
  //   ...context,
  //   path: [...context.path, point]
  // };

  return context;
};

export const buildGraph = (
  roads: RoadFeature[],
  gpsPoints: MappedGpsPointFeature[],
  options: BuildGraphOptions = {
    includeAllGpsPoints: true
  }
) => {
  // a map of geohash to point or road feature
  const nodeMap = new Map<string, MappedGpsPointFeature | RoadFeature>();

  // a map of node hashes to the road hashes that contain them
  const nodeRoadMap = new Map<string, Set<string>>();

  // a map of road geohash to the number of gps points on that road
  const roadGpsCountMap = new Map<string, number>();

  for (const road of roads) {
    const { hash } = road.properties;
    const [start, end] = getRoadNodeIds(hash);
    log.debug('adding road to nodeMap', hashToS(hash));

    nodeMap.set(hash, road);

    nodeMap.set(start, createRoadPointFeature(road, start));
    nodeMap.set(end, createRoadPointFeature(road, end));
  }
  const roadHashes = roads.map(r => r.properties.hash);

  // cycle over the roads again to associate fully the nodeRoadMap
  for (const roadHash of roadHashes) {
    const [start, end] = getRoadNodeIds(roadHash);
    const startSet = nodeRoadMap.get(start) ?? new Set<string>();
    const endSet = nodeRoadMap.get(end) ?? new Set<string>();

    startSet.add(roadHash);
    endSet.add(roadHash);

    nodeRoadMap.set(start, startSet);
    nodeRoadMap.set(end, endSet);
  }

  // add the gps points as nodes, and associate roads with the gps point
  for (const gpsPoint of gpsPoints) {
    const { hash, roadHash } = gpsPoint.properties;
    const isRoadPoint = isNodeRoadPoint(nodeMap, hash);
    gpsPoint.properties.isRoadPoint = isRoadPoint;
    nodeMap.set(hash, gpsPoint);
    log.debug('adding gps point to nodeMap', hashToS(hash));

    // record the number of gps points on the road
    const roadPointCount = roadGpsCountMap.get(roadHash) ?? 0;
    roadGpsCountMap.set(roadHash, roadPointCount + 1);

    // record the roads that are connected to the gps point as a start or end node
    const roadHashes = nodeRoadMap.get(hash) ?? new Set<string>([roadHash]);
    for (const road of roads) {
      const { hash: roadHash } = road.properties;
      const [roadStart, roadEnd] = getRoadNodeIds(roadHash);
      if (roadStart === hash || roadEnd === hash) {
        roadHashes.add(roadHash);
      }
    }
    nodeRoadMap.set(hash, roadHashes);
  }

  const start = gpsPoints[0];
  const { hash } = start.properties;

  const context: VisitContext = {
    currentGpsIndex: 0,
    currentHash: hash,
    gpsPoints,
    includeAllGpsPoints: options.includeAllGpsPoints,
    nodeMap,
    nodeRoadMap,
    path: [hash],
    roadGpsCountMap,
    roads
  };

  const resultContext = visitNode(context);

  const healedContext = healPath(resultContext);

  // log.debug('path', path.map(hashToS));

  return healedContext;
};

const visitNode = (context: VisitContext) => {
  const {
    currentGpsIndex,
    currentHash,
    gpsPoints,
    includeAllGpsPoints,
    nodeMap
  } = context;

  const currentNode = nodeMap.get(currentHash);

  if (!currentNode) {
    log.error(currentGpsIndex, 'node not found', currentHash);
    const keys = Array.from(nodeMap.keys()).map(hashToS);
    log.error(currentGpsIndex, keys);
    return context;
  }

  // the current gps point we are aiming for
  // const target = gpsPoints[currentGpsIndex];
  // const { hash, roadHash } = target.properties;
  let roadHash = getNodeRoadHash(currentNode);
  const nextHash = getNodeGpsPoint(gpsPoints[currentGpsIndex + 1]);
  const nextRoadHash = getNodeRoadHash(gpsPoints[currentGpsIndex + 1]);

  if (!roadHash) {
    log.error(currentGpsIndex, 'no road hash', currentHash);
    return context;
  }

  // check whether the next road is linked to the hash
  if (getLinkedNode(roadHash, nextRoadHash) === currentHash) {
    log.debug(currentGpsIndex, 'linked roads', roadHash, nextRoadHash);
    roadHash = nextRoadHash;
  }

  // log.debug(
  //   currentGpsIndex,
  //   'nextRoad',
  //   hashToS(nextRoadHash),
  //   'target',
  //   hashToS(nextHash)
  // );

  if (!nextHash || !nextRoadHash) {
    log.debug(currentGpsIndex, 'no next hash');
    return context;
  }

  log.debug(
    currentGpsIndex,
    `🆕 currentHash ${hashToS(currentHash)} target ${hashToS(nextHash)} currentRoad ${hashToS(roadHash)} nextRoad ${hashToS(nextRoadHash)}`
  );

  if (getRoadByStartEnd(context, currentHash, nextHash)) {
    // log.debug(
    //   currentGpsIndex,
    //   'direct path from',
    //   hashToS(currentHash),
    //   'to',
    //   hashToS(nextHash)
    // );
    return visitNode({
      ...context,
      currentGpsIndex: currentGpsIndex + 1,
      currentHash: nextHash,
      path: [...context.path, nextHash]
    });
  }

  // is the target point on the same road?
  if (roadHash === nextRoadHash) {
    const roadHash = getNodeRoadHash(currentNode);
    log.debug(
      currentGpsIndex,
      `target ${hashToS(currentHash)} on same road ${hashToS(roadHash)}`
    );

    // if (currentGpsIndex + 1 === gpsPoints.length) {
    //   log.debug(currentGpsIndex, 'found end of path', currentHash, nextHash);
    //   return context;
    // }

    const isRoadPoint = isNodeRoadPoint(nodeMap, nextHash);
    const isStartOfPath = countCurrentPath(context) === 0; // context.path.at(-1) === PATH_BREAK;
    const isEndOfPath = currentGpsIndex + 1 === gpsPoints.length - 1;

    const addPoint =
      includeAllGpsPoints || isRoadPoint || isStartOfPath || isEndOfPath;

    log.debug(currentGpsIndex, `adding ${hashToS(nextHash)} to path`, {
      addPoint
    });

    const path = addPoint ? [...context.path, nextHash] : context.path;

    // const path = [...context.path, nextHash];
    return visitNode({
      ...context,
      currentGpsIndex: currentGpsIndex + 1,
      currentHash: nextHash,
      path
    });
  } else {
    const nextRoad = nodeMap.get(nextRoadHash); // findNextRoad(nodeMap, currentHash, nextHash);
    const targetRoadHash = getNodeRoadHash(nextRoad) ?? nextRoadHash;

    if (!targetRoadHash) {
      log.error(currentGpsIndex, 'no target road hash', nextHash);
      return context;
    }

    log.debug(
      currentGpsIndex,
      `target ${hashToS(nextHash)} on next road ${hashToS(targetRoadHash)}`
    );

    // if the target is a road point, then just hit the road
    if (doesRoadHashContainNode(targetRoadHash, nextHash)) {
      log.debug(currentGpsIndex, 'target is next road', hashToS(nextHash));
      //   return visitNode({
      //     ...context,
      //     currentGpsIndex: currentGpsIndex + 1,
      //     currentHash: nextHash,
      //     path: [...context.path, nextHash]
      //   });
    }
    // log.debug(currentGpsIndex, 'nextHash', nodeMap.get(nextHash));

    // target is on the next road
    const joinNode = getLinkedNode(roadHash, targetRoadHash); // getJoinNode(currentHash, roadHash, targetRoadHash);
    log.debug(
      currentGpsIndex,
      'getting join node',
      hashToS(currentHash),
      hashToS(roadHash),
      hashToS(targetRoadHash),
      '=',
      hashToS(joinNode)
    );

    if (!joinNode) {
      return handleUnlinkedRoads(
        context,
        currentHash,
        roadHash,
        nextHash,
        nextRoadHash
      );
    }

    if (joinNode === nextHash) {
      return visitNode({
        ...context,
        currentGpsIndex: currentGpsIndex + 1,
        currentHash: nextHash,
        path: [...context.path, nextHash]
      });
    }

    // log.debug(currentGpsIndex, 'joinNode', hashToS(joinNode));

    return visitNode({
      ...context,
      // currentGpsIndex: currentGpsIndex + 1,
      currentHash: joinNode,
      path: [...context.path, joinNode]
    });
  }
};

const handleUnlinkedRoads = (
  context: VisitContext,
  currentHash: GeoHash,
  currentRoadHash: RoadGeoHash,
  nextHash: GeoHash,
  nextRoadHash: RoadGeoHash
): VisitContext => {
  const { currentGpsIndex, includeAllGpsPoints, nodeMap, roadGpsCountMap } =
    context;

  // no join node, means we are on unlinked roads, so start a new path
  log.error(currentGpsIndex, 'no join node - new path');
  log.error(currentGpsIndex, 'nextRoadHash', hashToS(nextRoadHash));
  log.error(currentGpsIndex, 'path', context.path);
  log.error(currentGpsIndex, 'currentHash', hashToS(currentHash));
  log.error(currentGpsIndex, 'nextHash', hashToS(nextHash));

  // context = trimVisitContextPath(context)

  const last = context.path.at(-1);

  let path =
    last !== currentHash
      ? [...context.path, currentHash, PATH_BREAK]
      : context.path;

  if (countVisitContextPath(path) === 1) {
    path.pop();
  }

  log.error(currentGpsIndex, 'path is now', path);

  // if (countCurrentPath(context) > 1) {
  //   path = includeAllGpsPoints
  //     ? [...path, PATH_BREAK]
  //     : [...path, currentHash, PATH_BREAK];
  //   // if (includeAllGpsPoints) {
  //   //   path = [...path, PATH_BREAK];
  //   // } else {
  //   //   // const currentRoadGpsCount = roadGpsCountMap.get(currentRoadHash);

  //   //   // log.error(currentGpsIndex, 'currentRoadGpsCount', currentRoadGpsCount);
  //   //   // if (currentRoadGpsCount === 1) {
  //   //   //   // this gives us either the start or the end of the next road
  //   //   //   // whichever is closest to the current hash
  //   //   //   // this is likely to be a very rare occurrence
  //   //   //   const closestRoadHash = getClosestRoadPointToHash(
  //   //   //     nextRoadHash,
  //   //   //     currentHash
  //   //   //   );
  //   //   //   const currentRoad = nodeMap.get(currentRoadHash) as RoadFeature;

  //   //   //   const closestPoint = getClosestHashOnRoad(currentRoad, closestRoadHash);

  //   //   //   log.debug(currentGpsIndex, 'closest point', {
  //   //   //     closestPoint,
  //   //   //     closestRoadHash
  //   //   //   });

  //   //   //   if (closestPoint) {
  //   //   //     // we will need to add this new point to the context data-structures
  //   //   //     context = addPointToContext(context, closestPoint, currentRoadHash);
  //   //   //     path = [...path, closestPoint, PATH_BREAK];
  //   //   //   }
  //   //   // } else {
  //   //   path = [...path, currentHash, PATH_BREAK];
  //   // }
  // }

  // do we need to add the current point to the path?
  // let path = includeAllGpsPoints
  //   ? [...context.path, PATH_BREAK]
  //   : [...context.path, currentHash, PATH_BREAK];

  // is the next hash we are adding a road point?
  const isNextHashRoadPoint = isNodeRoadPoint(nodeMap, nextHash);
  const gpsCount = roadGpsCountMap.get(nextRoadHash);

  if (!isNextHashRoadPoint && gpsCount === 1) {
    // because we are jumping to a new road, add the closest road point
    // to the existing road
    const closestRoadHash = getClosestRoadPointToHash(
      nextRoadHash,
      currentHash
    );

    log.debug(currentGpsIndex, 'next hash', {
      closestRoadHash,
      gpsCount,
      isNextHashRoadPoint
    });

    path = [...path, closestRoadHash];
  }

  return visitNode({
    ...context,
    currentHash: nextHash,
    path
  });
};

/**
 * Removes nodes from the path that appear to be redundant
 *
 * @param context
 * @returns
 */
const healPath = (context: VisitContext) => {
  const { nodeMap, path } = context;
  let healedPath = [...path];
  let hasChanges = true;

  // Keep iterating until no more changes are made
  while (hasChanges) {
    hasChanges = false;
    const newPath: string[] = [];

    for (let i = 0; i < healedPath.length; i++) {
      const prevNode = healedPath[i - 1];
      const currentNode = healedPath[i];
      const nextNode = healedPath[i + 1];

      // If we find a node that has the same node on both sides, skip it
      if (prevNode && nextNode && prevNode === nextNode) {
        const point = nodeMap.get(currentNode);
        const road = getNodeRoad(nodeMap, currentNode);

        log.debug(
          'redundant node',
          hashToS(currentNode),
          hashToS(prevNode),
          hashToS(nextNode),
          point
        );
        log.debug('road', road);

        hasChanges = true;
        // remove the last entry
        newPath.pop();
        continue;
      }

      newPath.push(currentNode);
    }

    healedPath = newPath;
  }

  return {
    ...context,
    path: healedPath
  };
};

const getJoinNode = (
  currentHash: string,
  roadAHash: string | undefined,
  roadBHash: string | undefined
) => {
  if (!roadAHash || !roadBHash) {
    return undefined;
  }
  const [roadAStart, roadAEnd] = getRoadNodeIds(roadAHash);
  const [roadBStart, roadBEnd] = getRoadNodeIds(roadBHash);

  if (currentHash === roadBStart) {
    return roadBEnd;
  }
  if (currentHash === roadBEnd) {
    return roadBStart;
  }

  if (roadAStart === roadBEnd) {
    return roadAStart;
  }
  if (roadAEnd === roadBStart) {
    return roadAEnd;
  }
  if (roadAStart === roadBStart) {
    return roadAStart;
  }
  if (roadAEnd === roadBEnd) {
    return roadAEnd;
  }

  return undefined;
};

const findNextRoad = (
  nodeMap: NodeMap,
  currentHash: string,
  targetHash: string
) => {
  log.debug('findNextRoad', hashToS(currentHash), hashToS(targetHash));
  const aToB = nodeMap.get(`${currentHash}.${targetHash}`);
  if (aToB) {
    return aToB;
  }

  const bToA = nodeMap.get(`${targetHash}.${currentHash}`);

  if (bToA) {
    return bToA;
  }

  // log.debug('findNextRoad', hashToS(currentHash), hashToS(targetHash));

  const currentNode = nodeMap.get(currentHash);
  const targetNode = nodeMap.get(targetHash);
  const currentRoadHash = getNodeRoadHash(currentNode);
  const targetRoadHash = getNodeRoadHash(targetNode);

  // log.debug('findNextRoad', hashToS(currentRoadHash), hashToS(targetRoadHash));

  const joinNode = getJoinNode(currentHash, currentRoadHash!, targetRoadHash!);

  // log.debug('findNextRoad join', hashToS(joinNode));

  if (joinNode) {
    return nodeMap.get(joinNode);
  }

  return undefined;
};
