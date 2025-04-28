import { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';

export type FeatureCollectionWithProperties<T extends Geometry> =
  FeatureCollection<T, GeoJsonProperties> & {
    properties: {
      color: string;
      showIndexes?: boolean;
      strokeWidth?: number;
    };
  };
