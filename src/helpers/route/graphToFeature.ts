import { Feature, LineString, Position } from 'geojson';

import { MappedGpsPointFeature } from '@types';

import { createLog } from '../log';
import { getNodeRoad, getNodeRoadFromStartEnd, hashToS } from './helpers';
import { VisitContext } from './types';

const log = createLog('graphToFeature');

export const graphToFeature = (
  graph: VisitContext
): Feature<LineString> | undefined => {
  const { nodeMap, path } = graph;

  if (path.length < 2) {
    return undefined;
  }

  const coordinates: Position[] = [];

  for (let ii = 0; ii < path.length - 1; ii++) {
    const head = path[ii];
    const tail = path[ii + 1];

    // const headNode = nodeMap.get(head);
    // const tailNode = nodeMap.get(tail);

    log.debug('head', hashToS(head));
    log.debug('tail', hashToS(tail));

    const road = getNodeRoadFromStartEnd(nodeMap, head, tail);

    if (road) {
      const roadCoords = road.geometry.coordinates;
      coordinates.push(...roadCoords);
      continue;
    }

    const headNode = nodeMap.get(head) as MappedGpsPointFeature | undefined;

    if (!headNode) {
      log.error('headNode not found', head);
      return undefined;
    }

    const headIndex = headNode.properties.index;
    const roadNode = getNodeRoad(
      nodeMap,
      headNode.properties.roadHash ?? headNode.properties.hash
    );

    // log.debug('headNode', headNode);
    // log.debug('roadNode', roadNode);

    if (!roadNode) {
      log.error('roadNode not found', headNode.properties.roadHash);
      return undefined;
    }

    const tailNode = nodeMap.get(tail) as MappedGpsPointFeature | undefined;

    if (!tailNode) {
      log.error('tailNode not found', tail);
      log.error('nodeMap', Array.from(nodeMap.keys()).map(hashToS));
      return undefined;
    }

    const roadCoords = roadNode.geometry.coordinates;
    // log.debug('tailNode', tailNode);

    const tailIndex = tailNode.properties.index ?? roadCoords.length;

    if (ii === 0) {
      log.debug('headCoords', headNode.geometry.coordinates);
      coordinates.push(headNode.geometry.coordinates);
    }

    const roadStartIndex = headIndex + 1;
    const roadEndIndex = tailIndex + 1;

    const sliceCoords = roadCoords.slice(roadStartIndex, roadEndIndex);
    // log.debug('slice', roadStartIndex, roadEndIndex);
    // log.debug('roadCoords', roadCoords);
    log.debug('sliceCoords', sliceCoords);
    coordinates.push(...sliceCoords);

    if (roadEndIndex < roadCoords.length) {
      log.debug('tailCoords', tailNode.geometry.coordinates);
      coordinates.push(tailNode.geometry.coordinates);
    }

    // if (!headNode || !tailNode) {
    //   return undefined;
    // }

    // const headRoad = getNodeRoad(nodeMap, head);
    // const tailRoad = getNodeRoad(nodeMap, tail);

    // log.debug('headRoad', headRoad);
  }

  if (coordinates.length === 0) {
    return undefined;
  }

  return {
    geometry: {
      coordinates,
      type: 'LineString'
    },
    properties: {},
    type: 'Feature'
  };
};
