import { describe, expect, test } from 'vitest';

import { createLog } from '../../log';
import { buildGraph } from '../build-graph';
import { graphToFeature } from '../graph-to-feature';
import { flatCoords, hashToS } from '../helpers';
import { mapGpsToRoad } from '../map-gps-to-road';
import { createPointFeature, createRoadFeature } from './helpers';

const log = createLog('buildGraph.test');

const mapGpsToRoadOptions = {
  hashPrecision: 9,
  maxDistance: 1000
};

describe('buildGraph', () => {
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

  test('gps points match road', () => {
    const gpsPoints = [
      createPointFeature([0, 0]), // zzzz
      createPointFeature([10, 0]) // xczb
    ];

    // map gps point to points that are on the road
    const { mappedGpsPoints } = mapGpsToRoad(
      roads,
      gpsPoints,
      mapGpsToRoadOptions
    );

    const graphResult = buildGraph(roads, mappedGpsPoints);

    // log.debug('graphResult', graphResult.path.map(hashToS));

    expect(graphResult.path.map(hashToS)).toEqual(['zzzz', 'xczb']);
  });

  test('gps points inset road', () => {
    const gpsPoints = [
      createPointFeature([2, 0]), // xbrg
      createPointFeature([8, 0]) // pcrv
    ];

    // map gps point to points that are on the road
    const { mappedGpsPoints } = mapGpsToRoad(
      roads,
      gpsPoints,
      mapGpsToRoadOptions
    );

    const graphResult = buildGraph(roads, mappedGpsPoints);

    // log.debug('graphResult', graphResult.path.map(hashToS));

    expect(graphResult.path.map(hashToS)).toEqual(['xbrg', 'pcrv']);
  });

  test('multiple gps points inset road', () => {
    const gpsPoints = [
      createPointFeature([2, 0]), // xbrg
      createPointFeature([5, 0]), // zbzu
      createPointFeature([8, 0]) // pcrv
    ];

    // map gps point to points that are on the road
    const { mappedGpsPoints } = mapGpsToRoad(
      roads,
      gpsPoints,
      mapGpsToRoadOptions
    );

    const allGpsPointsGraphResult = buildGraph(roads, mappedGpsPoints);
    // log.debug('graphResult', graphResult.path.map(hashToS));

    expect(allGpsPointsGraphResult.path.map(hashToS)).toEqual([
      'xbrg',
      'zbzu',
      'pcrv'
    ]);

    // test with only first and last gps points
    const graphResult = buildGraph(roads, mappedGpsPoints, {
      includeAllGpsPoints: false
    });

    expect(graphResult.path.map(hashToS)).toEqual(['xbrg', 'pcrv']);
  });

  test('simple path reversed', () => {
    const gpsPoints = [
      createPointFeature([10, 0]), // xzbq
      createPointFeature([0, 0]) // rcpz
    ];

    // map gps point to points that are on the road
    const { mappedGpsPoints } = mapGpsToRoad(
      roads,
      gpsPoints,
      mapGpsToRoadOptions
    );

    const graphResult = buildGraph(roads, mappedGpsPoints);

    expect(graphResult.path.map(hashToS)).toEqual(['xczb', 'zzzz']);
  });

  test('first path', () => {
    const gpsPoints = [
      createPointFeature([7, 0]), // rcpz
      // 10,0 xczb
      createPointFeature([7.5, 2.5]), // xzbq
      createPointFeature([5, 5]) // y0zh
    ];

    // map gps point to points that are on the road
    const { mappedGpsPoints } = mapGpsToRoad(
      roads,
      gpsPoints,
      mapGpsToRoadOptions
    );

    const graphResult = buildGraph(roads, mappedGpsPoints);

    // log.debug('graphResult', graphResult.path.map(hashToS));

    expect(graphResult.path.map(hashToS)).toEqual([
      'rcpz',
      'xczb',
      'xzbq',
      'y0zh'
    ]);

    const simpleGraphResult = buildGraph(roads, mappedGpsPoints, {
      includeAllGpsPoints: false
    });

    expect(simpleGraphResult.path.map(hashToS)).toEqual([
      'rcpz',
      'xczb',
      'y0zh'
    ]);
  });

  test('second path', () => {
    // get the road of the current point
    // get the road of the next point

    const gpsPoints = [
      createPointFeature([7, 0]), // rcpz
      // 10,0 xczb
      createPointFeature([7.5, 2.5]), // xzbq
      createPointFeature([5, 5]), // y0zh
      createPointFeature([0, 0]) // zzzz
    ];

    // map gps point to points that are on the road
    const { mappedGpsPoints } = mapGpsToRoad(
      roads,
      gpsPoints,
      mapGpsToRoadOptions
    );

    // log.debug('mappedGpsPoints', mappedGpsPoints);

    const graphResult = buildGraph(roads, mappedGpsPoints);

    // log.debug('graphResult', graphResult.path.map(hashToS));

    expect(graphResult.path.map(hashToS)).toEqual([
      'rcpz',
      'xczb',
      'xzbq',
      'y0zh',
      'zzzz'
    ]);

    const simpleGraphResult = buildGraph(roads, mappedGpsPoints, {
      includeAllGpsPoints: false
    });

    // log.debug('simpleGraphResult', simpleGraphResult.path.map(hashToS));

    expect(simpleGraphResult.path.map(hashToS)).toEqual([
      'rcpz',
      'xczb',
      'y0zh',
      'zzzz'
    ]);
  });

  test('third path', () => {
    // get the road of the current point
    // get the road of the next point

    const gpsPoints = [
      createPointFeature([7, 0]), // rcpz
      // 10,0 xczb
      createPointFeature([7.5, 2.5]), // xzbq
      createPointFeature([5, 5]), // y0zh
      createPointFeature([0, 0]), // zzzz
      createPointFeature([2, 0]) // xbrg
    ];

    // map gps point to points that are on the road
    const { mappedGpsPoints } = mapGpsToRoad(
      roads,
      gpsPoints,
      mapGpsToRoadOptions
    );

    // log.debug('mappedGpsPoints', mappedGpsPoints);

    const graphResult = buildGraph(roads, mappedGpsPoints);

    expect(graphResult.path.map(hashToS)).toEqual([
      'rcpz',
      'xczb',
      'xzbq',
      'y0zh',
      'zzzz',
      'xbrg'
    ]);

    const simpleGraphResult = buildGraph(roads, mappedGpsPoints, {
      includeAllGpsPoints: false
    });

    expect(simpleGraphResult.path.map(hashToS)).toEqual([
      'rcpz',
      'xczb',
      'y0zh',
      'zzzz',
      'xbrg'
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

    const { mappedGpsPoints } = mapGpsToRoad(
      multiRoad,
      gpsPoints,
      mapGpsToRoadOptions
    );

    const { path } = buildGraph(multiRoad, mappedGpsPoints);

    // log.debug('path', path);

    expect(path).toEqual(['kpgxczbzu', 'kpzpgxczb', 's0zh7w1z0']);

    const simpleGraph = buildGraph(multiRoad, mappedGpsPoints, {
      includeAllGpsPoints: false
    });

    expect(simpleGraph.path.map(hashToS)).toEqual(['zbzu', 'xczb', 'w1z0']);
  });

  test('meeting roads', () => {
    const meetingRoads = [
      createRoadFeature(
        [
          [10, 10], // s1z0g s3y0
          [5, 10], // s1g8c u2yh
          [0, 10] // eczbz uryp
        ],
        'road2',
        's1z0gs3y0.eczbzuryp'
      ),
      createRoadFeature(
        [
          [0, 0], // 7zzzz zzzz
          [0, 5], // ebzur ypzp
          [0, 10] // eczbz uryp
        ],
        'road1',
        '7zzzzzzzz.eczbzuryp'
      )
    ];

    const gpsPoints = [
      createPointFeature([0, 2]), // ebrgr upfz
      // 0,5 ypzp
      createPointFeature([0, 8]), // ecrvx brgr
      // 0,10 uryp
      createPointFeature([3, 10]), // s1f0u q0d3
      // 5,10 u2yh
      createPointFeature([6, 10]) // s1u2b t911
    ];

    const { mappedGpsPoints } = mapGpsToRoad(
      meetingRoads,
      gpsPoints,
      mapGpsToRoadOptions
    );

    // log.debug('mappedGpsPoints', mappedGpsPoints);

    // const graph = buildGraph(meetingRoads, mappedGpsPoints);

    // // log.debug('graph', graph.path.map(hashToS));

    // expect(graph.path.map(hashToS)).toEqual([
    //   'upfz',
    //   'brgr',
    //   'uryp',
    //   'q0d3',
    //   't911'
    // ]);

    const simpleGraph = buildGraph(meetingRoads, mappedGpsPoints, {
      includeAllGpsPoints: false
    });

    expect(simpleGraph.path.map(hashToS)).toEqual(['upfz', 'uryp', 't911']);

    const feature = graphToFeature(simpleGraph);

    // log.debug('feature', flatCoords(feature));

    // prettier-ignore
    expect(flatCoords(feature)).toEqual([
      0, 2, 
      0, 5, 
      0, 10, 
      5, 10, 
      6, 10
    ]);
  });
});
