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
