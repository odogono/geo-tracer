import { FeatureCollection } from 'geojson';

import { CANVAS_MARGIN, latitudeToY, longitudeToX } from './helpers';

type RenderFeatureCollectionProps = {
  canvas: HTMLCanvasElement;
  featureCollection: FeatureCollection;
};

export const renderFeatureCollection = ({
  canvas,
  featureCollection
}: RenderFeatureCollectionProps) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return;
  }

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Calculate bounds of all features
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // First pass: calculate bounds in projected coordinates
  featureCollection.features.forEach(feature => {
    if (feature.geometry.type === 'LineString') {
      feature.geometry.coordinates.forEach(([lon, lat]) => {
        const x = longitudeToX(lon);
        const y = latitudeToY(lat);
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      });
    }
  });

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
    if (feature.geometry.type === 'LineString') {
      const coords = feature.geometry.coordinates;

      ctx.beginPath();
      // ctx.strokeStyle = feature.properties?.selected ? '#00ff00' : '#000000';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;

      // Move to first point
      const [startLon, startLat] = coords[0];
      const x1 = (longitudeToX(startLon) - minX) * scale + offsetX;
      const y1 = (latitudeToY(startLat) - minY) * scale + offsetY;
      ctx.moveTo(x1 / dpr, y1 / dpr);

      // Draw lines to subsequent points
      for (let i = 1; i < coords.length; i++) {
        const [lon, lat] = coords[i];
        const x2 = (longitudeToX(lon) - minX) * scale + offsetX;
        const y2 = (latitudeToY(lat) - minY) * scale + offsetY;
        ctx.lineTo(x2 / dpr, y2 / dpr);
      }

      ctx.stroke();
    }
  });
};
