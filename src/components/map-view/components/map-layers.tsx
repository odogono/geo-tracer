import React from 'react';

import { Layer, Source } from 'react-map-gl/maplibre';

import { useTheme } from '@contexts/theme/context';
import { useWorld } from '@contexts/world/use-world';
import { isLineStringFeature, isPointFeature } from '@helpers/geo';
import { createLog } from '@helpers/log';

const log = createLog('mapLayers');

// Define colors for different feature collections
const COLLECTION_COLORS = [
  '#FF5733', // Red-Orange
  '#33A1FF', // Blue
  '#33FF57', // Green
  '#FF33A1', // Pink
  '#A133FF', // Purple
  '#FFD700', // Gold
  '#00CED1', // Dark Turquoise
  '#FF6347', // Tomato
  '#7B68EE', // Medium Slate Blue
  '#20B2AA' // Light Sea Green
];

type MapLayersProps = {
  currentRoadPoints: GeoJSON.Position[] | null;
  mousePosition: GeoJSON.Position | null;
  selectedFeatureCollectionIndex: number;
};

export const MapLayers: React.FC<MapLayersProps> = ({
  currentRoadPoints,
  mousePosition,
  selectedFeatureCollectionIndex
}) => {
  const { theme } = useTheme();
  const { drawMode, featureCollections, selectedFeatures } = useWorld();

  // Create preview line for road drawing
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

  // Create a preview of the entire route being drawn
  const routePreviewLine =
    drawMode === 'route' &&
    currentRoadPoints &&
    currentRoadPoints.length > 0 &&
    mousePosition
      ? {
          geometry: {
            coordinates: [...currentRoadPoints, mousePosition],
            type: 'LineString' as const
          },
          properties: {
            type: 'route-preview'
          },
          type: 'Feature' as const
        }
      : null;

  return (
    <>
      {/* Render each feature collection with a different color */}
      {featureCollections.map((collection, index) => {
        log.debug(
          'rendering collection',
          collection.properties?.name,
          collection.properties
        );
        // Separate LineString and Point features for this collection
        const lineFeatures = collection.features.filter(
          feature => feature?.geometry?.type === 'LineString'
        );

        const pointFeatures = collection.features.filter(
          feature => feature?.geometry?.type === 'Point'
        );

        // Create feature collections for lines and points
        const lineFeatureCollection: GeoJSON.FeatureCollection = {
          features: lineFeatures,
          type: 'FeatureCollection'
        };

        const pointFeatureCollection: GeoJSON.FeatureCollection = {
          features: pointFeatures,
          type: 'FeatureCollection'
        };

        // Get color for this collection
        const collectionColor =
          collection.properties?.color ??
          COLLECTION_COLORS[index % COLLECTION_COLORS.length];

        log.debug(
          'collectionColor',
          collection.properties?.name,
          collectionColor
        );

        const collectionStrokeWidth = collection.properties?.strokeWidth ?? 3;

        return (
          <React.Fragment key={`collection-${index}`}>
            {/* Render LineString features */}
            <Source data={lineFeatureCollection} type="geojson">
              <Layer
                id={`roads-${index}`}
                paint={{
                  'line-color': [
                    'case',
                    ['get', 'selected'],
                    '#00ff00', // Selected color
                    collectionColor // Default color
                  ],
                  'line-width': [
                    'case',
                    ['get', 'selected'],
                    collectionStrokeWidth + 2, // Selected width
                    collectionStrokeWidth // Default width
                  ]
                }}
                type="line"
              />
            </Source>

            {/* Render Point features as markers */}
            <Source data={pointFeatureCollection} type="geojson">
              <Layer
                id={`points-${index}`}
                paint={{
                  'circle-color': theme === 'dark' ? '#ffffff' : '#000000',
                  'circle-radius': [
                    'case',
                    ['get', 'selected'],
                    8, // Selected radius
                    6 // Default radius
                  ],
                  'circle-stroke-color': [
                    'case',
                    ['get', 'selected'],
                    '#00ff00', // Selected color
                    collectionColor // Default color
                  ],
                  'circle-stroke-width': [
                    'case',
                    ['get', 'selected'],
                    3, // Selected stroke width
                    2 // Default stroke width
                  ]
                }}
                type="circle"
              />
            </Source>
          </React.Fragment>
        );
      })}

      {/* Render highlighted feature */}
      {selectedFeatures.length > 0 && (
        <Source
          data={{
            features: selectedFeatures,
            type: 'FeatureCollection'
          }}
          type="geojson"
        >
          {selectedFeatures.every(feature => isLineStringFeature(feature)) ? (
            <Layer
              id="highlighted-feature-line"
              layout={{
                'line-cap': 'round',
                'line-join': 'round'
              }}
              paint={{
                'line-color': '#00ff00',
                'line-width': 5
              }}
              type="line"
            />
          ) : selectedFeatures.every(feature => isPointFeature(feature)) ? (
            <Layer
              id="highlighted-feature-point"
              paint={{
                'circle-color': theme === 'dark' ? '#ffffff' : '#000000',
                'circle-radius': 8,
                'circle-stroke-color': '#ff0000',
                'circle-stroke-width': 5
              }}
              type="circle"
            />
          ) : null}
        </Source>
      )}

      {/* Render route preview line for route drawing */}
      {routePreviewLine && (
        <Source data={routePreviewLine} type="geojson">
          <Layer
            id="route-preview"
            paint={{
              'line-color':
                COLLECTION_COLORS[
                  selectedFeatureCollectionIndex % COLLECTION_COLORS.length
                ],
              'line-width': 3
            }}
            type="line"
          />
        </Source>
      )}

      {/* Render preview line for road drawing */}
      {previewLine && drawMode === 'road' && (
        <Source data={previewLine} type="geojson">
          <Layer
            id="preview"
            paint={{
              'line-color':
                COLLECTION_COLORS[
                  selectedFeatureCollectionIndex % COLLECTION_COLORS.length
                ],
              'line-dasharray': [2, 2],
              'line-width': 2
            }}
            type="line"
          />
        </Source>
      )}
    </>
  );
};
