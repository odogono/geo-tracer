import { BBox } from 'geojson';

export const CANVAS_MARGIN = 20; // pixels of margin around the rendered features

// Convert latitude to y coordinate using Mercator projection
export const latitudeToY = (lat: number): number => {
  const latRad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
};

// Convert longitude to x coordinate (simple linear scaling)
export const longitudeToX = (lon: number): number => (-lon * Math.PI) / 180;

export const bboxSum = (bboxes: (BBox | undefined)[]): BBox => {
  const minX = Math.min(...bboxes.map(bbox => bbox?.[0] ?? 0));
  const minY = Math.min(...bboxes.map(bbox => bbox?.[1] ?? 0));
  const maxX = Math.max(...bboxes.map(bbox => bbox?.[2] ?? 0));
  const maxY = Math.max(...bboxes.map(bbox => bbox?.[3] ?? 0));
  return [minX, minY, maxX, maxY];
};
