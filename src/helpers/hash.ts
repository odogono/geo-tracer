// import crypto from 'crypto';

import type {
  Feature,
  FeatureCollection,
  LineString,
  MultiPolygon,
  Point,
  Polygon,
  Position
} from 'geojson';
import geohash from 'ngeohash';

// NOTE i have found that precision 9 is not enough for coordinates
const PRECISION = 10;
/**
 * Create a hash of an edge feature
 *
 * @param edgeFeature
 * @returns
 */
export const createEdgeFeatureHash = (
  edgeFeature: Feature<LineString>,
  precision: number = PRECISION
) => {
  const lineString = edgeFeature.geometry as LineString;
  const start = lineString.coordinates[0];
  const end = lineString.coordinates.at(-1);
  if (!end) {
    throw new Error('LineString must have at least one coordinate');
  }
  const startHash = geohash.encode(start[1], start[0], precision);
  const endHash = geohash.encode(end[1], end[0], precision);
  return `${startHash}.${endHash}`;
};

export const createPointFeatureHash = (
  pointFeature: Feature<Point>,
  precision: number = PRECISION
) => {
  const point = pointFeature.geometry as Point;
  const hash = geohash.encode(
    point.coordinates[1],
    point.coordinates[0],
    precision
  );
  return hash;
};

export const createPointHash = (
  point: GeoJSON.Position,
  precision: number = PRECISION
) => geohash.encode(point[1], point[0], precision);

/**
 * Create a hash of a polygon feature
 *
 * @param polygonFeature
 * @returns
 */
export const createPolygonGeometryHash = async (
  polygonFeature: Feature<Polygon>,
  precision: number = 6
) => {
  const polygonGeometry = polygonFeature.geometry;
  const coordinates = polygonGeometry.coordinates[0]; // Use the outer ring
  const roundedCoordinates = roundCoordinatesToPrecision(
    coordinates,
    precision
  );
  const hashes = roundedCoordinates.map(coord =>
    geohash.encode(coord[1], coord[0], PRECISION)
  );
  const sortedHashes = hashes.sort();

  return await createStringsHash(sortedHashes);
};

export const createMultiPolygonGeometryHash = async (
  multiPolygonFeature: Feature<MultiPolygon>,
  precision: number = 6
) => {
  const multiPolygonGeometry = multiPolygonFeature.geometry;
  const result: string[] = [];

  for (const polygon of multiPolygonGeometry.coordinates) {
    const roundedCoordinates = roundCoordinatesToPrecision(
      polygon[0],
      precision
    );
    const hashes = roundedCoordinates.map(coord =>
      geohash.encode(coord[1], coord[0], PRECISION)
    );
    const sortedHashes = hashes.sort();
    result.push(await createStringsHash(sortedHashes));
  }

  return await createStringsHash(result);
};

export const createFeatureHash = async (
  feature: Feature,
  precision: number = 6
) => {
  switch (feature.geometry.type) {
    case 'Polygon':
      return await createPolygonGeometryHash(
        feature as Feature<Polygon>,
        precision
      );
    case 'LineString':
      return await createEdgeFeatureHash(feature as Feature<LineString>);
    case 'MultiPolygon':
      return await createMultiPolygonGeometryHash(
        feature as Feature<MultiPolygon>,
        precision
      );
    case 'Point':
      return await createPointFeatureHash(feature as Feature<Point>);
    default:
      throw new Error(`Unsupported geometry type: ${feature.geometry.type}`);
  }
};

export const createFeatureCollectionHash = async (
  featureCollection: FeatureCollection,
  precision: number = 6
) => {
  const hashes: string[] = [];

  for (const feature of featureCollection.features) {
    hashes.push(await createFeatureHash(feature, precision));
  }

  return await createStringsHash(hashes);
};

/**
 * Create a hash of a list of strings
 * @param strs
 * @returns
 */
export const createStringsHash = async (strs: string[]) => {
  const edgeHashesString = strs.join('|');
  return await createStringHash(edgeHashesString);
};

export const createStringHash = async (str: string, maxLength: number = 16) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex.slice(0, Math.max(0, maxLength));
};

export const roundCoordinatesToPrecision = (
  coordinates: Position[],
  precision: number = 6
) => {
  const factor = Math.pow(10, precision);
  return coordinates.map(coord => [
    Math.round(coord[0] * factor) / factor,
    Math.round(coord[1] * factor) / factor
  ]);
};
