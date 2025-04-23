import { FeatureCollection } from 'geojson';

export type DrawMode = 'road' | 'route' | 'select' | 'none';

export type CommonFeatureProperties = {
  [key: string]: unknown;
  hash: string;
};

export type EdgeFeatureProperties = CommonFeatureProperties & {
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

export type FeatureCollections = {
  featureCollections: FeatureCollection[];
};

export type FeatureCollectionWithProps = FeatureCollection & {
  properties: {
    name: string;
  };
};
