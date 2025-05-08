import { MappedGpsPointFeature, RoadFeature } from '@types';

import { createLog } from '../log';
import {
  createRoadPointFeature,
  doesRoadHashContainNode,
  getLinkedNode,
  getNodeGpsPoint,
  getNodeRoad,
  getNodeRoadHash,
  getRoadByStartEnd,
  getRoadNodeIds,
  hashToS
} from './helpers';
import { NodeMap, VisitContext } from './types';

const log = createLog('buildGraph');

export type BuildGraphOptions = {
  includeGpsPoints: boolean;
};

export const buildGraph = (
  roads: RoadFeature[],
  gpsPoints: MappedGpsPointFeature[],
  options: BuildGraphOptions = {
    includeGpsPoints: true
  }
) => {
  const nodeMap = new Map<string, MappedGpsPointFeature | RoadFeature>();

  // a map of node hashes to the road hashes that contain them
  const nodeRoadMap = new Map<string, Set<string>>();

  for (const road of roads) {
    const { hash } = road.properties;
    const [start, end] = getRoadNodeIds(hash);
    log.debug('adding road to nodeMap', hashToS(hash));

    nodeMap.set(hash, road);

    nodeMap.set(start, createRoadPointFeature(road, start));
    nodeMap.set(end, createRoadPointFeature(road, end));

    nodeRoadMap.set(start, new Set([hash]));
    nodeRoadMap.set(end, new Set([hash]));
  }

  for (const gpsPoint of gpsPoints) {
    const { hash, roadHash } = gpsPoint.properties;
    nodeMap.set(hash, gpsPoint);
    log.debug('adding gps point to nodeMap', hashToS(hash));

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
    nodeMap,
    nodeRoadMap,
    path: [hash],
    roads
    // visitedNodes: new Set<string>([hash])
  };

  const resultContext = visitNode(context);

  const healedContext = healPath(resultContext);

  // log.debug('path', path.map(hashToS));

  return healedContext;
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

const visitNode = (context: VisitContext) => {
  const { currentGpsIndex, currentHash, gpsPoints, nodeMap } = context;

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
    log.debug(
      currentGpsIndex,
      'direct path from',
      hashToS(currentHash),
      'to',
      hashToS(nextHash)
    );
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

    log.debug(currentGpsIndex, 'adding to path', hashToS(nextHash));

    return visitNode({
      ...context,
      currentGpsIndex: currentGpsIndex + 1,
      currentHash: nextHash,
      path: [...context.path, nextHash]
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
      log.error(currentGpsIndex, 'no join node');
      log.error(currentGpsIndex, 'nextRoadHash', hashToS(nextRoadHash));
      return context;
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
