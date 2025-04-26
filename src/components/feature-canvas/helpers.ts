export const CANVAS_MARGIN = 20; // pixels of margin around the rendered features

// Convert latitude to y coordinate using Mercator projection
export const latitudeToY = (lat: number): number => {
  const latRad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
};

// Convert longitude to x coordinate (simple linear scaling)
export const longitudeToX = (lon: number): number => (-lon * Math.PI) / 180;
