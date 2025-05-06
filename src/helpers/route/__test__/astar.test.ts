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

describe('cross roads', () => {
  const roads = [
    createRoadFeature(
      [
        [0, -10],
        [0, 0]
      ],
      'road1',
      '7ypzpgxcz.7zzzzzzzz'
    ),
    createRoadFeature(
      [
        [0, 0],
        [0, 10]
      ],
      'road2',
      '7zzzzzzzz.eczbzuryp'
    ),
    createRoadFeature(
      [
        [0, 0],
        [-10, 0]
      ],
      'road3',
      '7zzzzzzzz.7zbzurypz'
    ),
    createRoadFeature(
      [
        [0, 0],
        [10, 0]
      ],
      'road4',
      '7zzzzzzzz.kpzpgxczb'
    )
  ];

  test('north to south', () => {
    const gpsPoints = [
      createPointFeature([0, -10]), // rcpz
      createPointFeature([0, 10]) // xzbq
    ];

    const { mappedGpsPoints } = mapGpsToRoad(roads, gpsPoints, {
      maxDistance: 1000
    });

    const { path } = buildGraph(roads, mappedGpsPoints);

    expect(path).toEqual(['7ypzpgxcz', '7zzzzzzzz', 'eczbzuryp']);
  });

  test('north to east', () => {
    const gpsPoints = [
      createPointFeature([0, -10]), // rcpz
      createPointFeature([10, 0]) // xzbq
    ];

    const { mappedGpsPoints } = mapGpsToRoad(roads, gpsPoints, {
      maxDistance: 1000
    });

    const { path } = buildGraph(roads, mappedGpsPoints);

    expect(path).toEqual(['7ypzpgxcz', '7zzzzzzzz', 'kpzpgxczb']);
  });

  test('north to south, with error', () => {
    const gpsPoints = [
      createPointFeature([0, -10]), // gxcz
      createPointFeature([1, 0]), // zbpv
      createPointFeature([0, 10]) // uryp
    ];

    const { mappedGpsPoints } = mapGpsToRoad(roads, gpsPoints, {
      maxDistance: 1000
    });

    const { path } = buildGraph(roads, mappedGpsPoints);

    // log.debug(
    //   'path',
    //   path.map(p => p.slice(-4))
    // );

    expect(path).toEqual(['7ypzpgxcz', '7zzzzzzzz', 'eczbzuryp']);
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

  test('simple path', () => {
    const gpsPoints = [
      createPointFeature([0, 0]), // rcpz
      createPointFeature([10, 0]) // xzbq
    ];

    // map gps point to points that are on the road
    const { mappedGpsPoints } = mapGpsToRoad(roads, gpsPoints, {
      maxDistance: 1000
    });

    const { path } = buildGraph(roads, mappedGpsPoints);

    expect(path).toEqual(['7zzzzzzzz', 'kpzpgxczb']);
  });

  test('simple path reversed', () => {
    const gpsPoints = [
      createPointFeature([10, 0]), // xzbq
      createPointFeature([0, 0]) // rcpz
    ];

    // map gps point to points that are on the road
    const { mappedGpsPoints } = mapGpsToRoad(roads, gpsPoints, {
      maxDistance: 1000
    });

    const { path } = buildGraph(roads, mappedGpsPoints);

    expect(path).toEqual(['kpzpgxczb', '7zzzzzzzz']);
  });

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

  test('second path', () => {
    // get the road of the current point
    // get the road of the next point

    const gpsPoints = [
      createPointFeature([7, 0]), // rcpz
      createPointFeature([7.5, 2.5]), // xzbq
      createPointFeature([5, 5]), // y0zh
      createPointFeature([0, 0]) // zzzz
    ];

    // map gps point to points that are on the road
    const { mappedGpsPoints } = mapGpsToRoad(roads, gpsPoints, {
      maxDistance: 1000
    });

    // log.debug('mappedGpsPoints', mappedGpsPoints);

    const { path } = buildGraph(roads, mappedGpsPoints);

    expect(path).toEqual([
      'kpuzzrcpz',
      'kpzpgxczb',
      's0mq4xzbq',
      's0gs3y0zh',
      '7zzzzzzzz'
    ]);
  });
  test('third path', () => {
    // get the road of the current point
    // get the road of the next point

    const gpsPoints = [
      createPointFeature([7, 0]), // kpuzzrcpz
      createPointFeature([7.5, 2.5]), // s0mq4xzbq
      createPointFeature([5, 5]), // s0gs3y0zh
      createPointFeature([0, 0]), // 7zzzzzzzz
      createPointFeature([2, 0]) // kpcrvxbrg
    ];

    // map gps point to points that are on the road
    const { mappedGpsPoints } = mapGpsToRoad(roads, gpsPoints, {
      maxDistance: 1000
    });

    // log.debug('mappedGpsPoints', mappedGpsPoints);

    const { path } = buildGraph(roads, mappedGpsPoints);

    expect(path).toEqual([
      'kpuzzrcpz',
      'kpzpgxczb',
      's0mq4xzbq',
      's0gs3y0zh',
      '7zzzzzzzz',
      'kpcrvxbrg'
    ]);
  });
});
