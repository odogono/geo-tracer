import { useCallback } from 'react';

import { Layer, Map, Source } from 'react-map-gl/maplibre';

import 'maplibre-gl/dist/maplibre-gl.css';

import { useTheme } from '@contexts/theme/context';
import { useWorld } from '@contexts/world/use-world';
import { lineString, length as turf_length } from '@turf/turf';
import { EdgeFeature, RouteFeatureProperties } from '@types';

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
      if (currentRoadPoints.length === 0) {
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
    },
    [drawMode, setCurrentRoadPoints, setCurrentEdge]
  );

  const cursor = drawMode === 'none' ? 'grab' : 'crosshair';

  return (
    <div className="w-screen h-screen">
      <Map
        cursor={cursor}
        initialViewState={{
          latitude: 0,
          longitude: 0,
          zoom: 14
        }}
        mapStyle={mapStyle}
        onClick={handleMapClick}
        onContextMenu={handleMapRightClick}
        style={{
          cursor: 'crosshair',
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
      </Map>
    </div>
  );
};
