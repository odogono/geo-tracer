import { useMemo } from 'react';

import { bbox as turfBbox } from '@turf/turf';
import { LineString, Point } from 'geojson';

import { createLog } from '@helpers/log';
import { mapGpsLineStringToRoad } from '@helpers/route/mapGpsToRoad';
import { RoadFeature } from '@types';

import { buildGraph } from '../../../helpers/route/buildGraph';
import { graphToFeature } from '../../../helpers/route/graphToFeature';
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
      color: '#000',
      showIndexes: true
    }
  };

  const gpsFC: FeatureCollectionWithProperties<LineString> = {
    ...gps,
    bbox: turfBbox(gps),
    properties: {
      color: '#00ff00',
      showIndexes: true
    }
  };

  // calculate overall bbox
  const bbox = bboxSum([roadsFC.bbox, gpsFC.bbox]);
  const bboxString = bbox.join(',');

  const [nodes, route] = useMemo(() => {
    const roads = roadsFC.features as RoadFeature[];

    const { mappedGpsPoints } = mapGpsLineStringToRoad(roads, gpsFC);

    const nodesFC: FeatureCollectionWithProperties<Point> = {
      ...gpsFC,
      features: mappedGpsPoints,
      properties: {
        color: '#FFF'
      }
    };

    const graphResult = buildGraph(roads, mappedGpsPoints, {
      includeAllGpsPoints: false
    });
    const graphFeatureCollection = graphToFeature(
      graphResult
    ) as FeatureCollectionWithProperties<LineString>;

    if (!graphFeatureCollection) {
      return [nodesFC];
    }

    graphFeatureCollection.properties = {
      color: '#F0F',
      showIndexes: true,
      strokeWidth: 4
    };

    // const result: FeatureCollectionWithProperties<LineString> = {
    //   features: [feature],
    //   properties: {
    //     color: '#F0F',
    //     showIndexes: true,
    //     strokeWidth: 4
    //   },
    //   type: 'FeatureCollection'
    // };

    // const nodesFC: FeatureCollectionWithProperties<Point> = {
    //   ...gpsFC,
    //   features: mappedGpsPoints,
    //   properties: {
    //     color: '#FFF'
    //   }
    // };

    log.debug('nodesFC', nodesFC);

    return [nodesFC, graphFeatureCollection];
    // map the gps points on to the roads
    // const { nodes, roadPointsMap } = mapLineString(gpsFC, roadsFC);

    // return [nodes, createRoute(roadPointsMap, nodes)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bboxString, scenarioId]);

  return {
    bbox,
    featureCollections: [roadsFC, nodes, gpsFC, route]
  };
};
