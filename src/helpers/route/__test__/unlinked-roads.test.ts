import { describe, expect, test } from 'vitest';

import { createLog } from '../../log';
import { buildGraph } from '../build-graph';
import { hashToS } from '../helpers';
import { mapGpsToRoad } from '../map-gps-to-road';
import { createPointFeature, createRoadFeature } from './helpers';

const log = createLog('buildGraph.test');

const mapGpsToRoadOptions = {
  hashPrecision: 9,
  maxDistance: 1000
};

describe('unlinked roads', () => {
  test('unlinked roads', () => {
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
          [10, 20],
          [20, 20]
        ],
        'road2',
        's5x1g8cu2.s7w1z0gs3'
      )
    ];
    // zzzz.xczb
    // 8cu2.z0gs3

    for (const road of roads) {
      log.debug('road', road.properties.hash);
    }

    const gpsPoints = [
      createPointFeature([2, 0]), // xbrg road1
      createPointFeature([8, 0]), // pcrv road1
      createPointFeature([10, 10]), // xczb
      createPointFeature([12, 20]), // 11d2 road2
      createPointFeature([18, 20]) // 95f6 road2
    ];

    const { mappedGpsPoints } = mapGpsToRoad(
      roads,
      gpsPoints,
      mapGpsToRoadOptions
    );

    // log.debug('mappedGpsPoints', mappedGpsPoints);

    const graph = buildGraph(roads, mappedGpsPoints, {
      includeAllGpsPoints: false
    });

    // log.debug('graph', graph.path); //.map(hashToS));

    expect(graph.path.map(hashToS)).toEqual([
      'xbrg',
      'pcrv',
      '-',
      '8cu2',
      '95f6'
    ]);

    // const fc = graphToFeature(graph);
    // // log.debug('feature', fc);

    // expect(flatCoords(fc?.features[0])).toEqual([2, 0, 8, 0]);
    // expect(flatCoords(fc?.features[1])).toEqual([12, 20, 18, 20]);
  });

  test('unlinked roads - single point', () => {
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
          [5, 10],
          [5, 20]
        ],
        'road2'
        // 'u2yh.bbuk'
      )
    ];

    // zzzz.xczb
    // w1z0.n5x1

    const gpsPoints = [
      createPointFeature([2, 0]), // xbrg
      createPointFeature([5, 0]), // zbzu
      // createPointFeature([5, 10]), // u2yh
      createPointFeature([5, 12]) // b8ch
      // createPointFeature([5, 15]) // f8vk
    ];

    const { mappedGpsPoints } = mapGpsToRoad(
      roads,
      gpsPoints,
      mapGpsToRoadOptions
    );

    // log.debug('mappedGpsPoints', mappedGpsPoints);

    const graph = buildGraph(roads, mappedGpsPoints, {
      includeAllGpsPoints: false
    });

    // log.debug('graph', graph.path.map(hashToS));

    expect(graph.path.map(hashToS)).toEqual([
      'xbrg',
      'zbzu',
      '-',
      'u2yh',
      'b8ch'
    ]);

    // const fc = graphToFeature(graph);
    // log.debug('feature', fc);
  });
});
