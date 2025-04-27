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
): NearestFeatureResult[] => {
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
  return nearestRoad ? [[nearestRoad, nearestNode!]] : [];
};

export type RoadPoints = {
  points: Feature<Point>[];
  road: Feature<LineString>;
};

export type RoadHash = string;

export type RoadPointsMap = Record<RoadHash, RoadPoints>;

type DirectionVector = GeoJSON.Position;

export const buildRouteGraph = (roadPointsMap: RoadPointsMap) => {
  const result: Node[] = [];
  // direction vector
  // const direction: DirectionVector = [0, 0];

  // const currentRoad: Road | undefined = undefined;
  // const lastPoint: Node | undefined = undefined;

  log.debug('roadPointsMap', roadPointsMap);

  for (const [roadHash, roadPoints] of Object.entries(roadPointsMap)) {
    const { points, road } = roadPoints;

    const coords = road.geometry.coordinates;
    let hasRouteStarted = false;
    let isRoadReversed = false;
    let lastPointAdded = false;
    // const pointIndex = 0;

    const roadRoute: (Position | number)[] = [];

    log.debug('road', { points, road, roadHash }, coords.length);
    for (let ii = 0; ii < coords.length; ii++) {
      const roadA: Position = coords[ii];
      const roadB: Position = coords[ii + 1];

      if (!roadA || !roadB) {
        // log.debug('no roadA or roadB', ii);
        continue;
      }

      const pointsOnSegment = findPointsOnSegment(roadA, roadB, points);
      // log.debug(
      //   'road segment',
      //   ii,
      //   ii + 1,
      //   { hasRouteStarted },
      //   pointsOnSegment
      // );

      if (!hasRouteStarted) {
        if (pointsOnSegment.length === 0) {
          continue;
        }

        if (pointsOnSegment[0] !== 0) {
          isRoadReversed = true;
        }

        hasRouteStarted = true;
      }

      for (const pointIndex of pointsOnSegment) {
        roadRoute.push(pointIndex);
        lastPointAdded = isRoadReversed
          ? pointIndex === 0
          : pointIndex === pointsOnSegment.length - 1;
      }

      if (!lastPointAdded) {
        roadRoute.push(roadB);
      }
    }

    if (isRoadReversed) {
      roadRoute.reverse();
    }

    for (const item of roadRoute) {
      if (typeof item === 'number') {
        result.push(toNode(points[item].geometry.coordinates));
      } else {
        result.push(toNode(item));
      }
    }

    log.debug('road route result', roadRoute);
  }

  return result;
};

const findPointsOnSegment = (
  roadA: Position,
  roadB: Position,
  points: Feature<Point>[]
) => {
  const result: number[] = [];
  for (let ii = 0; ii < points.length; ii++) {
    const point = points[ii];
    if (isPointOnSegment(roadA, roadB, point.geometry.coordinates)) {
      result.push(ii);
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

export const isPointOnLineString = (
  point: GeoJSON.Position,
  line: GeoJSON.LineString
) => {
  const start = line.coordinates[0];
  const end = line.coordinates.at(-1);

  if (!start || !end) {
    return false;
  }

  // Check if point lies on line segment
  const d1 = distancePointToPoint(point, start);
  const d2 = distancePointToPoint(point, end);
  const lineLen = distancePointToPoint(start, end);

  // Allow for small floating point errors
  const tolerance = 0.0001;
  return Math.abs(d1 + d2 - lineLen) < tolerance;
};

export const distancePointToPoint = (
  a: GeoJSON.Position,
  b: GeoJSON.Position
): number => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy);
};

export const distanceBetweenPoints = (
  p1: GeoJSON.Position,
  p2: GeoJSON.Position
): number => Math.sqrt(Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2));

export const isPointOnSegment = (
  start: GeoJSON.Position,
  end: GeoJSON.Position,
  point: GeoJSON.Position
) => {
  const tolerance = 0.000_01;

  const d1 = distanceBetweenPoints(start, point);
  const d2 = distanceBetweenPoints(point, end);
  const length = distanceBetweenPoints(start, end);

  return Math.abs(d1 + d2 - length) < tolerance;
};

export const arePointsEqual = (p1: GeoJSON.Position, p2: GeoJSON.Position) => {
  const d = distanceBetweenPoints(p1, p2);
  return d < 0.000_01;
};

export const measureDistanceAlongLine = (
  linestring: GeoJSON.LineString,
  point: GeoJSON.Position
): number => {
  let totalDistance = 0;

  for (let i = 0; i < linestring.coordinates.length - 1; i++) {
    const start = linestring.coordinates[i];
    const end = linestring.coordinates[i + 1];

    // If point is on this segment, calculate partial distance
    if (isPointOnSegment(start, end, point)) {
      return totalDistance + distanceBetweenPoints(start, point);
    }

    totalDistance += distanceBetweenPoints(start, end);
  }

  return totalDistance;
};
