import { BBox, Geometry } from 'geojson';

import { CANVAS_MARGIN, latitudeToY, longitudeToX } from './helpers';
import { FeatureCollectionWithProperties } from './types';

type RenderFeatureCollectionProps = {
  bbox: BBox;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  featureCollection: FeatureCollectionWithProperties<Geometry>;
};

export const renderFeatureCollection = ({
  bbox,
  canvas,
  ctx,
  featureCollection
}: RenderFeatureCollectionProps) => {
  // Calculate bounds of all features
  const minX = longitudeToX(bbox[0]);
  const minY = latitudeToY(bbox[1]);
  const maxX = longitudeToX(bbox[2]);
  const maxY = latitudeToY(bbox[3]);

  const { color, showIndexes, strokeWidth = 2 } = featureCollection.properties;

  // Calculate scale to fit features within canvas while maintaining aspect ratio
  const dataWidth = maxX - minX;
  const dataHeight = maxY - minY;
  const availableWidth = canvas.width - 2 * CANVAS_MARGIN;
  const availableHeight = canvas.height - 2 * CANVAS_MARGIN;

  // Calculate scales and use the smaller one to maintain aspect ratio
  const scaleX = availableWidth / dataWidth;
  const scaleY = availableHeight / dataHeight;
  const scale = Math.min(scaleX, scaleY);

  // Calculate centering offsets
  const scaledWidth = dataWidth * scale;
  const scaledHeight = dataHeight * scale;
  const offsetX = (canvas.width - scaledWidth) / 2;
  const offsetY = (canvas.height - scaledHeight) / 2;

  // Set scale for high DPI displays
  const dpr = window.devicePixelRatio || 1;
  ctx.scale(dpr, dpr);

  // Draw each feature
  featureCollection.features.forEach(feature => {
    if (feature.geometry.type === 'Point') {
      const coords = feature.geometry.coordinates;
      const x = (longitudeToX(coords[0]) - minX) * scale + offsetX;
      const y = (latitudeToY(coords[1]) - minY) * scale + offsetY;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(x / dpr, y / dpr, 5, 0, 2 * Math.PI);
      ctx.stroke();
    }

    if (feature.geometry.type === 'LineString') {
      const coords = feature.geometry.coordinates;

      if (coords.length < 2) {
        return;
      }

      ctx.beginPath();
      // ctx.strokeStyle = feature.properties?.selected ? '#00ff00' : '#000000';
      ctx.strokeStyle = color;
      ctx.lineWidth = strokeWidth;

      // Move to first point
      const [startLon, startLat] = coords[0];
      const x1 = (longitudeToX(startLon) - minX) * scale + offsetX;
      const y1 = (latitudeToY(startLat) - minY) * scale + offsetY;
      ctx.moveTo(x1 / dpr, y1 / dpr);

      if (showIndexes) {
        ctx.font = '12px Arial';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('0', x1 / dpr, y1 / dpr - 10);
      }

      // Draw lines to subsequent points
      for (let i = 1; i < coords.length; i++) {
        const [lon, lat] = coords[i];
        const x2 = (longitudeToX(lon) - minX) * scale + offsetX;
        const y2 = (latitudeToY(lat) - minY) * scale + offsetY;
        ctx.lineTo(x2 / dpr, y2 / dpr);

        // Render index number if showIndexes is true
        if (showIndexes) {
          // ctx.font = '12px Arial';
          // ctx.fillStyle = color;
          // ctx.textAlign = 'center';
          // ctx.textBaseline = 'bottom';
          ctx.fillText(i.toString(), x2 / dpr, y2 / dpr - 10);
        }
      }

      ctx.stroke();
    }
  });
};
