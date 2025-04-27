import { useMemo } from 'react';

import { bbox as turfBbox } from '@turf/turf';
import { Feature, FeatureCollection, LineString, Point } from 'geojson';

import {
  NearestFeatureResult,
  RoadPointsMap,
  buildRouteGraph,
  findPointOnNearestFeature
} from '@helpers/geo';
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
  const bboxString = bbox.join(',');

  const [nodes, route] = useMemo(() => {
    // map the gps points on to the roads
    const { nodes, nodesAndRoads, roadPointsMap } = mapLineString(
      gpsFC,
      roadsFC
    );

    return [nodes, createRoute(roadPointsMap)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bboxString, scenarioId]);

  return {
    bbox,
    featureCollections: [roadsFC, nodes, gpsFC, route]
  };
};

const createRoute = (roadPointsMap: RoadPointsMap) => {
  const result: FeatureCollectionWithProperties<LineString> = {
    features: [],
    properties: {
      color: '#22F'
    },
    type: 'FeatureCollection'
  };

  if (Object.keys(roadPointsMap).length === 0) {
    return result;
  }

  // Get the ordered nodes that form our route, including road transition points
  const routeNodes = buildRouteGraph(roadPointsMap);

  // Create a single LineString feature from all the points
  const routeFeature: Feature<LineString> = {
    geometry: {
      coordinates: routeNodes.map(node => node.geometry.coordinates),
      type: 'LineString'
    },
    properties: {},
    type: 'Feature'
  };

  result.features.push(routeFeature);
  return result;
};

/**
 * Maps src points onto the nearest roads
 *
 * @param src
 * @param roads
 * @returns
 */
const mapLineString = (
  src: FeatureCollection<LineString>,
  roads: FeatureCollection<LineString>
) => {
  const result: NearestFeatureResult[] = [];

  const roadPointsMap: RoadPointsMap = {};

  for (const feature of src.features) {
    for (const coordinate of feature.geometry.coordinates) {
      const nearest = findPointOnNearestFeature(coordinate, roads);
      if (nearest.length === 0) {
        continue;
      }
      result.push(...nearest);
      const [road, point] = nearest[0];
      const roadHash = road.properties?.hash;
      if (!roadHash) {
        continue;
      }

      if (!roadPointsMap[roadHash]) {
        roadPointsMap[roadHash] = { points: [], road };
      }

      roadPointsMap[roadHash].points.push(point);
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
    nodes: nodesFC,
    nodesAndRoads: result,
    roadPointsMap
  };
};
