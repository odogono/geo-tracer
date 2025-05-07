import { bbox as turf_bbox } from '@turf/turf';
import { Feature, LineString } from 'geojson';
import { describe, expect, test } from 'vitest';

import { getRoadFeatureBBox } from '../../geo';
import { createLog } from '../../log';
import { buildGraph } from '../buildGraph';
import { graphToFeature } from '../graphToFeature';
import { hashToS } from '../helpers';
import { mapGpsToRoad } from '../mapGpsToRoad';
import { createPointFeature, createRoadFeature } from './helpers';

const log = createLog('astar.test');

const flatCoords = (feature: Feature<LineString> | undefined) =>
  feature?.geometry.coordinates.flat().map(n => Number(n.toFixed(1)));

const singleRoad = [
  createRoadFeature(
    [
      [0, 0],
      [5, 0],
      [10, 0] // kpzpgxczb
    ],
    'road1',
    '7zzzzzzzz.kpzpgxczb'
  )
];

const reverseRoad = [
  createRoadFeature(
    [
      [10, 0],
      [5, 0],
      [0, 0] // kpzpgxczb
    ],
    'road1',
    'kpzpgxczb.7zzzzzzzz'
  )
];
const longReverseRoad = [
  createRoadFeature(
    [
      [20, 0],
      [16, 0],
      [12, 0],
      [8, 0],
      [4, 0],
      [0, 0]
    ],
    'road1',
    'kpzpgxczb.7zzzzzzzz'
  )
];

const multiRoad = [
  ...singleRoad,
  createRoadFeature(
    [
      [10, 0], // kpzpgxczb
      [10, 5],
      [10, 10] // s1z0gs3y0
    ],
    'road2',
    'kpzpgxczb.s1z0gs3y0'
  )
];

const meetingRoads = [
  createRoadFeature(
    [
      [0, 0],
      [5, 0],
      [10, 0]
    ],
    'road1'
  ),
  createRoadFeature(
    [
      [20, 0],
      [15, 0],
      [10, 0]
    ],
    'road2'
  )
];

