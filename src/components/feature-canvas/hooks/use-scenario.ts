import { useMemo } from 'react';

import { bbox as turfBbox } from '@turf/turf';
import { Feature, FeatureCollection, LineString, Point } from 'geojson';

import {
  NearestFeatureResult,
  buildSearchRouteGraph,
  findPointOnNearestFeature
} from '@helpers/geo';
import { createLog } from '@helpers/log';
import { createGraphNode, graphSearch } from '@helpers/route/astar';
import { GpsPointFeature, RoadPointsMap } from '@types';

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
    // map the gps points on to the roads
    const { nodes, roadPointsMap } = mapLineString(gpsFC, roadsFC);

    return [nodes, createRoute(roadPointsMap, nodes)];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bboxString, scenarioId]);

  return {
    bbox,
    featureCollections: [roadsFC, nodes, gpsFC, route]
  };
};

const createRoute = (
  roadPointsMap: RoadPointsMap,
  nodes: FeatureCollectionWithProperties<Point>
) => {
  const result: FeatureCollectionWithProperties<LineString> = {
    features: [],
    properties: {
      color: '#F0F',
      showIndexes: true,
      strokeWidth: 4
    },
    type: 'FeatureCollection'
  };

  if (Object.keys(roadPointsMap).length === 0) {
    return result;
  }

  // log.debug('roadPointsMap nodes', nodes);
  const startNode = nodes.features.at(0);
  const endNode = nodes.features.at(-1);

  if (!startNode || !endNode) {
    return result;
  }

  log.debug('roadPointsMap', roadPointsMap);

  // Get the ordered nodes that form our route, including road transition points
  const graph = buildSearchRouteGraph(roadPointsMap);
  const start = createGraphNode(graph, startNode.geometry.coordinates, true);
  const end = createGraphNode(graph, endNode.geometry.coordinates, true);

  const path = graphSearch(graph, start, end);

  // log.debug('path', path);

  const pathCoordinates = path.map(node => node.point);

  // const path = graphSearch(graph, start, end);

  // const routeNodes = buildRouteGraph(roadPointsMap);

  // Create a single LineString feature from all the points
  const routeFeature: Feature<LineString> = {
    geometry: {
      coordinates: pathCoordinates,
      // coordinates: routeNodes.map(node => node.geometry.coordinates),
      type: 'LineString'
    },
    properties: {},
    type: 'Feature'
  };

  result.features.push(routeFeature);
  return result;
};

/**
 * Maps gps points onto the nearest roads
 *
 * @param gps
 * @param roads
 * @returns
 */
const mapLineString = (
  gps: FeatureCollection<LineString>,
  roads: FeatureCollection<LineString>
) => {
  const result: NearestFeatureResult[] = [];

  const roadPointsMap: RoadPointsMap = {};

  const mappedGpsPoints: GpsPointFeature[] = [];

  for (const feature of gps.features) {
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
      point.properties = {
        ...point.properties,
        roadHash: road.properties?.hash
      };

      roadPointsMap[roadHash].points.push(point);

      mappedGpsPoints.push(point);
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
    mappedGpsPoints,
    nodes: nodesFC,
    nodesAndRoads: result,
    roadPointsMap
  };
};
