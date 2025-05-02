import { GpsPointFeature, RoadFeature, RoadPointsMap } from '@types';

import { getRoadFeatureBBox } from '../geo';
import { createEdgeFeatureHash, createPointHash } from '../hash';
import { GraphEdge, GraphNode } from '../route/astar';

export const createRoadPointsMap = (
  roadCoords: GeoJSON.Position[],
  gpsPoints: GeoJSON.Position[]
): RoadPointsMap => {
  const road = createRoadFeature(roadCoords, 'road1');
  const points = gpsPoints.map(createPointFeature);
  const id: string = road.properties.hash ?? 'road1';

  return {
    [id]: {
      points,
      road
    }
  };
};

export const createRoadFeature = (
  coordinates: GeoJSON.Position[],
  id: string = 'road1'
): RoadFeature => {
  const feature: RoadFeature = {
    geometry: {
      coordinates,
      type: 'LineString'
    },
    properties: { hash: '7zzzzzzzz', id },
    type: 'Feature'
  };

  const hash = createEdgeFeatureHash(feature);
  feature.properties!.hash = hash;
  const bbox = getRoadFeatureBBox(feature);

  return feature;
};

export const createPointFeature = (
  coordinates: GeoJSON.Position
): GpsPointFeature => ({
  geometry: {
    coordinates,
    type: 'Point'
  },
  properties: { hash: createPointHash(coordinates) },
  type: 'Feature'
});

export const edgeToString = (edge: GraphEdge) =>
  `${edge.from.point[0]},${edge.from.point[1]} -> ${edge.to.point[0]},${edge.to.point[1]}`;

export const nodeToString = (node: GraphNode) =>
  `${node.point[0]},${node.point[1]}`;
