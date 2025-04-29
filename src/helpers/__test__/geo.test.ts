import { Feature, LineString, Point } from 'geojson';
import { describe, expect, it } from 'vitest';

import { RoadPointsMap, buildSearchRouteGraph } from '../geo';
import { createLog } from '../log';

const log = createLog('geo.test');

describe('helpers/geo', () => {
  describe('buildSearchRouteGraph', () => {
    it('should return an empty graph for an empty road points map', () => {
      const roadPointsMap: RoadPointsMap = {};
      const graph = buildSearchRouteGraph(roadPointsMap);

      expect(graph).toBeDefined();
      expect(graph.nodes).toHaveLength(0);
      expect(graph.edges).toHaveLength(0);
    });

    it('should handle a road with no points', () => {
      const roadPointsMap: RoadPointsMap = {
        road1: {
          points: [],
          road: {
            geometry: {
              coordinates: [
                [0, 0],
                [1, 1],
                [2, 0]
              ],
              type: 'LineString'
            },
            properties: {},
            type: 'Feature'
          }
        }
      };

      const graph = buildSearchRouteGraph(roadPointsMap);

      // Should create nodes for each road coordinate
      expect(graph.nodes).toHaveLength(3);
      // No edges since there are no points
      expect(graph.edges).toHaveLength(0);
    });

    it('should create a graph with nodes and edges for a road with points on segments', () => {
      const roadPointsMap = createRoadPointsMap(
        [
          [0, 0],
          [1, 1],
          [2, 0]
        ],
        [
          [0.5, 0.5],
          [1.5, 0.5]
        ]
      );

      const graph = buildSearchRouteGraph(roadPointsMap);

      // log.debug('graph', graph);

      // Should create nodes for road coordinates and points
      expect(graph.nodes.length).toBe(3);

      // Should create edges between nodes
      expect(graph.edges.length).toBe(2);
    });

    it.only('should create a graph 2', () => {
      const roadPointsMap = createRoadPointsMap(
        [
          [0, 0],
          [5, 0],
          [10, 0]
        ],
        [
          [2, 0],
          // [5, 0],
          [8, 0]
        ]
      );

      const graph = buildSearchRouteGraph(roadPointsMap);

      log.debug('graph', graph);

      // Should create nodes for road coordinates and points
      expect(graph.nodes.length).toBe(2);

      // Should create edges between nodes
      expect(graph.edges.length).toBe(2);
    });

    it('should handle a road with points not on any segment', () => {
      // Create a road with coordinates
      const roadCoords = [
        [0, 0],
        [1, 1],
        [2, 0]
      ];
      const road: Feature<LineString> = {
        geometry: {
          coordinates: roadCoords,
          type: 'LineString'
        },
        properties: {},
        type: 'Feature'
      };

      // Create points that are not on any road segment
      const points: Feature<Point>[] = [
        {
          geometry: {
            coordinates: [3, 3],
            type: 'Point' // Not on any segment
          },
          properties: {},
          type: 'Feature'
        }
      ];

      const roadPointsMap: RoadPointsMap = {
        road1: {
          points,
          road
        }
      };

      const graph = buildSearchRouteGraph(roadPointsMap);

      // Should create nodes for road coordinates
      expect(graph.nodes.length).toBeGreaterThan(0);

      // No edges since points are not on any segment
      expect(graph.edges.length).toBe(0);
    });
  });
});

const createRoadPointsMap = (
  roadCoords: GeoJSON.Position[],
  gpsPoints: GeoJSON.Position[]
): RoadPointsMap => {
  const road = createRoadFeature(roadCoords);
  const points = gpsPoints.map(createPointFeature);

  return {
    [road.properties?.id ?? 'road1']: {
      points,
      road
    }
  };
};

const createRoadFeature = (
  coordinates: GeoJSON.Position[]
): GeoJSON.Feature<GeoJSON.LineString> => ({
  geometry: {
    coordinates,
    type: 'LineString'
  },
  properties: {},
  type: 'Feature'
});

const createPointFeature = (
  coordinates: GeoJSON.Position
): GeoJSON.Feature<GeoJSON.Point> => ({
  geometry: {
    coordinates,
    type: 'Point'
  },
  properties: {},
  type: 'Feature'
});
