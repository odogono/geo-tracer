import { Feature, FeatureCollection, LineString, Point } from 'geojson';

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

export type RoadPoints = {
  points: Feature<Point>[];
  road: Feature<LineString>;
};

export type RoadHash = string;

export type RoadPointsMap = Record<RoadHash, RoadPoints>;

export type DirectionVector = GeoJSON.Position;

export type GpsPointFeature = Feature<Point, CommonFeatureProperties>;

export type RoadFeature = Feature<LineString, CommonFeatureProperties>;

export type MappedGpsPointFeature = Feature<Point, MappedGpsPointProperties>;

type MappedGpsPointProperties = CommonFeatureProperties & {
  dist: number; // distance between pt and the closest point
  index: number; // closest point was found on nth line part
  isRoadPoint?: boolean; // whether this is actually a road point
  location: number; // distance along the line between start and the closest point
  multiFeatureIndex: number; // closest point was found on the nth line of the `MultiLineString`
  roadHash: string;
  srcHash: string;
};
