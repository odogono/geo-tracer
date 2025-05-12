import { nearestPointOnLine } from '@turf/nearest-point-on-line';
import { Feature, FeatureCollection, LineString, Point } from 'geojson';

import {
  CommonFeatureProperties,
  GpsPointFeature,
  MappedGpsPointFeature,
  RoadFeature
} from '@types';

import { createPointFeatureHash, createPointHash } from '../hash';

type MapGpsToRoadOptions = {
  hashPrecision?: number;
  maxDistance?: number;
};

const defaultOptions: MapGpsToRoadOptions = {
  hashPrecision: 10,
  maxDistance: 0.005
};

export const mapGpsLineStringToRoad = (
  roads: RoadFeature[],
  gps: FeatureCollection<LineString>,
  options: MapGpsToRoadOptions = defaultOptions
) => {
  const mappedGpsPoints: MappedGpsPointFeature[] = [];

  for (const feature of gps.features) {
    for (const coordinate of feature.geometry.coordinates) {
      const nearest = findPointOnNearestRoad(roads, coordinate, options);
      if (nearest) {
        mappedGpsPoints.push(nearest);
      }
    }
  }

  return {
    mappedGpsPoints
  };
};

/**
 * Maps gps points onto the nearest roads
 *
 * @param gps
 * @param roads
 * @returns
 */
export const mapGpsToRoad = (
  roads: RoadFeature[],
  gps: GpsPointFeature[],
  options: MapGpsToRoadOptions = defaultOptions
) => {
  const mappedGpsPoints: MappedGpsPointFeature[] = [];

  for (const gpsPoint of gps) {
    // for (const coordinate of feature.geometry) {
    const nearest = findPointOnNearestRoad(
      roads,
      gpsPoint.geometry.coordinates,
      options
    );

    if (!nearest) {
      continue;
    }

    mappedGpsPoints.push(nearest);
  }

  return {
    mappedGpsPoints
  };
};

type NearestPointProperties = CommonFeatureProperties & {
  dist: number;
  index: number;
  location: number;
  multiFeatureIndex: number;
};

export const findPointOnNearestRoad = (
  roads: RoadFeature[],
  point: GeoJSON.Position,
  options: MapGpsToRoadOptions = defaultOptions
): MappedGpsPointFeature | undefined => {
  const maxDistance = options.maxDistance || 0.005; // 5 metres
  const hashPrecision = options.hashPrecision || 10;

  let nearestDistance: number | undefined = Infinity;
  let nearestRoad: RoadFeature | undefined = undefined;
  let nearestPoint: Feature<Point, NearestPointProperties> | undefined =
    undefined;

  // const result: NearestFeatureResult[] = [];

  for (const road of roads) {
    // Find the nearest point on this road to the coordinate
    const candidate = nearestPointOnLine(road.geometry, point);

    if (!candidate) {
      continue;
    }
    const distance = candidate.properties.dist;

    if (distance < maxDistance && distance < nearestDistance) {
      nearestDistance = distance;
      // nearestPosition = nearestPoint;
      nearestPoint = candidate as Feature<Point, NearestPointProperties>;
      nearestRoad = road;
    }
  }

  if (!nearestPoint || !nearestRoad) {
    return undefined;
  }

  nearestPoint.properties = {
    ...nearestPoint.properties,
    hash: createPointFeatureHash(nearestPoint, hashPrecision),
    roadHash: nearestRoad.properties?.hash,
    srcHash: createPointHash(point, hashPrecision)
  };

  return nearestPoint as MappedGpsPointFeature;
};
