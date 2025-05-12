import { useCallback } from 'react';

import Rbush from '@turf/geojson-rbush';
import { simplify } from '@turf/turf';
import { Feature, LineString } from 'geojson';
import { useSetAtom } from 'jotai';

import { buildGraph } from '@/helpers/route/build-graph';
import { graphToFeature } from '@/helpers/route/graph-to-feature';
import { mapGpsLineStringToRoad } from '@/helpers/route/map-gps-to-road';
import { createLog } from '@helpers/log';
import { FeatureCollectionWithProps, RoadFeature } from '@types';

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

    // remove reversed features
    const filteredRoadCollection = {
      ...roadCollection,
      features: roadCollection.features.filter(
        f => f.properties?.reversed ?? false
      )
    };

    // rtree.load(roadCollection);

    // const f77 = roadCollection.features.find(f => f.id == 77);
    // const f78 = roadCollection.features.find(f => f.id == 78);

    // log.debug('f77', f77);
    // log.debug('f78', f78);

    // const computedCollection: FeatureCollectionWithProps = {
    //   features: [],
    //   properties: {
    //     name: 'computed'
    //   },
    //   type: 'FeatureCollection'
    // };

    if (!routeCollection) {
      log.error('No feature collection selected');
      return;
    }

    const simplifiedGpsCollection = {
      ...routeCollection,
      features: routeCollection.features.map(f =>
        simplify(f, {
          highQuality: true,
          tolerance: 0.000_01
        })
      ) as Feature<LineString>[]
    };

    const roads = filteredRoadCollection.features as RoadFeature[];

    const { mappedGpsPoints } = mapGpsLineStringToRoad(
      roads,
      simplifiedGpsCollection
    );

    const graphResult = buildGraph(roads, mappedGpsPoints);

    const computedCollection = graphToFeature(graphResult) as
      | FeatureCollectionWithProps
      | undefined;

    if (!computedCollection) {
      log.error('No route feature found');
      return;
    }

    computedCollection.properties = {
      ...computedCollection.properties,
      color: '#fff',
      name: 'computed',
      strokeWidth: 10
    };

    // const computedCollection: FeatureCollectionWithProps = {
    //   features: [feature],
    //   properties: {
    //     color: '#fff',
    //     name: 'computed',
    //     strokeWidth: 10
    //   },
    //   type: 'FeatureCollection'
    // };

    // log.debug('feature', hashCoords(feature));

    // const nearestFeatures: NearestFeatureResult[] = [];
    // for (const feature of routeCollection.features) {
    //   if (feature.geometry.type !== 'LineString') {
    //     continue;
    //   }

    //   const simplifiedLineString = simplify(feature, {
    //     highQuality: true,
    //     tolerance: 0.000_01
    //   }) as Feature<LineString>;

    // }

    //   // iterate over the coordinates of the feature
    //   // determine the point on the closest road to the coordinate
    //   // add the point to the computedCollection
    //   for (const coordinate of simplifiedLineString.geometry.coordinates) {
    //     const points = findPointOnNearestFeature(
    //       coordinate,
    //       filteredRoadCollection
    //     );
    //     nearestFeatures.push(...points);

    //     if (points.length > 0) {
    //       // log.debug(
    //       //   'found nearest position',
    //       //   nearestDistance * 1000,
    //       //   nearestResult
    //       // );
    //       for (const [feature, point] of points) {
    //         computedCollection.features.push(point);
    //         // log.debug('[calculateRoute] feature', feature);
    //         // log.debug('[calculateRoute] point', point);
    //       }
    //       // break;
    //     }
    //   }
    // }

    // // const startPoint = nearestFeatures.at(0);
    // // const endPoint = nearestFeatures.at(-1);
    // // log.debug('[calculateRoute] startPoint', startPoint);
    // // log.debug('[calculateRoute] endPoint', endPoint);

    // // computedCollection.features.push(startPoint?.[1]);
    // // computedCollection.features.push(endPoint?.[1]);

    // const routeGraph = buildRouteGraph(nearestFeatures);

    // for (const point of routeGraph) {
    //   // computedCollection.features.push(point);
    // }

    // for (const [feature, point] of nearestFeatures) {
    //   // computedCollection.features.push(point);
    //   // log.debug('[calculateRoute] feature', feature);
    //   log.debug('[calculateRoute] point', point, feature.id);
    // }

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
