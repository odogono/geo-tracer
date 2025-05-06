import { MappedGpsPointFeature, RoadFeature } from '@types';

import { createLog } from '../log';

const log = createLog('buildGraph');

type NodeMap = Map<string, MappedGpsPointFeature | RoadFeature>;

type VisitContext = {
  currentGpsIndex: number;
  currentHash: string;
  gpsPoints: MappedGpsPointFeature[];
  nodeMap: NodeMap;
  path: string[];
  visitedNodes: Set<string>;
};

export const buildGraph = (
  roads: RoadFeature[],
  gpsPoints: MappedGpsPointFeature[]
) => {
  const nodeMap = new Map<string, MappedGpsPointFeature | RoadFeature>();

  for (const road of roads) {
    const { hash } = road.properties;
    const [start, end] = getRoadNodeIds(hash);
    nodeMap.set(hash, road);
    nodeMap.set(start, road);
    nodeMap.set(end, road);
  }

  for (const gpsPoint of gpsPoints) {
    const { hash } = gpsPoint.properties;
    nodeMap.set(hash, gpsPoint);
  }

  const start = gpsPoints[0];
  const { hash, roadHash } = start.properties;

  const context: VisitContext = {
    currentGpsIndex: 0,
    currentHash: hash,
    gpsPoints,
    nodeMap,
    path: [hash],
    visitedNodes: new Set<string>([hash])
  };

  const resultContext = visitNode(context);

  const { path } = healPath(resultContext);

  log.debug('path', path.map(hashToS));

  return { path };
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
  const { currentGpsIndex, currentHash, gpsPoints, nodeMap, visitedNodes } =
    context;

  const currentNode = nodeMap.get(currentHash);

  if (!currentNode) {
    log.error(currentGpsIndex, 'node not found', currentHash);
    const keys = Array.from(nodeMap.keys());
    log.error(currentGpsIndex, keys);
    return context;
  }

  // the current gps point we are aiming for
  // const target = gpsPoints[currentGpsIndex];
  // const { hash, roadHash } = target.properties;
  const roadHash = getNodeRoadHash(currentNode);
  const nextHash = getNodeGpsPoint(gpsPoints[currentGpsIndex + 1]);
  const nextRoadHash = getNodeRoadHash(gpsPoints[currentGpsIndex + 1]);

  if (!roadHash) {
    log.error(currentGpsIndex, 'no road hash', currentHash);
    return context;
  }

  log.debug(
    currentGpsIndex,
    `🆕 currentHash ${hashToS(currentHash)} target ${hashToS(nextHash)}`
  );

  // log.debug(
  //   currentGpsIndex,
  //   'nextRoad',
  //   hashToS(nextRoadHash),
  //   'target',
  //   hashToS(nextHash)
  // );

  if (!nextHash) {
    log.debug(currentGpsIndex, 'no next hash');
    return context;
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

    return visitNode({
      ...context,
      currentGpsIndex: currentGpsIndex + 1,
      currentHash: nextHash,
      path: [...context.path, nextHash]
    });
  } else {
    const nextRoad = findNextRoad(nodeMap, currentHash, nextHash);
    const targetRoadHash = getNodeRoadHash(nextRoad) ?? nextRoadHash;

    if (!targetRoadHash) {
      log.error(currentGpsIndex, 'no target road hash', nextHash);
      return context;
    }

    log.debug(
      currentGpsIndex,
      `target ${hashToS(nextHash)} on next road ${hashToS(targetRoadHash)}`
    );

    // log.debug(currentGpsIndex, 'nextRoad', hashToS(nextRoad?.properties.hash));

    // target is on the next road
    const joinNode = getJoinNode(currentHash, roadHash, targetRoadHash);

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

const hashToS = (hash: string | undefined) => {
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

const getRoadNodeIds = (roadHash: string) => roadHash.split('.');

const getJoinNode = (
  currentHash: string,
  roadAHash: string,
  roadBHash: string
) => {
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

  const joinNode = getJoinNode(currentHash, currentRoadHash, targetRoadHash);

  // log.debug('findNextRoad join', hashToS(joinNode));

  if (joinNode) {
    return nodeMap.get(joinNode);
  }

  return undefined;
};

const isNodeRoad = (
  node: MappedGpsPointFeature | RoadFeature | undefined
): node is RoadFeature =>
  node ? node.properties.roadHash === undefined : false;

const isNodeGpsPoint = (
  node: MappedGpsPointFeature | RoadFeature | undefined
): node is MappedGpsPointFeature => node?.properties.roadHash !== undefined;

const getNodeRoadHash = (
  node: MappedGpsPointFeature | RoadFeature | undefined
) => (isNodeRoad(node) ? node.properties.hash : node?.properties.roadHash);

const getNodeGpsPoint = (node: MappedGpsPointFeature | RoadFeature) =>
  isNodeGpsPoint(node) ? node.properties.hash : undefined;

const getNodeRoad = (map: NodeMap, nodeHash: string | undefined) => {
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

  return map.get(node.properties.roadHash);
};
