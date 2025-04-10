import { nearestPointOnLine } from '@turf/nearest-point-on-line';

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
  feature?.geometry.type === 'Point';

export const isLineStringFeature = (feature: GeoJSON.Feature | null) =>
  feature?.geometry.type === 'LineString';

/**
 * Finds the nearest point on a LineString from a given point
 * @param point The point to find the nearest point from
 * @param lineString The LineString to find the nearest point on
 * @returns The nearest point on the LineString
 */
export const findNearestPointOnLine = (
  point: GeoJSON.Position,
  lineString: GeoJSON.LineString
): GeoJSON.Position => {
  // Create a GeoJSON Point feature from the input point
  const pointFeature: GeoJSON.Feature<GeoJSON.Point> = {
    geometry: {
      coordinates: point,
      type: 'Point' as const
    },
    properties: {},
    type: 'Feature' as const
  };

  // Create a GeoJSON LineString feature from the input lineString
  const lineStringFeature: GeoJSON.Feature<GeoJSON.LineString> = {
    geometry: lineString,
    properties: {},
    type: 'Feature' as const
  };

  // Find the nearest point on the line
  const result = nearestPointOnLine(lineStringFeature, pointFeature);

  // Return the coordinates of the nearest point
  return result.geometry.coordinates;
};
