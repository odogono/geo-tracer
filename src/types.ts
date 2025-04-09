export type DrawMode = 'road' | 'route' | 'none';

export type EdgeFeatureProperties = {
  hash: string;
  length: number;
  name?: string | null;
  type: 'edge';
};

export type EdgeFeature = GeoJSON.Feature<
  GeoJSON.LineString,
  EdgeFeatureProperties
>;

export type RouteFeatureProperties = {
  type: 'route';
};

export type RouteCollection = GeoJSON.FeatureCollection<
  GeoJSON.LineString,
  RouteFeatureProperties
>;
