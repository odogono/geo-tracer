import { useCallback, useState } from 'react';

import { Layer, Map, Source } from 'react-map-gl/maplibre';

import 'maplibre-gl/dist/maplibre-gl.css';

import { useTheme } from '@contexts/theme/context';
import { useWorld } from '@contexts/world/use-world';
import { lineString, length as turf_length } from '@turf/turf';
import { EdgeFeature, RouteFeatureProperties } from '@types';

const SNAP_DISTANCE_PX = 50;

export const MapView = () => {
  const { theme } = useTheme();
  const {
    currentEdge,
    currentRoadPoints,
    drawMode,
    roadCollection,
    setCurrentEdge,
    setCurrentRoadPoints,
    setRoadCollection
  } = useWorld();

  const [mousePosition, setMousePosition] = useState<GeoJSON.Position | null>(
    null
  );
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);

  const mapStyle =
    theme === 'dark'
      ? 'https://tiles.openfreemap.org/styles/positron'
      : 'https://tiles.openfreemap.org/styles/liberty';

  const handleMapClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (drawMode !== 'road') {
        return;
      }

      const { lngLat } = e;
      const newPoint: GeoJSON.Position = [lngLat.lng, lngLat.lat];

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

      // Update the current edge
      setCurrentEdge(newEdge);

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

      setRoadCollection({
        features: [...roadCollection.features, routeFeature],
        type: 'FeatureCollection'
      });
    },
    [
      drawMode,
      currentRoadPoints,
      roadCollection,
      setCurrentRoadPoints,
      setCurrentEdge,
      setRoadCollection
    ]
  );

  const handleMapRightClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (drawMode !== 'road') {
        return;
      }

      // Cancel the current line by clearing points and current edge
      setCurrentRoadPoints([]);
      setCurrentEdge(null);
      setMousePosition(null);
    },
    [drawMode, setCurrentRoadPoints, setCurrentEdge]
  );

  const findNearestPoint = useCallback(
    (cursorPos: GeoJSON.Position): GeoJSON.Position | null => {
      if (!mapInstance) {
        return null;
      }

      // Convert cursor position to screen coordinates
      const cursorScreen = mapInstance.project([cursorPos[0], cursorPos[1]]);

      // Check each point in the road collection
      for (const feature of roadCollection.features) {
        const coordinates = feature.geometry.coordinates;
        if (coordinates.length < 2) {
          continue;
        }

        // Check both start and end points of the LineString
        const startPoint = coordinates[0];
        const endPoint = coordinates.at(-1);

        if (!startPoint || !endPoint) {
          continue;
        }

        // Check start point
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
    [mapInstance, roadCollection]
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

  return (
    <div className="w-screen h-screen">
      <Map
        cursor={drawMode === 'none' ? 'grab' : 'crosshair'}
        initialViewState={{
          latitude: 0,
          longitude: 0,
          zoom: 14
        }}
        mapStyle={mapStyle}
        onClick={handleMapClick}
        onContextMenu={handleMapRightClick}
        onLoad={e => setMapInstance(e.target)}
        onMouseMove={handleMouseMove}
        style={{
          height: '100%',
          width: '100%'
        }}
      >
        <Source data={roadCollection} type="geojson">
          <Layer
            id="roads"
            paint={{
              'line-color': theme === 'dark' ? '#ffffff' : '#000000',
              'line-width': 3
            }}
            type="line"
          />
        </Source>
        {previewLine && (
          <Source data={previewLine} type="geojson">
            <Layer
              id="preview"
              paint={{
                'line-color': theme === 'dark' ? '#ffffff' : '#000000',
                'line-dasharray': [2, 2],
                'line-width': 2
              }}
              type="line"
            />
          </Source>
        )}
      </Map>
    </div>
  );
};
