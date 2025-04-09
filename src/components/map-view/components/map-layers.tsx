import React from 'react';

import { Layer, Source } from 'react-map-gl/maplibre';

import { useTheme } from '@contexts/theme/context';
import { useWorld } from '@contexts/world/use-world';
import { isLineStringFeature, isPointFeature } from '@helpers/geo';

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
  const { featureCollections, highlightedFeature } = useWorld();

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

  return (
    <>
      {/* Render each feature collection with a different color */}
      {featureCollections.map((collection, index) => {
        // Separate LineString and Point features for this collection
        const lineFeatures = collection.features.filter(
          feature => feature.geometry.type === 'LineString'
        );

        const pointFeatures = collection.features.filter(
          feature => feature.geometry.type === 'Point'
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
          COLLECTION_COLORS[index % COLLECTION_COLORS.length];

        return (
          <React.Fragment key={`collection-${index}`}>
            {/* Render LineString features */}
            <Source data={lineFeatureCollection} type="geojson">
              <Layer
                id={`roads-${index}`}
                paint={{
                  'line-color': collectionColor,
                  'line-width': 3
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
                  'circle-radius': 6,
                  'circle-stroke-color': collectionColor,
                  'circle-stroke-width': 2
                }}
                type="circle"
              />
            </Source>
          </React.Fragment>
        );
      })}

      {/* Render highlighted feature */}
      {highlightedFeature && (
        <Source
          data={{
            features: [highlightedFeature],
            type: 'FeatureCollection'
          }}
          type="geojson"
        >
          {isLineStringFeature(highlightedFeature) ? (
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
          ) : isPointFeature(highlightedFeature) ? (
            <Layer
              id="highlighted-feature-point"
              paint={{
                'circle-color': theme === 'dark' ? '#ffffff' : '#000000',
                'circle-radius': 8,
                'circle-stroke-color': '#00ff00',
                'circle-stroke-width': 3
              }}
              type="circle"
            />
          ) : null}
        </Source>
      )}

      {/* Render preview line for road drawing */}
      {previewLine && (
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
