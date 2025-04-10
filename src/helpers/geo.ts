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

export const findPointOnNearestFeature = (
  point: GeoJSON.Position,
  features: GeoJSON.FeatureCollection
) => {
  let nearestPosition: GeoJSON.Position | undefined = undefined;
  let nearestDistance: number | undefined = Infinity;
  let nearestResult: GeoJSON.Feature<GeoJSON.Point> | undefined = undefined;

  for (const feature of features.features) {
    if (feature.geometry.type !== 'LineString') {
      continue;
    }

    // Find the nearest point on this road to the coordinate
    const result = nearestPointOnLine(feature.geometry, point);

    if (!result) {
      continue;
    }
    // const { properties } = result;
    const nearestPoint = result.geometry.coordinates;
    const distance = result.properties.dist;

    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestPosition = nearestPoint;
      nearestResult = result;
    }
  }

  return {
    distance: nearestDistance,
    position: nearestPosition,
    result: nearestResult
  };
};
