import { writeFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  GraphEdge,
  GraphNode,
  createGraphNode,
  generateSvgDiagram,
  graphSearch
} from '../astar';
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
      const roadPointsMap: RoadPointsMap = createRoadPointsMap(
        [
          [0, 0],
          [1, 1],
          [2, 0]
        ],
        []
      );

      const graph = buildSearchRouteGraph(roadPointsMap);

      // Should create nodes for each road coordinate
      expect(graph.nodes).toHaveLength(0);
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
      expect(graph.nodes).toHaveLength(3);

      // Should create edges between nodes
      expect(graph.edges).toHaveLength(2);
    });

    it('should create a graph 2', () => {
      const roadPointsMap = createRoadPointsMap(
        [
          [0, 0],
          [5, 0],
          [10, 0]
        ],
        [
          [2, 0],
          [5, 0],
          [8, 0]
        ]
      );

      const graph = buildSearchRouteGraph(roadPointsMap);

      // log.debug('graph', graph);

      // Should create nodes for road coordinates and points
      expect(graph.nodes).toHaveLength(3);

      // Should create edges between nodes
      expect(graph.edges).toHaveLength(2);

      const startNode = createGraphNode(graph, [2, 0], true);
      const endNode = createGraphNode(graph, [8, 0], true);

      const path = graphSearch(graph, startNode, endNode);

      log.debug('path', path);

      expect(path).toEqual([
        expect.objectContaining({ point: [2, 0] }),
        expect.objectContaining({ point: [5, 0] }),
        expect.objectContaining({ point: [8, 0] })
      ]);
    });

    it.only('should create with an ophan point', () => {
      const roadPointsMap = {
        road1: {
          points: [createPointFeature([2, 0])],
          road: createRoadFeature([
            [0, 0],
            [5, 0]
          ])
        },
        road2: {
          points: [createPointFeature([6, 0])],
          road: createRoadFeature([
            [5, 0],
            [10, 0]
          ])
        },
        road3: {
          points: [createPointFeature([5, 3])],
          road: createRoadFeature([
            [5, 0],
            [5, 5]
          ])
        }
      };

      const graph = buildSearchRouteGraph(roadPointsMap);

      log.debug('edges\n', graph.edges.map(edgeToString).join('\n'));
      log.debug('nodes\n', graph.nodes.map(nodeToString).join('\n'));

      log.debug('nodes', graph.nodes);

      // Should create nodes for road coordinates and points
      // expect(graph.nodes).toHaveLength(5);

      // Should create edges between nodes
      // expect(graph.edges).toHaveLength(4);

      const startNode = createGraphNode(graph, [2, 0], true);
      const endNode = createGraphNode(graph, [5, 3], true);

      const path = graphSearch(graph, startNode, endNode);

      log.debug('path', path);

      expect(path).toEqual([
        expect.objectContaining({ point: [2, 0] }),
        expect.objectContaining({ point: [5, 0] }),
        expect.objectContaining({ point: [5, 3] })
      ]);
    });

    it('should handle a road with points not on any segment', () => {
      const roadPointsMap = createRoadPointsMap(
        [
          [0, 0],
          [1, 1],
          [2, 0]
        ],
        [[3, 3]]
      );

      const graph = buildSearchRouteGraph(roadPointsMap);

      // log.debug('graph', graph);

      // Should create nodes for road coordinates
      expect(graph.nodes).toHaveLength(0);

      // No edges since points are not on any segment
      expect(graph.edges).toHaveLength(0);
    });
  });

  describe('SVG Diagram Generation', () => {
    it('should generate an SVG diagram for a simple graph with path', () => {
      const roadPointsMap = createRoadPointsMap(
        [
          [0, 0],
          [5, 0],
          [10, 0]
        ],
        [
          [2, 0],
          [5, 0],
          [8, 0]
        ]
      );

      const graph = buildSearchRouteGraph(roadPointsMap);

      // Find the nodes we want to use for the path
      const startNode = graph.nodes.find(
        node => node.point[0] === 2 && node.point[1] === 0
      )!;
      const endNode = graph.nodes.find(
        node => node.point[0] === 8 && node.point[1] === 0
      )!;

      const path = graphSearch(graph, startNode, endNode);

      const svg = generateSvgDiagram(graph, path, {
        height: 300,
        nodeRadius: 4,
        padding: 30,
        width: 400
      });

      // Basic structure checks
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');

      // Should contain nodes
      expect(svg).toContain('<circle');
      expect(svg).toContain('2.00, 0.00');
      expect(svg).toContain('5.00, 0.00');
      expect(svg).toContain('8.00, 0.00');

      // Should contain edges
      expect(svg).toContain('<line');

      // Should contain path highlighting
      expect(svg).toContain('stroke="#ff0000"');

      // Log the SVG for manual inspection
      log.debug('SVG Diagram:', svg);

      // Write the SVG to a file for visualization
      writeFileSync('graph.svg', svg);
    });
  });
});

const createRoadPointsMap = (
  roadCoords: GeoJSON.Position[],
  gpsPoints: GeoJSON.Position[]
): RoadPointsMap => {
  const road = createRoadFeature(roadCoords, 'road1');
  const points = gpsPoints.map(createPointFeature);

  return {
    [road.properties?.id ?? 'road1']: {
      points,
      road
    }
  };
};

const createRoadFeature = (
  coordinates: GeoJSON.Position[],
  id: string = 'road1'
): GeoJSON.Feature<GeoJSON.LineString> => ({
  geometry: {
    coordinates,
    type: 'LineString'
  },
  properties: { id },
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

const edgeToString = (edge: GraphEdge) =>
  `${edge.from.point[0]},${edge.from.point[1]} -> ${edge.to.point[0]},${edge.to.point[1]}`;

const nodeToString = (node: GraphNode) => `${node.point[0]},${node.point[1]}`;
