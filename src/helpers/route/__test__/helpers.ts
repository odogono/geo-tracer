import { length as featureLength } from '@turf/turf';

import { GpsPointFeature, RoadFeature } from '@types';

import { getRoadFeatureBBox } from '../../geo';
import { createEdgeFeatureHash, createPointHash } from '../../hash';
import { GraphEdge, GraphNode } from '../astar';

const HASH_PRECISION = 9;

export const createRoadFeature = (
  coordinates: GeoJSON.Position[],
  id: string = 'road1',
  hash: string | undefined = undefined
): RoadFeature => {
  const feature: RoadFeature = {
    geometry: {
      coordinates,
      type: 'LineString'
    },
    properties: { hash: '', id },
    type: 'Feature'
  };

  feature.properties!.hash =
    hash ?? createEdgeFeatureHash(feature, HASH_PRECISION);
  feature.bbox = feature.bbox ?? getRoadFeatureBBox(feature);
  feature.properties!.length = featureLength(feature);

  return feature;
};

export const createPointFeature = (
  coordinates: GeoJSON.Position
): GpsPointFeature => ({
  geometry: {
    coordinates,
    type: 'Point'
  },
  properties: { hash: createPointHash(coordinates, HASH_PRECISION) },
  type: 'Feature'
});

export const edgeToString = (edge: GraphEdge) =>
  `${edge.from.point[0]},${edge.from.point[1]} -> ${edge.to.point[0]},${edge.to.point[1]}`;

export const nodeToString = (node: GraphNode) =>
  `${node.point[0]},${node.point[1]}`;
