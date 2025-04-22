import { useCallback } from 'react';

import Rbush from '@turf/geojson-rbush';
import { simplify } from '@turf/turf';
import { Feature, LineString } from 'geojson';
import { useSetAtom } from 'jotai';

import { findPointOnNearestFeature } from '@helpers/geo';
import { createLog } from '@helpers/log';
import { FeatureCollectionWithProps } from '@types';

import { setFeatureCollectionAtIndexAtom } from '../atoms';
import type { UseModelResult } from './use-model';

const log = createLog('useActions');

export type UseActionsResult = ReturnType<typeof useActions>;

type UseActionsProps = UseModelResult;

export const useActions = ({ featureCollections }: UseActionsProps) => {
  const setFeatureCollectionAtIndex = useSetAtom(
    setFeatureCollectionAtIndexAtom
  );

  const calculateRoute = useCallback(() => {
    log.debug('calculateRoute');

    const rtree = Rbush();

    const routeCollection = featureCollections[0];
    const roadCollection = featureCollections[1];

    rtree.load(roadCollection);

    const computedCollection: FeatureCollectionWithProps = {
      features: [],
      properties: {
        name: 'computed'
      },
      type: 'FeatureCollection'
    };

    if (!routeCollection) {
      log.error('No feature collection selected');
      return;
    }

    for (const feature of routeCollection.features) {
      if (feature.geometry.type !== 'LineString') {
        continue;
      }

      const simplifiedLineString = simplify(feature, {
        highQuality: true,
        tolerance: 0.000_01
      }) as Feature<LineString>;

      const intersectingRoads = rtree.search(simplifiedLineString);

      // log.debug('rtree.search', intersectingRoads);
      const coordinates = simplifiedLineString.geometry.coordinates;

      // for (let ii = 0; ii < coordinates.length - 1; ii++) {
      //   const a = coordinates[ii];
      //   const b = coordinates[ii + 1];

      //   const line = lineString([a, b]);

      //   const mostSimilarLine = findMostSimilarLine(line, roadCollection);

      //   if (!mostSimilarLine) {
      //     continue;
      //   }

      //   const pointA = findPointOnLineString(a, mostSimilarLine);

      //   if (pointA) {
      //     computedCollection.features.push(pointA);
      //   }

      //   const pointB = findPointOnLineString(b, mostSimilarLine);

      //   if (pointB) {
      //     computedCollection.features.push(pointB);
      //   }

      //   // break;
      // }

      // iterate over the coordinates of the feature
      // determine the point on the closest road to the coordinate
      // add the point to the computedCollection
      for (const coordinate of simplifiedLineString.geometry.coordinates) {
        const points = findPointOnNearestFeature(coordinate, roadCollection);

        if (points.length > 0) {
          // log.debug(
          //   'found nearest position',
          //   nearestDistance * 1000,
          //   nearestResult
          // );
          computedCollection.features.push(...points);
          // break;
        }
      }
    }

    setFeatureCollectionAtIndex(2, computedCollection);
  }, [featureCollections, setFeatureCollectionAtIndex]);

  return {
    calculateRoute
  };
};

const createMarkerFeature = (position: GeoJSON.Position): Feature => ({
  geometry: {
    coordinates: position,
    type: 'Point'
  },
  properties: {
    type: 'marker'
  },
  type: 'Feature'
});