const crossRoads = [
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

describe('Path finding', () => {
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
  test('north to south', () => {
    const gpsPoints = [
      createPointFeature([0, -10]), // rcpz
      createPointFeature([0, 10]) // xzbq
    ];

    const { mappedGpsPoints } = mapGpsToRoad(crossRoads, gpsPoints, {
      maxDistance: 1000
    });

    const { path } = buildGraph(crossRoads, mappedGpsPoints);

    expect(path).toEqual(['7ypzpgxcz', '7zzzzzzzz', 'eczbzuryp']);
  });

  test('north to east', () => {
    const gpsPoints = [
      createPointFeature([0, -10]), // rcpz
      createPointFeature([10, 0]) // xzbq
    ];

    const { mappedGpsPoints } = mapGpsToRoad(crossRoads, gpsPoints, {
      maxDistance: 1000
    });

    const { path } = buildGraph(crossRoads, mappedGpsPoints);

    expect(path).toEqual(['7ypzpgxcz', '7zzzzzzzz', 'kpzpgxczb']);
  });

  test('north to south, with error', () => {
    const gpsPoints = [
      createPointFeature([0, -10]), // gxcz
      createPointFeature([1, 0]), // zbpv
      createPointFeature([0, 10]) // uryp
    ];

    const { mappedGpsPoints } = mapGpsToRoad(crossRoads, gpsPoints, {
      maxDistance: 1000
    });

    const { path } = buildGraph(crossRoads, mappedGpsPoints);

    // log.debug(
    //   'path',
    //   path.map(p => p.slice(-4))
    // );

    expect(path).toEqual(['7ypzpgxcz', '7zzzzzzzz', 'eczbzuryp']);
  });
});

describe('multi-segment road', () => {
  test('simple road', () => {
    const gpsPoints = [
      createPointFeature([0, 0]), // zzzz
      createPointFeature([10, 0]) // xczb
    ];

    const { mappedGpsPoints } = mapGpsToRoad(singleRoad, gpsPoints, {
      maxDistance: 1000
    });

    const graphResult = buildGraph(singleRoad, mappedGpsPoints);

    expect(graphResult.path).toEqual(['7zzzzzzzz', 'kpzpgxczb']);

    const feature = graphToFeature(graphResult);

    expect(feature?.geometry.coordinates).toEqual([
      [0, 0],
      [5, 0],
      [10, 0]
    ]);
  });
  test('gps start along road', () => {
    const gpsPoints = [
      createPointFeature([2.5, 0]),
      createPointFeature([10, 0])
    ];

    const { mappedGpsPoints } = mapGpsToRoad(singleRoad, gpsPoints, {
      maxDistance: 1000
    });
    const graphResult = buildGraph(singleRoad, mappedGpsPoints);
    const feature = graphToFeature(graphResult);

    log.debug('feature', flatCoords(feature));

    expect(flatCoords(feature)).toEqual([2.5, 0, 5, 0, 10, 0]);
  });
  test('gps at end of road', () => {
    const gpsPoints = [
      createPointFeature([7.5, 0]),
      createPointFeature([10, 0])
    ];

    const { mappedGpsPoints } = mapGpsToRoad(singleRoad, gpsPoints, {
      maxDistance: 1000
    });
    const graphResult = buildGraph(singleRoad, mappedGpsPoints);
    const feature = graphToFeature(graphResult);

    expect(flatCoords(feature)).toEqual([7.5, 0, 10, 0]);
  });
  test('gps at mid road', () => {
    const gpsPoints = [
      createPointFeature([2.5, 0]),
      createPointFeature([7.5, 0])
    ];

    const { mappedGpsPoints } = mapGpsToRoad(singleRoad, gpsPoints, {
      maxDistance: 1000
    });
    const graphResult = buildGraph(singleRoad, mappedGpsPoints);
    const feature = graphToFeature(graphResult);

    log.debug('feature', flatCoords(feature));

    expect(flatCoords(feature)).toEqual([2.5, 0, 5, 0, 7.5, 0]);
  });

  test('multi road', () => {
    const gpsPoints = [
      createPointFeature([5, 0]), // kpgxc zbzu
      createPointFeature([10, 0]), // kpzpg xczb
      createPointFeature([10, 5]) // s0zh7 w1z0
    ];

    const { mappedGpsPoints } = mapGpsToRoad(multiRoad, gpsPoints, {
      maxDistance: 1000
    });
    const graphResult = buildGraph(multiRoad, mappedGpsPoints);
    const feature = graphToFeature(graphResult);

    // log.debug('graphResult', graphResult.path.map(hashToS));
    // log.debug('feature', flatCoords(feature));

    expect(flatCoords(feature)).toEqual([5, 0, 10, 0, 10, 5]);
  });

  test('reverse road path', () => {
    const gpsPoints = [
      createPointFeature([5, 0]), // kpgxc zbzu
      // [5,0] kpgxc zbzu
      createPointFeature([7, 0]), // kpuzz rcpz
      createPointFeature([13, 0]), // krcpz zfrc
      createPointFeature([19, 0]) // krvxb rgru
    ];

    const { mappedGpsPoints } = mapGpsToRoad(longReverseRoad, gpsPoints, {
      maxDistance: 1000
    });

    const graphResult = buildGraph(longReverseRoad, mappedGpsPoints);

    // log.debug('graphResult', graphResult.path.map(hashToS));

    expect(graphResult.path.map(hashToS)).toEqual([
      'zbzu',
      'rcpz',
      'zfrc',
      'rgru'
    ]);

    const feature = graphToFeature(graphResult);
    // log.debug('feature', flatCoords(feature));

    expect(flatCoords(feature)).toEqual([
      5, 0, 7, 0, 8, 0, 12, 0, 13, 0, 16, 0, 19, 0
    ]);
  });

  test('meeting roads', () => {
    const gpsPoints = [
      // createPointFeature([4, 0]), // kpfzg pbxy
      // [5, 0] kpgxc zbzu
      createPointFeature([8, 0]), // kpvxy pcrv
      // [10, 0] kpzpg xczb
      createPointFeature([12, 0]), // krbxc pfpu
      // [15, 0] krfxv rfxv
      createPointFeature([16, 0]) // krgru pfzg
    ];

    const { mappedGpsPoints } = mapGpsToRoad(meetingRoads, gpsPoints, {
      maxDistance: 1000
    });

    const graphResult = buildGraph(meetingRoads, mappedGpsPoints);

    log.debug('graphResult', graphResult.path.map(hashToS));

    // expect(graphResult.path.map(hashToS)).toEqual([
    //   // 'pbxy',
    //   // 'zbzu',
    //   'pcrv',
    //   'xczb',
    //   'pfpu',
    //   // 'rfxv',
    //   'pfzg'
    // ]);

    const feature = graphToFeature(graphResult);
    log.debug('feature', flatCoords(feature));

    expect(flatCoords(feature)).toEqual([
      // 4, 0, 5, 0, 8, 0, 10, 0, 12, 0, 15, 0, 16, 0
      8, 0, 10, 0, 12, 0, 15, 0, 16, 0
    ]);
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

    log.debug('path', path);

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

  test('three point path', () => {
    // road 1: zzzz.xczb
    // road 2: xczb.s3y0

    const gpsPoints = [
      createPointFeature([5, 0]), // kpgxczbzu
      createPointFeature([10, 0]), // kpzpgxczb
      createPointFeature([10, 5]) // s0zh7w1z0
    ];

    const { mappedGpsPoints } = mapGpsToRoad(multiRoad, gpsPoints, {
      maxDistance: 1000
    });

    // log.debug('mappedGpsPoints', mappedGpsPoints);

    const { path } = buildGraph(multiRoad, mappedGpsPoints);

    log.debug('path', path);

    expect(path).toEqual(['kpgxczbzu', 'kpzpgxczb', 's0zh7w1z0']);
  });
});
