import React, { useEffect, useRef, useState } from 'react';

import { Map as LibreMap } from 'react-map-gl/maplibre';

import 'maplibre-gl/dist/maplibre-gl.css';

import { useMapEffects } from '@/components/map-view/hooks/use-map-effects';
import { useMapInteractions } from '@/components/map-view/hooks/use-map-interactions';
import { useTheme } from '@contexts/theme/context';
import { useWorld } from '@contexts/world/use-world';
import { createLog } from '@helpers/log';

import { MapLayers } from './components/map-layers';
import { SelectionMarquee } from './components/selection-marquee';

const log = createLog('MapView');

export const MapView = () => {
  const { theme } = useTheme();
  const { drawMode, selectedFeatureCollectionIndex, setDrawMode } = useWorld();
  const [mapInstance, setMapInstance] = useState<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add keyboard event handler
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if 'A' is pressed and no input elements are focused
      if (
        e.key.toLowerCase() === 'a' &&
        document.activeElement?.tagName !== 'INPUT'
      ) {
        setDrawMode('select');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [setDrawMode]);

  const mapStyle =
    theme === 'dark'
      ? 'https://tiles.openfreemap.org/styles/positron'
      : 'https://tiles.openfreemap.org/styles/liberty';

  // Use the map interactions hook
  const {
    currentRoadPoints,
    fitMapToFeatureCollection,
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
  } = useMapInteractions(mapInstance);

  // Use the map effects hook
  useMapEffects(mapInstance, fitMapToFeatureCollection, updateLayerIds);

  const handleSelectionComplete = (bounds: {
    end: [number, number];
    start: [number, number];
  }) => {
    // TODO: Handle the selection bounds here
    log.debug('Selection complete', bounds);
    setDrawMode('none');
  };

  // Determine cursor style based on hover state and draw mode
  const cursorStyle =
    drawMode === 'none'
      ? hoveredFeature
        ? (() => {
            const featureType = hoveredFeature.properties?.type;
            switch (featureType) {
              case 'route':
                return 'pointer';
              case 'edge':
                return 'move';
              case 'marker':
                return 'move';
              case 'preview':
              case 'route-preview':
                return 'crosshair';
              default:
                return 'pointer';
            }
          })()
        : 'grab'
      : drawMode === 'select'
        ? 'crosshair'
        : 'crosshair';

  return (
    <div className="w-screen h-screen" ref={containerRef}>
      <LibreMap
        cursor={cursorStyle}
        dragPan={drawMode === 'none'}
        initialViewState={{
          latitude: 0,
          longitude: 0,
          zoom: 14
        }}
        mapStyle={mapStyle}
        onClick={handleMapClick}
        onContextMenu={handleMapRightClick}
        onLoad={e => setMapInstance(e.target)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          height: '100%',
          width: '100%'
        }}
      >
        <MapLayers
          currentRoadPoints={currentRoadPoints}
          mousePosition={mousePosition}
          selectedFeatureCollectionIndex={selectedFeatureCollectionIndex}
        />
      </LibreMap>
      <SelectionMarquee
        active={drawMode === 'select'}
        mapContainer={containerRef.current}
        onSelectionComplete={handleSelectionComplete}
      />
    </div>
  );
};
