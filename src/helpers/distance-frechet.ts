import { Feature, LineString, Position } from 'geojson';

import { FeatureCollectionWithProps } from '../types';

const distance = (p1: Position, p2: Position): number =>
  Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));

const frechetDistance = (line1: Position[], line2: Position[]): number => {
  const n = line1.length;
  const m = line2.length;
  const memo: number[][] = Array(n)
    .fill(null)
    .map(() => Array(m).fill(-1));

  const dfs = (i: number, j: number): number => {
    if (i === n - 1 && j === m - 1) {
      return distance(line1[i], line2[j]);
    }
    if (memo[i][j] !== -1) {
      return memo[i][j];
    }

    let result = Infinity;
    if (i < n - 1) {
      result = Math.min(
        result,
        Math.max(distance(line1[i], line2[j]), dfs(i + 1, j))
      );
    }
    if (j < m - 1) {
      result = Math.min(
        result,
        Math.max(distance(line1[i], line2[j]), dfs(i, j + 1))
      );
    }
    if (i < n - 1 && j < m - 1) {
      result = Math.min(
        result,
        Math.max(distance(line1[i], line2[j]), dfs(i + 1, j + 1))
      );
    }

    memo[i][j] = result;
    return result;
  };

  return dfs(0, 0);
};

export const calculateSimilarity = (
  line1: Feature<LineString>,
  line2: Feature<LineString>
): number => {
  const coordinates1 = line1.geometry.coordinates;
  const coordinates2 = line2.geometry.coordinates;

  if (coordinates1.length < 2 || coordinates2.length < 2) {
    return 0; // Not enough points to compare
  }

  const frechetDist = frechetDistance(coordinates1, coordinates2);

  // Calculate the diagonal of the bounding box of both lines combined
  const allPoints = [...coordinates1, ...coordinates2];
  const minX = Math.min(...allPoints.map(p => p[0]));
  const maxX = Math.max(...allPoints.map(p => p[0]));
  const minY = Math.min(...allPoints.map(p => p[1]));
  const maxY = Math.max(...allPoints.map(p => p[1]));
  const diagonal = Math.sqrt(
    Math.pow(maxX - minX, 2) + Math.pow(maxY - minY, 2)
  );

  // Normalize the Fréchet distance
  const normalizedDist = frechetDist / diagonal;

  // Convert to a similarity score (0 to 1, where 1 is most similar)
  const similarity = Math.max(0, 1 - normalizedDist);

  return similarity;
};

export const findMostSimilarLine = (
  line: Feature<LineString>,
  collection: FeatureCollectionWithProps
) => {
  const similarities = collection.features
    .map(feature => {
      if (feature.geometry.type !== 'LineString') {
        return null;
      }

      const similarity = calculateSimilarity(
        line,
        feature as Feature<LineString>
      );
      return {
        feature,
        similarity
      };
    })
    .filter(Boolean) as {
    feature: Feature<LineString>;
    similarity: number;
  }[];

  if (similarities.length === 0) {
    return null;
  }

  similarities.sort((a, b) => b.similarity - a.similarity);

  return similarities[0].feature;
};
