import { useCallback } from 'react';

import Rbush from '@turf/geojson-rbush';
import { Feature, FeatureCollection } from 'geojson';
import { useSetAtom } from 'jotai';

import { findPointOnNearestFeature } from '@helpers/geo';
import { createLog } from '@helpers/log';

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

    const computedCollection: FeatureCollection = {
      features: [],
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

      const intersectingRoads = rtree.search(feature);

      log.debug('rtree.search', intersectingRoads);

      // iterate over the coordinates of the feature
      // determine the point on the closest road to the coordinate
      // add the point to the computedCollection
      for (const coordinate of feature.geometry.coordinates) {
        const {
          distance: nearestDistance,
          position: nearestPosition,
          result: nearestResult
        } = findPointOnNearestFeature(coordinate, roadCollection);

        if (nearestPosition && nearestResult) {
          log.debug(
            'found nearest position',
            nearestDistance * 1000,
            nearestResult
          );
          computedCollection.features.push(
            nearestResult
            // createMarkerFeature(nearestPosition)
          );
        }

        // const intersectingRoad = intersectingRoads.features.find(road => {
        //   if (road.geometry.type !== 'LineString') {
        //     return false;
        //   }

        //   // Find the nearest point on this road to the coordinate
        //   const nearestPoint = findNearestPointOnLine(
        //     coordinate,
        //     road.geometry
        //   );

        //   // Calculate the distance between the coordinate and the nearest point
        //   // If the distance is small enough, consider this road as the closest one
        //   const distance = Math.sqrt(
        //     Math.pow(coordinate[0] - nearestPoint[0], 2) +
        //       Math.pow(coordinate[1] - nearestPoint[1], 2)
        //   );

        //   // log the distance in metres
        //   log.debug('distance', distance * 1000);

        //   // Add the nearest point to the computed collection
        //   computedCollection.features.push(createMarkerFeature(nearestPoint));

        //   // Return true if this is the closest road (you can adjust the threshold)
        //   return distance < 0.001;
        // });
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
