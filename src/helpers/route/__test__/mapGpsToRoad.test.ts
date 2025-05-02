import { describe, expect, test } from 'vitest';

import { GpsPointFeature, MappedGpsPointFeature, RoadFeature } from '@types';

import { createLog } from '../../../helpers/log';
import { findPointOnNearestRoad, mapGpsToRoad } from '../mapGpsToRoad';
import { createPointFeature, createRoadFeature } from './helpers';

const log = createLog('mapGpsToRoad.test');

describe('mapGpsToRoad', () => {
  const mockRoads: RoadFeature[] = [
    createRoadFeature(
      [
        [0, 0],
        [1, 1]
      ],
      'road1',
      '7zzzzzzzz.s00twy01m'
    ),
    createRoadFeature(
      [
        [2, 2],
        [3, 3]
      ],
      'road2',
      's037ms06g.s0d1h60s3'
    )
  ];

  const mockGpsPoints: GpsPointFeature[] = [
    createPointFeature([0.001, 0.001]),
    createPointFeature([2.001, 2.001])
  ];

  test('should map GPS points to nearest roads', () => {
    const result = mapGpsToRoad(mockRoads, mockGpsPoints);

    expect(result.mappedGpsPoints).toHaveLength(2);

    // Check first mapped point
    const firstPoint = result.mappedGpsPoints[0] as MappedGpsPointFeature;
    expect(firstPoint.properties.roadHash).toBe('7zzzzzzzz.s00twy01m');

    // Check second mapped point
    const secondPoint = result.mappedGpsPoints[1] as MappedGpsPointFeature;
    expect(secondPoint.properties.roadHash).toBe('s037ms06g.s0d1h60s3');
  });

  test('should handle empty GPS points array', () => {
    const result = mapGpsToRoad(mockRoads, []);
    expect(result.mappedGpsPoints).toHaveLength(0);
  });

  test('should handle empty roads array', () => {
    const result = mapGpsToRoad([], mockGpsPoints);
    expect(result.mappedGpsPoints).toHaveLength(0);
  });

  test.only('multi-segment road', () => {
    const mockRoad: RoadFeature[] = [
      createRoadFeature(
        [
          [0, 0],
          [2.5, 0],
          [5, 0],
          [7.5, 0],
          [10, 0]
        ],
        'road1',
        '7zzzzzzzz.kpzpgxczb'
      ),
      createRoadFeature(
        [
          [10, 10],
          [7.5, 10],
          [5, 10],
          [2.5, 10],
          [0, 10]
        ],
        'road2',
        's1z0gs3y0.eczbzuryp'
      )
    ];

    for (const road of mockRoad) {
      log.debug('road', road.properties.hash);
    }

    const mapped = mapGpsToRoad(mockRoad, [createPointFeature([3, 5])], {
      maxDistance: 1000
    });

    log.debug('mapped', mapped);

    expect(mapped.mappedGpsPoints).toHaveLength(1);
    expect(mapped.mappedGpsPoints[0].properties.roadHash).toBe(
      's1z0gs3y0.eczbzuryp'
    );
    expect(mapped.mappedGpsPoints[0].properties.index).toBe(1);
  });
});

describe('findPointOnNearestRoad', () => {
  const mockRoads: RoadFeature[] = [
    createRoadFeature(
      [
        [0, 0],
        [1, 1]
      ],
      'road1',
      '7zzzzzzzz.s00twy01m'
    ),
    createRoadFeature(
      [
        [2, 2],
        [3, 3]
      ],
      'road2',
      's037ms06g.s0d1h60s3'
    )
  ];

  test('should find nearest point on road within max distance', () => {
    const point = [0.001, 0.001];
    const result = findPointOnNearestRoad(mockRoads, point);

    expect(result).toBeDefined();
    if (result) {
      expect(result.properties.roadHash).toBe('7zzzzzzzz.s00twy01m');
      expect(result.properties.dist).toBeLessThan(0.005);
      expect(result.properties.hash).toBeDefined();
      expect(result.properties.srcHash).toBeDefined();
      expect(result.properties.index).toBeDefined();
      expect(result.properties.location).toBeDefined();
      expect(result.properties.multiFeatureIndex).toBeDefined();

      // Verify the point has correct GeoJSON structure
      expect(result.type).toBe('Feature');
      expect(result.geometry.type).toBe('Point');
      expect(Array.isArray(result.geometry.coordinates)).toBe(true);
      expect(result.geometry.coordinates).toHaveLength(2);
    }
  });

  test('should return undefined when no road is within max distance', () => {
    const point = [10, 10];
    const result = findPointOnNearestRoad(mockRoads, point);
    expect(result).toBeUndefined();
  });

  test('should handle custom max distance', () => {
    const point = [0.5, 0.5];
    const result = findPointOnNearestRoad(mockRoads, point, {
      maxDistance: 0.1
    });
    expect(result).toBeDefined();
    if (result) {
      expect(result.properties.dist).toBeLessThan(0.1);
      expect(result.properties.roadHash).toBeDefined();
      expect(result.properties.hash).toBeDefined();
      expect(result.properties.srcHash).toBeDefined();
    }
  });

  test('should return undefined for empty roads array', () => {
    const point = [0.001, 0.001];
    const result = findPointOnNearestRoad([], point);
    expect(result).toBeUndefined();
  });
});
