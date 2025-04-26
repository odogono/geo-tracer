import { nearestPointOnLine } from '@turf/nearest-point-on-line';
import { BBox, Feature, LineString, Point, Polygon, Position } from 'geojson';

import { createLog } from '@helpers/log';

import { CommonFeatureProperties } from '../types';
import { createPointFeatureHash } from './hash';

const log = createLog('geo');

export const bboxToFeature = (bbox: BBox): Feature => {
  const [minX, minY, maxX, maxY] = bbox;

  const polygon: Polygon = {
    coordinates: [
      [
        [minX, minY],
        [maxX, minY],
        [maxX, maxY],
        [minX, maxY],
        [minX, minY]
      ]
    ],
    type: 'Polygon'
  };

  return {
    geometry: polygon,
    properties: {},
    type: 'Feature'
  };
};

export const calculateDistance = (coordinates: Position[]) => {
  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const [lon1, lat1] = coordinates[i - 1];
    const [lon2, lat2] = coordinates[i];
    // Using the Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    totalDistance += R * c;
  }
  return `${totalDistance.toFixed(2)} km`;
};

export const getFeatureCoordinates = (feature: GeoJSON.Feature) => {
  if (feature.geometry.type === 'Point') {
    return feature.geometry.coordinates;
  }
  if (feature.geometry.type === 'LineString') {
    return feature.geometry.coordinates;
  }
  return null;
};

export const getLineStringCoordinates = (feature: GeoJSON.Feature) => {
  if (feature.geometry.type !== 'LineString') {
    return null;
  }
  return feature.geometry.coordinates;
};

export const getFeatureGeometryType = (feature: GeoJSON.Feature) =>
  feature.geometry.type;

export const isPointFeature = (feature: GeoJSON.Feature | null) =>
  feature?.geometry?.type === 'Point';

export const isLineStringFeature = (feature: GeoJSON.Feature | null) =>
  feature?.geometry?.type === 'LineString';

type FindPointOnNearestFeatureOptions = {
  maxDistance?: number;
};

export const findPointOnLineString = (
  point: GeoJSON.Position,
  line: Feature<LineString>
) => {
  const candidate = nearestPointOnLine(line.geometry, point);
  return candidate;
};

type NearestPointProperties = CommonFeatureProperties & {
  dist: number;
  index: number;
  location: number;
  multiFeatureIndex: number;
};

type Road = GeoJSON.Feature<LineString, CommonFeatureProperties>;
type Node = GeoJSON.Feature<Point, NearestPointProperties>;

const toNode = (coordinates: GeoJSON.Position): Node => {
  const node: Feature<Point, CommonFeatureProperties> = {
    geometry: { coordinates, type: 'Point' },
    properties: { hash: '' },
    type: 'Feature'
  };
  const hash = createPointFeatureHash(node as Feature<Point>);
  node.properties.hash = hash;

  return node as Node;
};

export type NearestFeatureResult = [Road, Node];

export const findPointOnNearestFeature = (
  point: GeoJSON.Position,
  features: GeoJSON.FeatureCollection,
  options: FindPointOnNearestFeatureOptions = {}
) => {
  const maxDistance = options.maxDistance || 0.005; // 5 metres
  // let nearestPosition: GeoJSON.Position | undefined = undefined;
  let nearestDistance: number | undefined = Infinity;
  let nearestNode: Node | undefined = undefined;
  let nearestRoad: Road | undefined = undefined;

  const result: NearestFeatureResult[] = [];

  for (const feature of features.features) {
    if (feature.geometry.type !== 'LineString') {
      continue;
    }

    // Find the nearest point on this road to the coordinate
    const candidate = nearestPointOnLine(feature.geometry, point);

    if (!candidate) {
      continue;
    }
    // const { properties } = result;
    // const nearestPoint = candidate.geometry.coordinates;
    const distance = candidate.properties.dist;
    candidate.properties.hash = createPointFeatureHash(candidate);

    if (distance < maxDistance && distance < nearestDistance) {
      nearestDistance = distance;
      // nearestPosition = nearestPoint;
      nearestNode = candidate as Node;
      nearestRoad = feature as Road;
      result.push([nearestRoad, nearestNode]);
    }
  }

  // return result;
  return nearestRoad ? [[nearestRoad, nearestNode]] : [];
};

type DirectionVector = GeoJSON.Position;

