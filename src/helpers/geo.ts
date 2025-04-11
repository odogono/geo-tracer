import { nearestPointOnLine } from '@turf/nearest-point-on-line';
import { BBox, Feature, LineString, Point, Polygon, Position } from 'geojson';

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
  feature?.geometry.type === 'Point';

export const isLineStringFeature = (feature: GeoJSON.Feature | null) =>
  feature?.geometry.type === 'LineString';

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

export const findPointOnNearestFeature = (
  point: GeoJSON.Position,
  features: GeoJSON.FeatureCollection,
  options: FindPointOnNearestFeatureOptions = {}
) => {
  const maxDistance = options.maxDistance || 0.015; // 15 metres
  // let nearestPosition: GeoJSON.Position | undefined = undefined;
  let nearestDistance: number | undefined = Infinity;
  let nearestResult: GeoJSON.Feature<GeoJSON.Point> | undefined = undefined;

  const result: Feature<Point>[] = [];

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
    const nearestPoint = candidate.geometry.coordinates;
    const distance = candidate.properties.dist;

    if (distance < maxDistance && distance < nearestDistance) {
      nearestDistance = distance;
      // nearestPosition = nearestPoint;
      nearestResult = candidate;
      // result.push(candidate);
    }
  }

  return nearestResult ? [nearestResult] : [];
  // return result;
  // return {
  //   distance: nearestDistance,
  //   // position: nearestPosition,
  //   result: nearestResult
  // };
};
