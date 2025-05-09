import { bbox as turf_bbox } from '@turf/turf';
import { describe, expect, test } from 'vitest';

import {
  gpsWalkAlongTwoLineStrings,
  gpsWalkThreeRoadJunction,
  threeRoadJunction,
  twoLineStrings
} from '../../../components/feature-canvas/data';
import { RoadFeature } from '../../../types';
import { getRoadFeatureBBox } from '../../geo';
import { createLog } from '../../log';
import { buildGraph } from '../buildGraph';
import { graphToFeature } from '../graphToFeature';
import { flatCoords, hashCoords, hashToS } from '../helpers';
import { mapGpsLineStringToRoad, mapGpsToRoad } from '../mapGpsToRoad';
import { createPointFeature, createRoadFeature } from './helpers';

const log = createLog('astar.test');

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
      [20, 0], // krypzpgxc
      [15, 0], // krfxvrfxv
      [10, 0] // kpzpgxczb
    ],
    'road1',
    'krypzpgxc.kpzpgxczb'
  ),
  createRoadFeature(
    [
      [0, 0], // 7zzzzzzzz
      [5, 0],
      [10, 0]
    ],
    'road2',
    '7zzzzzzzz.kpzpgxczb'
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

    expect(flatCoords(feature)).toEqual([0, 0, 5, 0, 10, 0]);
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

    // log.debug('feature', flatCoords(feature));

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

    // log.debug('feature', flatCoords(feature));

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
    // 'krypzpgxc.kpzpgxczb' 20,0 -> 10, 0
    // '7zzzzzzzz.kpzpgxczb' 0,0 -> 10, 0

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

    // log.debug('graphResult', graphResult.path.map(hashToS));

    expect(graphResult.path.map(hashToS)).toEqual([
      // 'pbxy',
      // 'zbzu',
      'pcrv',
      'xczb',
      'pfpu',
      // 'rfxv',
      'pfzg'
    ]);

    const feature = graphToFeature(graphResult);
    // log.debug('feature', flatCoords(feature));

    expect(flatCoords(feature)).toEqual([
      // 4, 0, 5, 0, 8, 0, 10, 0, 12, 0, 15, 0, 16, 0
      8, 0, 10, 0, 12, 0, 15, 0, 16, 0
    ]);
  });

  test('meeting roads again', () => {
    const gpsPoints = [
      createPointFeature([3, 0]), // kpfzg pbxy
      // [5, 0] kpgxc zbzu
      createPointFeature([8, 0]), // kpvxy pcrv
      // [10, 0] kpzpg xczb
      createPointFeature([12, 0]) // krbxc pfpu
      // [15, 0] krfxv rfxv
      // createPointFeature([16, 0]) // krgru pfzg
    ];

    const { mappedGpsPoints } = mapGpsToRoad(meetingRoads, gpsPoints, {
      maxDistance: 1000
    });

    const graphResult = buildGraph(meetingRoads, mappedGpsPoints);

    // log.debug('graphResult', graphResult.path.map(hashToS));

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
    // log.debug('feature', flatCoords(feature));

    expect(flatCoords(feature)).toEqual([
      // 4, 0, 5, 0, 8, 0, 10, 0, 12, 0, 15, 0, 16, 0
      3, 0, 5, 0, 8, 0, 10, 0, 12, 0
    ]);
  });
});

describe('scenarios', () => {
  test('scenario 3', () => {
    const roads = twoLineStrings.features as RoadFeature[];

    // const gpsPoints = gpsWalkAlongTwoLineStrings.features as MappedGpsPointFeature[];

    const { mappedGpsPoints } = mapGpsLineStringToRoad(
      roads,
      gpsWalkAlongTwoLineStrings
    );

    // log.debug(
    //   'mappedGpsPoints',
    //   mappedGpsPoints.map(p => hashToS(p.properties.hash))
    // );

    const graphResult = buildGraph(roads, mappedGpsPoints);

    // log.debug('graphResult', graphResult.path.map(hashToS));

    expect(graphResult.path.map(hashToS)).toEqual([
      'yzts',
      'yztj',
      'yzsy',
      'yzub',
      'yzvn'
    ]);

    const feature = graphToFeature(graphResult);
    // log.debug('feature', hashCoords(feature));

    expect(hashCoords(feature)).toEqual([
      'yzts',
      'yztk',
      'yztj',
      'yzsy',
      'yzub',
      'yzv4',
      'yzvn'
    ]);
  });

  test('scenario 3 simple', () => {
    // nbjj.yzsy
    // yztf.yzsy
    const roads = twoLineStrings.features as RoadFeature[];

    const { mappedGpsPoints } = mapGpsLineStringToRoad(
      roads,
      gpsWalkAlongTwoLineStrings
    );

    // [ "yzts", "yztj", "yzub", "yzvn" ]
    // log.debug(
    //   'mappedGpsPoints',
    //   mappedGpsPoints.map(p => hashToS(p.properties.hash))
    // );

    const graphResult = buildGraph(roads, mappedGpsPoints, {
      includeAllGpsPoints: false
    });

    // log.debug('graphResult', graphResult.path.map(hashToS));

    expect(graphResult.path.map(hashToS)).toEqual(['yzts', 'yzsy', 'yzvn']);

    const feature = graphToFeature(graphResult);
    log.debug('feature', feature);
    // log.debug('feature', hashCoords(feature));

    expect(hashCoords(feature)).toEqual([
      'yzts',
      'yztk',
      'yzsy',
      'yzv4',
      'yzvn'
    ]);
  });

  test('scenario 4', () => {
    // yzhn.yygz 2 1 0
    // yzhn.yz40 0 1 2
    const roads = threeRoadJunction.features as RoadFeature[];

    const { mappedGpsPoints } = mapGpsLineStringToRoad(
      roads,
      gpsWalkThreeRoadJunction
    );
    // yz5b
    // yzhj
    // yz5w

    const graphResult = buildGraph(roads, mappedGpsPoints);

    // log.debug('graphResult', graphResult.path.map(hashToS));

    expect(graphResult.path.map(hashToS)).toEqual([
      'yz5b',
      'yzhj',
      'yzhn',
      'yz5w',
      'yz5n'
    ]);

    // const feature = graphToFeature(graphResult);
    // log.debug('feature', hashCoords(feature));
  });

  test('scenario 4 analog', () => {
    const roads = [
      createRoadFeature(
        [
          [0, 0], // zzzz
          // [-5, 0], //
          [-10, 0] // rypz
        ],
        'road1'
      ),
      createRoadFeature(
        [
          [0, 0], // zzzz
          // [0, 5],
          [0, 10] // uryp
        ],
        'road2'
      )
    ];

    const gpsPoints = [
      createPointFeature([-8, 0]), // zyxf
      createPointFeature([-2, 0]), // rzxu
      createPointFeature([0, 8]) // brgr
    ];

    const { mappedGpsPoints } = mapGpsToRoad(roads, gpsPoints, {
      maxDistance: 1000
    });

    // log.debug('mappedGpsPoints', mappedGpsPoints);

    const graphResult = buildGraph(roads, mappedGpsPoints);

    // log.debug('graphResult', graphResult.path.map(hashToS));

    expect(graphResult.path.map(hashToS)).toEqual([
      'zyxf',
      'rzxu',
      'zzzz',
      'brgr'
    ]);

    const feature = graphToFeature(graphResult);
    // log.debug('feature', feature);
    // log.debug('feature', flatCoords(feature));
    // log.debug('feature', hashCoords(feature));

    expect(flatCoords(feature)).toEqual([-8, 0, -2, 0, 0, 0, 0, 8]);
  });
});
