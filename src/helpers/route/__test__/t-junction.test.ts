import { FeatureCollection, GeoJsonProperties, LineString } from 'geojson';
import { describe, expect, test } from 'vitest';

import { threeRoadJunction } from '../../../components/feature-canvas/data';
import { RoadFeature } from '../../../types';
import { createLog } from '../../log';
import { buildGraph } from '../build-graph';
import { graphToFeature } from '../graph-to-feature';
import { flatCoords, hashToS } from '../helpers';
import { mapGpsLineStringToRoad, mapGpsToRoad } from '../map-gps-to-road';
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
        [0, 0], // 7zzzz zzzz
        [0, 5], // ebzur ypzp
        [0, 10] // eczbz uryp
      ],
      'road3'
      // 7zzzzzzzz.eczbzuryp
    ),
    createRoadFeature(
      [
        [0, 0],
        [-5, 0], // 7zurypzpg
        [-10, 0] // 7zbzurypz
      ],
      'road1'
      // 7zzzzzzzz.7zbzurypz
    ),
    createRoadFeature(
      [
        [10, 0], // kpzpg xczb
        [0, 0] // 7zzzzzzzz
      ],
      'road2'
      // kpzpgxczb.7zzzzzzzz
    )
  ];

  test('south to east', () => {
    const gpsPoints = [
      createPointFeature([0, 8]), // brgr
      createPointFeature([-2, 0]), // rzxu
      createPointFeature([5, 0]) // zbzu
    ];

    const { mappedGpsPoints } = mapGpsToRoad(
      roads,
      gpsPoints,
      mapGpsToRoadOptions
    );

    // log.debug('mappedGpsPoints', mappedGpsPoints);

    const simpleGraph = buildGraph(roads, mappedGpsPoints, {
      includeAllGpsPoints: false
    });

    log.debug('simpleGraph', simpleGraph.path.map(hashToS));

    expect(simpleGraph.path.map(hashToS)).toEqual([
      'brgr',
      'zzzz',
      'zzzz',
      'zbzu'
    ]);

    // const fc = graphToFeature(simpleGraph);
    // log.debug('fc', flatCoords(fc));

    // expect(flatCoords(fc)).toEqual([0, 8, 0, 5, 0, 0, 5, 0]);
  });
  test('south to centre', () => {
    const gpsPoints = [
      createPointFeature([0, 4]), // bpvx
      createPointFeature([1, 0]) // zbpv
    ];

    const { mappedGpsPoints } = mapGpsToRoad(
      roads,
      gpsPoints,
      mapGpsToRoadOptions
    );

    // log.debug('mappedGpsPoints', mappedGpsPoints);

    const simpleGraph = buildGraph(roads, mappedGpsPoints, {
      includeAllGpsPoints: false
    });

    // log.debug('simpleGraph', simpleGraph.path.map(hashToS));

    expect(simpleGraph.path.map(hashToS)).toEqual(['bpvx', 'zzzz', 'zbpv']);

    const fc = graphToFeature(simpleGraph);
    // log.debug('fc', flatCoords(fc));

    expect(flatCoords(fc)).toEqual([0, 4, 0, 0, 1, 0]);
  });

  test('scenario 4', () => {
    // yzsy.yzhn // east to centre
    // yzhn.yygz // centre to west
    // yzhn.yz40 // centre to south

    const roads = threeRoadJunction.features as RoadFeature[];

    const gpsWalkSouthToNorth: FeatureCollection<
      LineString,
      GeoJsonProperties
    > = {
      features: [
        {
          geometry: {
            coordinates: [
              [-3.648_553_595_384_937_5, 50.794_546_750_713_955], // yz5w - centre to south
              [-3.648_564_405_397_922_3, 50.794_633_412_962_405] // yzhn - centre to west
            ],
            type: 'LineString'
          },
          properties: {},
          type: 'Feature'
        }
      ],
      type: 'FeatureCollection'
    };

    const { mappedGpsPoints } = mapGpsLineStringToRoad(
      roads,
      gpsWalkSouthToNorth,
      { ...mapGpsToRoadOptions, hashPrecision: 10 }
    );

    // log.debug('mappedGpsPoints', mappedGpsPoints);

    const graphResult = buildGraph(roads, mappedGpsPoints, {
      includeAllGpsPoints: false
    });

    log.debug('graphResult', graphResult.path.map(hashToS));

    // NOTE hash precision must be 10, otherwise the 2nd point is rounded to the centre
    expect(graphResult.path.map(hashToS)).toEqual(['z5wv', 'yzhn', 'zhn7']);

    // const feature = graphToFeature(graphResult);
    // log.debug('feature', hashCoords(feature));
  });
});