export const buildRouteGraph = (entries: NearestFeatureResult[]) => {
  const result: Node[] = [];
  // direction vector
  let direction: DirectionVector = [0, 0];

  let currentRoad: Road | undefined = undefined;
  let lastPoint: Node | undefined = undefined;

  // for (const [road, point] of entries) {
  for (let ii = 0; ii < entries.length; ii++) {
    const [road, point] = entries[ii];

    const next = entries.length - 1 > ii ? entries[ii + 1][1] : undefined;
    const nextPoint = next ? next : undefined;
    const nextRoad = next ? entries[ii + 1][0] : undefined;

    if (lastPoint) {
      direction = getDirectionVector(lastPoint, point);
    } else {
      direction = nextPoint ? getDirectionVector(point, nextPoint) : direction;
    }

    if (!currentRoad) {
      currentRoad = road;
    }

    // else {
    //   result.push(point);
    // }

    log.debug(
      '[buildRouteGraph] point',
      point.properties.hash,
      road.id,
      road.properties.hash
    );

    result.push(point);

    lastPoint = point;

    if (nextRoad && nextRoad.properties.hash !== currentRoad.properties.hash) {
      // road change - add a node at the end of this road
      const endPoint = getRoadEndPoint(currentRoad, point, direction);

      log.debug('[buildRouteGraph] endPoint', endPoint.properties.hash);
      result.push(endPoint);
      lastPoint = endPoint;
    }

    if (result.length > 5) {
      break;
    }
  }

  return result;
};

const getDirectionVector = (pointA: Node, pointB: Node): GeoJSON.Position => {
  const coordinatesA = pointA.geometry.coordinates;
  const coordinatesB = pointB.geometry.coordinates;
  const direction = [
    coordinatesB[0] - coordinatesA[0],
    coordinatesB[1] - coordinatesA[1]
  ];
  return direction;
};

/**
 * Returns one of the two end points of the road based on a point and a direction vector
 *
 * First, it checks if the road has at least two coordinates (start and end points)
 *
 * It extracts the start and end points of the road
 *
 * It normalizes the input direction vector to unit length
 *
 * For both end points, it:
 * Creates vectors from our current point to each end
 * Normalizes these vectors
 *
 * Calculates the dot product between our direction vector and each end-point vector
 *
 * Finally, it returns the end point that has the better alignment (higher dot product) with our direction vector
 *
 * @param road The road feature to analyze
 * @param point The reference point on the road
 * @param direction The direction vector indicating desired direction of travel
 * @returns The coordinates of the most appropriate end point
 * @throws Error if the road has no coordinates
 */
const getRoadEndPoint = (
  road: Road,
  point: Node,
  direction: DirectionVector
): Node => {
  const coordinates = road.geometry.coordinates;
  if (coordinates.length < 2) {
    throw new Error('Road must have at least two coordinates');
  }

  // After the length check above, we know these exist
  const startPoint = coordinates[0] as Position;
  const endPoint = coordinates.at(-1) as Position;

  // Normalize direction vector
  const dirMagnitude = Math.sqrt(
    direction[0] * direction[0] + direction[1] * direction[1]
  );
  const normalizedDir: DirectionVector = [
    direction[0] / dirMagnitude,
    direction[1] / dirMagnitude
  ];

  // Get vectors from our point to both ends
  const pointCoords = point.geometry.coordinates;
  const toStart: DirectionVector = [
    startPoint[0] - pointCoords[0],
    startPoint[1] - pointCoords[1]
  ];
  const toEnd: DirectionVector = [
    endPoint[0] - pointCoords[0],
    endPoint[1] - pointCoords[1]
  ];

  // Normalize these vectors
  const toStartMag = Math.sqrt(
    toStart[0] * toStart[0] + toStart[1] * toStart[1]
  );
  const toEndMag = Math.sqrt(toEnd[0] * toEnd[0] + toEnd[1] * toEnd[1]);

  const normalizedToStart: DirectionVector = [
    toStart[0] / toStartMag,
    toStart[1] / toStartMag
  ];
  const normalizedToEnd: DirectionVector = [
    toEnd[0] / toEndMag,
    toEnd[1] / toEndMag
  ];

  // Calculate dot products to find which direction aligns better
  const dotStart =
    normalizedDir[0] * normalizedToStart[0] +
    normalizedDir[1] * normalizedToStart[1];
  const dotEnd =
    normalizedDir[0] * normalizedToEnd[0] +
    normalizedDir[1] * normalizedToEnd[1];

  // Return the end point that has a higher dot product (better alignment)
  return dotEnd > dotStart ? toNode(endPoint) : toNode(startPoint);
};
