import { bbox as turf_bbox } from '@turf/turf';
import { describe, expect, test } from 'vitest';

import { getRoadFeatureBBox } from '../../geo';
import { createLog } from '../../log';
import { buildGraph } from '../buildGraph';
import { mapGpsToRoad } from '../mapGpsToRoad';
import { createPointFeature, createRoadFeature } from './helpers';

const log = createLog('geo.test');

describe('geo', () => {
  test('getRoadFeatureBBox', () => {
    const road = createRoadFeature(
      [
        [0, 0],
        [4, 0],
        [10, 0],
        [10, 7]
      ],
      'road1'
    );
    const bbox = getRoadFeatureBBox(road);
    expect(bbox).toEqual([0, 0, 10, 7]);
    expect(turf_bbox(road)).toEqual(bbox);
  });
});

describe('graph building', () => {
  const roads = [
    createRoadFeature(
      [
        [0, 0],
        [10, 0]
      ],
      'road1',
      '7zzzzzzzz.kpzpgxczb'
    ),
    createRoadFeature(
      [
        [10, 0],
        [5, 5]
      ],
      'road2',
      'kpzpgxczb.s0gs3y0zh'
    ),
    createRoadFeature(
      [
        [5, 5],
        [0, 0]
      ],
      'road3',
      's0gs3y0zh.7zzzzzzzz'
    )
  ];

  test('first path', () => {
    const gpsPoints = [
      createPointFeature([7, 0]), // rcpz
      createPointFeature([7.5, 2.5]), // xzbq
      createPointFeature([5, 5]) // y0zh
    ];

    // map gps point to points that are on the road
    const { mappedGpsPoints } = mapGpsToRoad(roads, gpsPoints, {
      maxDistance: 1000
    });

    const { path } = buildGraph(roads, mappedGpsPoints);

    expect(path).toEqual(['kpuzzrcpz', 'kpzpgxczb', 's0mq4xzbq', 's0gs3y0zh']);
  });

  test('a road loop starting and ending on the same road', () => {
    // get the road of the current point
    // get the road of the next point

    const gpsPoints = [
      createPointFeature([7, 0]), // rcpz
      createPointFeature([7.5, 2.5]), // xzbq
      createPointFeature([5, 5]), // y0zh
      createPointFeature([0, 0]) // zzzz
      // createPointFeature([2, 0]) // xbrg
    ];

    // map gps point to points that are on the road
    const { mappedGpsPoints } = mapGpsToRoad(roads, gpsPoints, {
      maxDistance: 1000
    });

    log.debug('mappedGpsPoints', mappedGpsPoints);

    const { path } = buildGraph(roads, mappedGpsPoints);

    expect(path).toEqual([
      'kpuzzrcpz',
      'kpzpgxczb',
      's0mq4xzbq',
      's0gs3y0zh',
      '7zzzzzzzz'
    ]);

    // build a graph from the points and roads

    // the correct path is:
    // kpuzzrcpz -> kpzpgxczb
    // kpzpgxczb -> s0mq4xzbq
    // s0mq4xzbq -> s0gs3y0zh
    // s0gs3y0zh -> 7zzzzzzzz
    // 7zzzzzzzz -> kpcrvxbrg

    // associatePointsWithRoads(gpsPoints, roads);
    // const graph = buildRouteGraphFromRoadsAndPoints(roads, gpsPoints);

    // log.debug('graph', graph);

    // expect(graph.nodes).toEqual([
    //   expect.objectContaining({ point: [7, 0] }),
    //   expect.objectContaining({ point: [10, 0] }),
    //   expect.objectContaining({ point: [5, 5] }),
    //   expect.objectContaining({ point: [0, 0] }),
    //   expect.objectContaining({ point: [2, 0] })
    // ]);

    // expect(graph.edges).toEqual([
    //   expect.objectContaining({ from: [7, 0], to: [10, 0] }),
    //   expect.objectContaining({ from: [10, 0], to: [5, 5] }),
    //   expect.objectContaining({ from: [5, 5], to: [0, 0] }),
    //   expect.objectContaining({ from: [0, 0], to: [2, 0] })
    // ]);
  });
});
