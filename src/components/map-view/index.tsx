import { useCallback, useEffect, useState } from 'react';

import { Layer, Map as LibreMap, Source } from 'react-map-gl/maplibre';

import 'maplibre-gl/dist/maplibre-gl.css';

import { Feature, FeatureCollection } from 'geojson';

import { useTheme } from '@contexts/theme/context';
import { useWorld } from '@contexts/world/use-world';
import { createLog } from '@helpers/log';
import { bbox, lineString, length as turf_length } from '@turf/turf';
import { EdgeFeature, RouteFeatureProperties } from '@types';

import {
  getFeatureGeometryType,
  getLineStringCoordinates,
  isLineStringFeature,
  isPointFeature
} from '../../helpers/geo';

const SNAP_DISTANCE_PX = 50;
const log = createLog('MapView');

export const MapView = () => {
  const { theme } = useTheme();
  const {
    drawMode,
    featureCollection,
    highlightedFeature,

    setFeatureCollection,
    setHighlightedFeature
  } = useWorld();

  // const [currentEdge, setCurrentEdge] = useState<EdgeFeature | null>(null);
  const [currentRoadPoints, setCurrentRoadPoints] = useState<
    GeoJSON.Position[] | null
  >(null);

  const [mousePosition, setMousePosition] = useState<GeoJSON.Position | null>(
    null
  );
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const [hoveredFeature, setHoveredFeature] = useState<Feature | null>(null);

  const mapStyle =
    theme === 'dark'
      ? 'https://tiles.openfreemap.org/styles/positron'
      : 'https://tiles.openfreemap.org/styles/liberty';

  // Function to fit the map to the bounds of the FeatureCollection
  const fitMapToFeatureCollection = useCallback(() => {
    if (!mapInstance || !featureCollection) {
      return;
    }

    try {
      // Calculate the bounding box of the FeatureCollection
      const bounds = bbox(featureCollection);

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
  }, [mapInstance, featureCollection]);

  // Fit map to bounds when roadCollection changes
  useEffect(() => {
    if (drawMode === 'none') {
      fitMapToFeatureCollection();
    }
  }, [fitMapToFeatureCollection, drawMode]);

  // Fit map to bounds when map instance is loaded
  useEffect(() => {
    if (
      mapInstance &&
      featureCollection &&
      featureCollection.features.length > 0
    ) {
      fitMapToFeatureCollection();
    }
  }, [mapInstance, fitMapToFeatureCollection, featureCollection]);

  const findNearestPoint = useCallback(
    (cursorPos: GeoJSON.Position): GeoJSON.Position | null => {
      if (!mapInstance || !featureCollection) {
        return null;
      }

      // Convert cursor position to screen coordinates
      const cursorScreen = mapInstance.project([cursorPos[0], cursorPos[1]]);

      // Check each point in the road collection
      for (const feature of featureCollection.features) {
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
        // log.debug('startPoint', coordinates, feature.geometry.type);
        const startScreen = mapInstance.project([startPoint[0], startPoint[1]]);
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

      return null;
    },
    [mapInstance, featureCollection]
  );

  const handleMapClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (drawMode !== 'road') {
        return;
      }

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

      // Update the current edge
      // setCurrentEdge(newEdge);

      // Add the edge to our collection as a route feature
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

      const existingFeatures = featureCollection?.features || [];
      const newFeatureCollection: FeatureCollection = {
        ...featureCollection,
        features: [...existingFeatures, routeFeature],
        type: 'FeatureCollection'
      };

      setFeatureCollection(newFeatureCollection);

      log.debug('[handleMapClick] newFeatureCollection', newFeatureCollection);
    },
    [
      drawMode,
      currentRoadPoints,
      featureCollection,
      setCurrentRoadPoints,

      setFeatureCollection,
      findNearestPoint
    ]
  );

  const handleMapRightClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (drawMode !== 'road') {
        return;
      }

      // Cancel the current line by clearing points and current edge
      setCurrentRoadPoints([]);
      // setCurrentEdge(null);
      setMousePosition(null);
    },
    [drawMode, setCurrentRoadPoints]
  );

  const handleMouseMove = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (
        drawMode !== 'road' ||
        !currentRoadPoints ||
        currentRoadPoints.length === 0
      ) {
        return;
      }

      const { lngLat } = e;
      const cursorPos: GeoJSON.Position = [lngLat.lng, lngLat.lat];

      // Try to find a point to snap to
      const snapPoint = findNearestPoint(cursorPos);
      setMousePosition(snapPoint || cursorPos);
    },
    [drawMode, currentRoadPoints, findNearestPoint]
  );

  // Function to handle feature hover
  const handleFeatureHover = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (!mapInstance || drawMode !== 'none') {
        return;
      }

      const { lngLat } = e;
      const cursorPos: GeoJSON.Position = [lngLat.lng, lngLat.lat];

      // Check if we're hovering over any feature
      const features = mapInstance.queryRenderedFeatures(e.point, {
        layers: ['roads', 'points']
      });

      if (features.length > 0) {
        // We're hovering over a feature
        const feature = features[0];

        log.debug('feature hover', feature);

        // Convert the feature to an EdgeFeature
        // const edgeFeature: EdgeFeature = {
        //   geometry: feature.geometry as GeoJSON.LineString,
        //   properties: {
        //     hash: feature.properties?.hash || '',
        //     length: feature.properties?.length || 0,
        //     type: 'edge'
        //   },
        //   type: 'Feature'
        // };

        setHoveredFeature(feature);
        setHighlightedFeature(feature);
      } else {
        // Not hovering over any feature
        setHoveredFeature(null);
        setHighlightedFeature(null);
      }
    },
    [mapInstance, drawMode, setHighlightedFeature]
  );

  const previewLine =
    currentRoadPoints && currentRoadPoints.length > 0 && mousePosition
      ? {
          geometry: {
            coordinates: [
              currentRoadPoints.at(-1) as GeoJSON.Position,
              mousePosition
            ],
            type: 'LineString' as const
          },
          properties: {
            type: 'preview'
          },
          type: 'Feature' as const
        }
      : null;

  // Separate LineString and Point features
  const lineFeatures =
    featureCollection?.features.filter(
      feature => getFeatureGeometryType(feature) === 'LineString'
    ) || [];

  const pointFeatures =
    featureCollection?.features.filter(
      feature => getFeatureGeometryType(feature) === 'Point'
    ) || [];

  // Create separate feature collections for lines and points
  const lineFeatureCollection: GeoJSON.FeatureCollection = {
    features: lineFeatures,
    type: 'FeatureCollection'
  };

  const pointFeatureCollection: GeoJSON.FeatureCollection = {
    features: pointFeatures,
    type: 'FeatureCollection'
  };

  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    // Add the highlighted feature layer
    mapInstance.addSource('highlighted-feature', {
      data: highlightedFeature
        ? {
            features: [highlightedFeature],
            type: 'FeatureCollection'
          }
        : {
            features: [],
            type: 'FeatureCollection'
          },
      type: 'geojson'
    });

    if (isLineStringFeature(highlightedFeature)) {
      mapInstance.addLayer({
        id: 'highlighted-feature',
        layout: {
          'line-cap': 'round',
          'line-join': 'round'
        },
        paint: {
          'line-color': '#00ff00',
          'line-width': 5
        },
        source: 'highlighted-feature',
        type: 'line'
      });
    } else if (isPointFeature(highlightedFeature)) {
      mapInstance.addLayer({
        id: 'highlighted-feature',
        paint: {
          'circle-color': theme === 'dark' ? '#ffffff' : '#000000',
          'circle-radius': 6,
          'circle-stroke-color': '#0F0',
          'circle-stroke-width': 2
        },
        source: 'highlighted-feature',
        type: 'circle'
      });
    }

    return () => {
      if (mapInstance.getLayer('highlighted-feature')) {
        mapInstance.removeLayer('highlighted-feature');
      }
      if (mapInstance.getSource('highlighted-feature')) {
        mapInstance.removeSource('highlighted-feature');
      }
    };
  }, [mapInstance, highlightedFeature, theme]);

  // Update the highlighted feature source when it changes
  useEffect(() => {
    if (!mapInstance || !mapInstance.getSource('highlighted-feature')) {
      return;
    }

    const source = mapInstance.getSource(
      'highlighted-feature'
    ) as maplibregl.GeoJSONSource;
    source.setData(
      highlightedFeature
        ? {
            features: [highlightedFeature],
            type: 'FeatureCollection'
          }
        : {
            features: [],
            type: 'FeatureCollection'
          }
    );
  }, [mapInstance, highlightedFeature]);

  // Determine cursor style based on hover state
  const cursorStyle =
    drawMode === 'none' ? (hoveredFeature ? 'pointer' : 'grab') : 'crosshair';

  return (
    <div className="w-screen h-screen">
      <LibreMap
        cursor={cursorStyle}
        initialViewState={{
          latitude: 0,
          longitude: 0,
          zoom: 14
        }}
        mapStyle={mapStyle}
        onClick={handleMapClick}
        onContextMenu={handleMapRightClick}
        onLoad={e => setMapInstance(e.target)}
        onMouseMove={drawMode === 'road' ? handleMouseMove : handleFeatureHover}
        style={{
          height: '100%',
          width: '100%'
        }}
      >
        {/* Render LineString features */}
        <Source data={lineFeatureCollection} type="geojson">
          <Layer
            id="roads"
            paint={{
              'line-color': theme === 'dark' ? '#666' : '#000000',
              'line-width': 3
            }}
            type="line"
          />
        </Source>

        {/* Render Point features as markers */}
        <Source data={pointFeatureCollection} type="geojson">
          <Layer
            id="points"
            paint={{
              'circle-color': theme === 'dark' ? '#ffffff' : '#000000',
              'circle-radius': 6,
              'circle-stroke-color': theme === 'dark' ? '#000000' : '#ffffff',
              'circle-stroke-width': 2
            }}
            type="circle"
          />
        </Source>

        {previewLine && (
          <Source data={previewLine} type="geojson">
            <Layer
              id="preview"
              paint={{
                'line-color': theme === 'dark' ? '#666' : '#000000',
                'line-dasharray': [2, 2],
                'line-width': 2
              }}
              type="line"
            />
          </Source>
        )}
      </LibreMap>
    </div>
  );
};
