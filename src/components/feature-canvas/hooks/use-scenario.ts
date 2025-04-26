import { bbox as turfBbox } from '@turf/turf';
import { FeatureCollection, LineString, Point } from 'geojson';

import { NearestFeatureResult, findPointOnNearestFeature } from '@helpers/geo';
import { createLog } from '@helpers/log';

import { scenarios } from '../data';
import { bboxSum } from '../helpers';
import { FeatureCollectionWithProperties } from '../types';

const log = createLog('useScenario');

export const useScenario = (scenarioId: string) => {
  const scenario = scenarios.find(s => s.id === scenarioId);
  if (!scenario) {
    throw new Error(`Scenario ${scenarioId} not found`);
  }

  const { gps, roads } = scenario;

  const roadsFC: FeatureCollectionWithProperties<LineString> = {
    ...roads,
    bbox: turfBbox(roads),
    properties: {
      color: '#000'
    }
  };

  const gpsFC: FeatureCollectionWithProperties<LineString> = {
    ...gps,
    bbox: turfBbox(gps),
    properties: {
      color: '#00ff00'
    }
  };

  // calculate overall bbox
  const bbox = bboxSum([roadsFC.bbox, gpsFC.bbox]);

  // map the gps points on to the roads
  const { nodes } = mapLineString(gpsFC, roadsFC);

  return {
    bbox,
    featureCollections: [roadsFC, nodes, gpsFC]
  };
};

const mapLineString = (
  src: FeatureCollection<LineString>,
  roads: FeatureCollection<LineString>
) => {
  const result: NearestFeatureResult[] = [];

  for (const feature of src.features) {
    for (const coordinate of feature.geometry.coordinates) {
      const nearest = findPointOnNearestFeature(coordinate, roads);
      if (nearest.length === 0) {
        continue;
      }

      log.debug('[mapLineString] nearest', nearest);
      result.push(...nearest);
    }
  }

  const nodes = result.map(r => r[1]);

  // create a feature collection of points
  const nodesFC: FeatureCollectionWithProperties<Point> = {
    features: nodes,
    properties: {
      color: '#FFF'
    },
    type: 'FeatureCollection'
  };

  return {
    nodes: nodesFC
  };
};
