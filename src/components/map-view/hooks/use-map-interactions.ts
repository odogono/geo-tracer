import { useCallback, useState } from 'react';

import { bbox, lineString, simplify, length as turf_length } from '@turf/turf';
import { Feature, FeatureCollection } from 'geojson';

import { useWorld } from '@contexts/world/use-world';
import { getFeatureGeometryType, getLineStringCoordinates } from '@helpers/geo';
import { createLog } from '@helpers/log';
import {
  EdgeFeature,
  FeatureCollectionWithProps,
  RouteFeatureProperties
} from '@types';

const SNAP_DISTANCE_PX = 50;
const log = createLog('useMapInteractions');

export const useMapInteractions = (mapInstance: maplibregl.Map | null) => {
  const {
    drawMode,
    featureCollections,
    highlightedFeature,
    selectedFeatureCollectionIndex,
    setFeatureCollections,
    setHighlightedFeature,
    setSelectedFeatureCollectionIndex
  } = useWorld();

  const [currentRoadPoints, setCurrentRoadPoints] = useState<
    GeoJSON.Position[] | null
  >(null);
  const [mousePosition, setMousePosition] = useState<GeoJSON.Position | null>(
    null
  );
  const [hoveredFeature, setHoveredFeature] = useState<Feature | null>(null);
  const [layerIds, setLayerIds] = useState<string[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Function to fit the map to the bounds of all FeatureCollections
  const fitMapToFeatureCollections = useCallback(() => {
    if (!mapInstance || featureCollections.length === 0) {
      return;
    }

    try {
      // Create a combined feature collection for bounds calculation
      const combinedCollection: FeatureCollection = {
        features: featureCollections.flatMap(collection => collection.features),
        type: 'FeatureCollection'
      };

      // Calculate the bounding box of the combined FeatureCollection
      const bounds = bbox(combinedCollection);
      if (bounds[0] === Infinity) {
        return;
      }

      // Fit the map to the bounds with some padding
      mapInstance.fitBounds(
        [
          [bounds[0], bounds[1]], // Southwest corner
          [bounds[2], bounds[3]] // Northeast corner
        ],
        {
          duration: 1000,
          padding: 250
        }
      );
    } catch (error) {
      log.error('Error fitting map to bounds:', error);
    }
  }, [mapInstance, featureCollections]);

  const findNearestPoint = useCallback(
    (cursorPos: GeoJSON.Position): GeoJSON.Position | null => {
      if (!mapInstance || featureCollections.length === 0) {
        return null;
      }

      // Convert cursor position to screen coordinates
      const cursorScreen = mapInstance.project([cursorPos[0], cursorPos[1]]);

      // Check each point in all collections
      for (const collection of featureCollections) {
        for (const feature of collection.features) {
          const geometryType = getFeatureGeometryType(feature);
          if (geometryType !== 'LineString') {
            continue;
          }

          const coordinates = getLineStringCoordinates(feature);
          if (!coordinates || coordinates.length < 2) {
            continue;
          }

          // Check both start and end points of the LineString
          const startPoint = coordinates[0];
          const endPoint = coordinates.at(-1);

          if (!startPoint || !endPoint) {
            continue;
          }

          // Check start point
          const startScreen = mapInstance.project([
            startPoint[0],
            startPoint[1]
          ]);
          const startDx = cursorScreen.x - startScreen.x;
          const startDy = cursorScreen.y - startScreen.y;
          const startDistancePx = Math.sqrt(
            startDx * startDx + startDy * startDy
          );

          if (startDistancePx <= SNAP_DISTANCE_PX) {
            return startPoint;
          }

          // Check end point
          const endScreen = mapInstance.project([endPoint[0], endPoint[1]]);
          const endDx = cursorScreen.x - endScreen.x;
          const endDy = cursorScreen.y - endScreen.y;
          const endDistancePx = Math.sqrt(endDx * endDx + endDy * endDy);

          if (endDistancePx <= SNAP_DISTANCE_PX) {
            return endPoint;
          }
        }
      }

      return null;
    },
    [mapInstance, featureCollections]
  );

  const handleMouseDown = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (drawMode === 'route') {
        // Start drawing a route when mouse is pressed down
        const { lngLat } = e;
        const cursorPos: GeoJSON.Position = [lngLat.lng, lngLat.lat];

        // In route mode, we don't snap to existing points
        const newPoint = cursorPos;

        // Initialize the points array with the first point
        setCurrentRoadPoints([newPoint]);
        setIsDrawing(true);
      }
    },
    [drawMode]
  );

  const handleMapClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (drawMode === 'road') {
        const { lngLat } = e;
        // Use the snap point if available, otherwise use the mouse location
        const cursorPos: GeoJSON.Position = [lngLat.lng, lngLat.lat];
        const snapPoint = findNearestPoint(cursorPos);
        const newPoint = snapPoint || cursorPos;

        // If this is the first point, just add it
        if (!currentRoadPoints || currentRoadPoints.length === 0) {
          setCurrentRoadPoints([newPoint]);
          return;
        }

        // Create a new edge from the last point to the new point
        const lastPoint = currentRoadPoints.at(-1);
        if (!lastPoint) {
          return;
        }

        const line = lineString([lastPoint, newPoint]);
        const length = turf_length(line, { units: 'kilometers' });

        const newEdge: EdgeFeature = {
          geometry: {
            coordinates: [lastPoint, newPoint],
            type: 'LineString'
          },
          properties: {
            hash: `${lastPoint.join(',')}-${newPoint.join(',')}`,
            length,
            type: 'edge'
          },
          type: 'Feature'
        };

        // Add the new point to our points array
        setCurrentRoadPoints([...currentRoadPoints, newPoint]);

        log.debug('[handleMapClick] currentRoadPoints', currentRoadPoints);

        // Add the edge to the currently selected collection
        const currentCollection =
          featureCollections[selectedFeatureCollectionIndex];
        if (!currentCollection) {
          return;
        }

        // Create a new route feature
        const routeFeature: GeoJSON.Feature<
          GeoJSON.LineString,
          RouteFeatureProperties
        > = {
          geometry: newEdge.geometry,
          properties: {
            type: 'route'
          },
          type: 'Feature'
        };

        // Update the selected collection with the new feature
        const updatedCollection = {
          ...currentCollection,
          features: [...currentCollection.features, routeFeature]
        };

        // Update the feature collections array
        const newFeatureCollections = [...featureCollections];
        newFeatureCollections[selectedFeatureCollectionIndex] =
          updatedCollection;
        setFeatureCollections(
          newFeatureCollections as FeatureCollectionWithProps[]
        );

        log.debug(
          '[handleMapClick] newFeatureCollections',
          newFeatureCollections
        );
      } else if (drawMode === 'none') {
        // Handle feature selection when not in road drawing mode
        if (!mapInstance || layerIds.length === 0) {
          return;
        }

        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: layerIds
        });

        if (features && features.length > 0) {
          const feature = features[0];
          log.debug('Selected feature:', feature);
          setHighlightedFeature(feature);

          // Find which collection contains this feature and select it
          const collectionIndex = featureCollections.findIndex(collection =>
            collection.features.includes(feature)
          );

          if (collectionIndex !== -1) {
            log.debug('Setting selected collection index to:', collectionIndex);
            setSelectedFeatureCollectionIndex(collectionIndex);
          }
        } else {
          // If clicking on empty space, clear the highlight
          setHighlightedFeature(null);
        }
      }
    },
    [
      drawMode,
      currentRoadPoints,
      featureCollections,
      selectedFeatureCollectionIndex,
      setCurrentRoadPoints,
      setFeatureCollections,
      findNearestPoint,
      mapInstance,
      setHighlightedFeature,
      setSelectedFeatureCollectionIndex,
      layerIds
    ]
  );

  const handleMapRightClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (drawMode !== 'road' && drawMode !== 'route') {
        return;
      }

      // Cancel the current line by clearing points and current edge
      setCurrentRoadPoints([]);
      setMousePosition(null);
      setIsDrawing(false);
    },
    [drawMode, setCurrentRoadPoints]
  );

  const handleMouseMove = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (drawMode === 'road') {
        if (!currentRoadPoints || currentRoadPoints.length === 0) {
          return;
        }

        const { lngLat } = e;
        const cursorPos: GeoJSON.Position = [lngLat.lng, lngLat.lat];

        // Try to find a point to snap to
        const snapPoint = findNearestPoint(cursorPos);
        setMousePosition(snapPoint || cursorPos);
      } else if (drawMode === 'route') {
        const { lngLat } = e;
        const cursorPos: GeoJSON.Position = [lngLat.lng, lngLat.lat];

        // In route mode, we don't snap to existing points
        const newPoint = cursorPos;

        // Update the mouse position for preview
        setMousePosition(newPoint);

        // Add the point to the current road points if we're drawing
        if (isDrawing && currentRoadPoints && currentRoadPoints.length > 0) {
          // Only add a new point if it's significantly different from the last one
          const lastPoint = currentRoadPoints.at(-1);
          if (!lastPoint) {
            return;
          }

          const distance = Math.sqrt(
            Math.pow(newPoint[0] - lastPoint[0], 2) +
              Math.pow(newPoint[1] - lastPoint[1], 2)
          );

          // Add a point if it's at least 0.0001 degrees away from the last point
          // This prevents adding too many points when the mouse moves slowly
          if (distance > 0.000_01) {
            setCurrentRoadPoints([...currentRoadPoints, newPoint]);
          }
        }
      }
    },
    [drawMode, currentRoadPoints, findNearestPoint, isDrawing]
  );

  const handleMouseUp = useCallback(() => {
    if (
      drawMode === 'route' &&
      isDrawing &&
      currentRoadPoints &&
      currentRoadPoints.length > 1
    ) {
      // Create a LineString from the collected points
      const lineStringFeature = lineString(currentRoadPoints);

      // Simplify the LineString using turf
      const simplifiedLineString = simplify(lineStringFeature, {
        highQuality: true,
        tolerance: 0.000_01
      });

      log.debug(
        '[handleMouseUp] simplifiedLineString',
        lineStringFeature.geometry.coordinates.length,
        simplifiedLineString.geometry.coordinates.length
      );

      // Create a new route feature
      const routeFeature: GeoJSON.Feature<
        GeoJSON.LineString,
        RouteFeatureProperties
      > = {
        geometry: simplifiedLineString.geometry,
        properties: {
          type: 'route'
        },
        type: 'Feature'
      };

      // Add the route to the currently selected collection
      const currentCollection =
        featureCollections[selectedFeatureCollectionIndex];
      if (!currentCollection) {
        return;
      }

      // Update the selected collection with the new feature
      const updatedCollection = {
        ...currentCollection,
        features: [...currentCollection.features, routeFeature]
      };

      // Update the feature collections array
      const newFeatureCollections = [...featureCollections];
      newFeatureCollections[selectedFeatureCollectionIndex] = updatedCollection;
      setFeatureCollections(
        newFeatureCollections as FeatureCollectionWithProps[]
      );

      // Reset the drawing state
      setCurrentRoadPoints([]);
      setMousePosition(null);
      setIsDrawing(false);

      log.debug('[handleMouseUp] Added simplified route', routeFeature);
    }
  }, [
    drawMode,
    isDrawing,
    currentRoadPoints,
    featureCollections,
    selectedFeatureCollectionIndex,
    setFeatureCollections
  ]);

  // Function to handle feature hover
  const handleFeatureHover = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (!mapInstance || drawMode !== 'none' || layerIds.length === 0) {
        return;
      }

      // Check if we're hovering over any feature
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: layerIds
      });

      if (features.length > 0) {
        // We're hovering over a feature
        const feature = features[0];
        log.debug('Hovering over feature:', feature);
        setHoveredFeature(feature);
      } else {
        // Not hovering over any feature
        setHoveredFeature(null);
      }
    },
    [mapInstance, drawMode, layerIds]
  );

  // Update layer IDs when feature collections change
  const updateLayerIds = useCallback(() => {
    if (!mapInstance) {
      return;
    }

    // Get all existing layer IDs
    const existingLayerIds = featureCollections.map(
      (_, index) => `roads-${index}`
    );

    // Add highlighted feature layers if they exist
    if (mapInstance.getLayer('highlighted-feature-line')) {
      existingLayerIds.push('highlighted-feature-line');
    }
    if (mapInstance.getLayer('highlighted-feature-point')) {
      existingLayerIds.push('highlighted-feature-point');
    }

    // Add preview layer if it exists
    if (mapInstance.getLayer('preview')) {
      existingLayerIds.push('preview');
    }

    setLayerIds(existingLayerIds);
  }, [mapInstance, featureCollections]);

  return {
    currentRoadPoints,
    fitMapToFeatureCollections,
    handleFeatureHover,
    handleMapClick,
    handleMapRightClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    hoveredFeature,
    layerIds,
    mousePosition,
    updateLayerIds
  };
};
