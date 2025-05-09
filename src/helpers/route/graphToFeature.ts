import { Feature, FeatureCollection, LineString, Position } from 'geojson';

import { MappedGpsPointFeature } from '@types';

import { createLog } from '../log';
import {
  arePositionsEqual,
  getCommonRoad,
  getNodeRoadFromStartEnd,
  getRoadIndex,
  hashToS
} from './helpers';
import { VisitContext } from './types';

const log = createLog('graphToFeature', ['']);

export const graphToFeature = (
  graph: VisitContext
): FeatureCollection<LineString> | undefined => {
  const { nodeMap, nodeRoadMap, path } = graph;

  if (path.length < 2) {
    return undefined;
  }

  const results: Position[][] = [];

  let coordinates: Position[] = [];

  log.debug('path', path.map(hashToS));

  for (
    let ii = 0, currentIndex = 0;
    ii < path.length - 1;
    ii++, currentIndex++
  ) {
    const head = path[ii];
    const tail = path[ii + 1];

    // log.debug('head??', head);
    if (tail === '-') {
      ii++;
      currentIndex = -1;
      results.push(coordinates);
      coordinates = [];
      continue;
    }

    // const headNode = nodeMap.get(head);
    // const tailNode = nodeMap.get(tail);

    log.debug('head', currentIndex, hashToS(head));
    log.debug('tail', currentIndex, hashToS(tail));

    // const isDebug = hashToS(head) === 'uryp' && hashToS(tail) === 't911';

    const road = getNodeRoadFromStartEnd(nodeMap, head, tail);

    if (road) {
      const roadCoords = road.geometry.coordinates;
      pushCoords(coordinates, ...roadCoords);
      continue;
    }

    const headNode = nodeMap.get(head) as MappedGpsPointFeature | undefined;

    if (!headNode) {
      log.error('headNode not found', head);
      return undefined;
    }

    const tailNode = nodeMap.get(tail) as MappedGpsPointFeature | undefined;

    if (!tailNode) {
      log.error('tailNode not found', tail);
      log.error('nodeMap', Array.from(nodeMap.keys()).map(hashToS));
      return undefined;
    }

    // if (isNodeRoad(tailNode)) {
    //   log.debug('tailNode is a road!!');
    // }
    // get the road which both head and tail are on
    const roadNode = getCommonRoad(graph, head, tail);

    if (!roadNode) {
      log.error('roadNode not found', headNode.properties.roadHash, {
        head: hashToS(head),
        tail: hashToS(tail)
      });
      return undefined;
    }

    log.debug('roadNode', hashToS(roadNode.properties.hash));
    log.debug('tailNode', hashToS(tailNode.properties.hash));

    const headIndex = getRoadIndex(graph, roadNode, headNode, head);
    // const tailIndex = tailNode.properties.index;
    // const roadNode = getNodeRoad(
    //   nodeMap,
    //   headNode.properties.roadHash ?? headNode.properties.hash
    // );

    // log.debug('headNode', headNode);
    // log.debug('roadNode', roadNode);

    const roadCoords = roadNode.geometry.coordinates;
    // log.debug('tailNode', tailNode);

    // const tailIndex = tailNode.properties.index ?? roadCoords.length;
    const tailIndex = getRoadIndex(graph, roadNode, tailNode, tail);

    log.debug('headIndex', headIndex + 1, hashToS(roadNode.properties.hash));
    log.debug('tailIndex', tailIndex + 1, hashToS(tailNode.properties.hash));

    if (currentIndex === 0) {
      // log.debug('headCoords', headNode.geometry.coordinates);
      pushCoords(coordinates, headNode.geometry.coordinates);
    }

    const isReverse = headIndex > tailIndex;

    const roadStartIndex = Math.min(headIndex + 1, tailIndex + 1);
    const roadEndIndex = Math.max(headIndex + 1, tailIndex + 1);

    const sliceCoords = roadCoords.slice(roadStartIndex, roadEndIndex);
    log.debug(
      'sliceCoords',
      hashToS(roadNode.properties.hash),
      {
        isReverse,
        roadEndIndex,
        roadLength: roadCoords.length,
        roadStartIndex
      },
      sliceCoords
    );

    if (isReverse) {
      sliceCoords.reverse();
    }
    pushCoords(coordinates, ...sliceCoords);

    log.debug('push tail?', {
      roadCoordsLength: roadCoords.length,
      roadEndIndex,
      tail: hashToS(tailNode.properties.hash)
    });
    if (tailIndex < roadCoords.length) {
      log.debug(
        'tailCoords',
        // roadEndIndex,
        // roadCoords.length,
        tailNode.geometry.coordinates
        // coordinates.at(-1)
      );

      // if (isNodeRoad(tailNode)) {
      //   log.debug('tailNode is a road!!');
      //   pushCoords(
      //     coordinates,
      //     (tailNode as RoadFeature).geometry.coordinates[0]
      //   );
      // } else {
      pushCoords(coordinates, tailNode.geometry.coordinates);
      // }

      // pushCoords(coordinates, tailNode.geometry.coordinates);
    }
  }

  if (coordinates.length === 0) {
    return undefined;
  }

  results.push(coordinates);

  const features: Feature<LineString>[] = results.map(coords => ({
    geometry: {
      coordinates: coords,
      type: 'LineString'
    },
    properties: {},
    type: 'Feature'
  }));

  return {
    features,
    type: 'FeatureCollection'
  };
};

const pushCoords = (coordinates: Position[], ...coords: Position[]) => {
  // log.debug('🎉 pushCoords', coords);
  // if (coords.length === 1 && coords[0].length > 1) {
  //   coords = coords[0];
  // }
  for (const coord of coords) {
    if (arePositionsEqual(coordinates.at(-1), coord)) {
      continue;
    }
    coordinates.push(coord);
  }
  return coordinates;
};
