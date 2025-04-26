import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

export type FeatureCollectionWithProperties = FeatureCollection<
  Geometry,
  GeoJsonProperties
> & {
  properties: {
    color: string;
  };
};
