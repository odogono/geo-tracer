import { bbox as turfBbox } from '@turf/turf';

import { scenarios } from '../data';
import { bboxSum } from '../helpers';
import { FeatureCollectionWithProperties } from '../types';

export const useScenario = (scenarioId: string) => {
  const scenario = scenarios.find(s => s.id === scenarioId);
  if (!scenario) {
    throw new Error(`Scenario ${scenarioId} not found`);
  }

  const { gps, roads } = scenario;

  const roadsFC: FeatureCollectionWithProperties = {
    ...roads,
    bbox: turfBbox(roads),
    properties: {
      color: '#000'
    }
  };

  const gpsFC: FeatureCollectionWithProperties = {
    ...gps,
    bbox: turfBbox(gps),
    properties: {
      color: '#00ff00'
    }
  };

  // roads.bbox = turf.bbox(roads);
  // gps.bbox = turf.bbox(gps);

  // calculate overall bbox
  const bbox = bboxSum([roadsFC.bbox, gpsFC.bbox]);

  // const routeCollection = turfFeatureCollection([roadsFC, gpsFC]);

  return {
    bbox,
    featureCollections: [roadsFC, gpsFC]
  };
};
