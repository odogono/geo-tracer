import { describe, expect, test } from 'vitest';

import { GpsPointFeature, MappedGpsPointFeature, RoadFeature } from '@types';

import { findPointOnNearestRoad, mapGpsToRoad } from '../mapGpsToRoad';

describe('mapGpsToRoad', () => {
  const mockRoads: RoadFeature[] = [
    {
      geometry: {
        coordinates: [
          [0, 0],
          [1, 1]
        ],
        type: 'LineString'
      },
      properties: {
        hash: 'road1'
      },
      type: 'Feature'
    },
    {
      geometry: {
        coordinates: [
          [2, 2],
          [3, 3]
        ],
        type: 'LineString'
      },
      properties: {
        hash: 'road2'
      },
      type: 'Feature'
    }
  ];

  const mockGpsPoints: GpsPointFeature[] = [
    {
      geometry: {
        coordinates: [0.001, 0.001],
        type: 'Point'
      },
      properties: {
        hash: 'gps1'
      },
      type: 'Feature'
    },
    {
      geometry: {
        coordinates: [2.001, 2.001],
        type: 'Point'
      },
      properties: {
        hash: 'gps2'
      },
      type: 'Feature'
    }
  ];

  test('should map GPS points to nearest roads', () => {
    const result = mapGpsToRoad(mockRoads, mockGpsPoints);

    expect(result.mappedGpsPoints).toHaveLength(2);

    // Check first mapped point
    const firstPoint = result.mappedGpsPoints[0] as MappedGpsPointFeature;
    expect(firstPoint.properties.roadHash).toBe('road1');
    expect(firstPoint.properties.dist).toBeLessThan(0.005);
    expect(firstPoint.properties.hash).toBeDefined();
    expect(firstPoint.properties.srcHash).toBeDefined();
    expect(firstPoint.properties.index).toBeDefined();
    expect(firstPoint.properties.location).toBeDefined();
    expect(firstPoint.properties.multiFeatureIndex).toBeDefined();

    // Check second mapped point
    const secondPoint = result.mappedGpsPoints[1] as MappedGpsPointFeature;
    expect(secondPoint.properties.roadHash).toBe('road2');
    expect(secondPoint.properties.dist).toBeLessThan(0.005);
    expect(secondPoint.properties.hash).toBeDefined();
    expect(secondPoint.properties.srcHash).toBeDefined();
    expect(secondPoint.properties.index).toBeDefined();
    expect(secondPoint.properties.location).toBeDefined();
    expect(secondPoint.properties.multiFeatureIndex).toBeDefined();
  });

  test('should handle empty GPS points array', () => {
    const result = mapGpsToRoad(mockRoads, []);
    expect(result.mappedGpsPoints).toHaveLength(0);
  });

  test('should handle empty roads array', () => {
    const result = mapGpsToRoad([], mockGpsPoints);
    expect(result.mappedGpsPoints).toHaveLength(0);
  });
});

describe('findPointOnNearestRoad', () => {
  const mockRoads: RoadFeature[] = [
    {
      geometry: {
        coordinates: [
          [0, 0],
          [1, 1]
        ],
        type: 'LineString'
      },
      properties: {
        hash: 'road1'
      },
      type: 'Feature'
    },
    {
      geometry: {
        coordinates: [
          [2, 2],
          [3, 3]
        ],
        type: 'LineString'
      },
      properties: {
        hash: 'road2'
      },
      type: 'Feature'
    }
  ];

  test('should find nearest point on road within max distance', () => {
    const point = [0.001, 0.001];
    const result = findPointOnNearestRoad(mockRoads, point);

    expect(result).toBeDefined();
    if (result) {
      expect(result.properties.roadHash).toBe('road1');
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
