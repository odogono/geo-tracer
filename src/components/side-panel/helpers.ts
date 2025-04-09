import { findContainingObjectInJson } from '@helpers/json';

export const findFeatureAtTextPosition = (
  text: string,
  findFeatureAtTextPosition: number
) => {
  const result = findContainingObjectInJson(text, findFeatureAtTextPosition);

  if (!result.ok) {
    return null;
  }

  const { value } = result;

  if (isFeature(value)) {
    return value;
  }

  for (const parent of result.parents) {
    if (isFeature(parent)) {
      return parent;
    }
  }

  return null;
};

const isFeature = (value: unknown): value is GeoJSON.Feature =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  value.type === 'Feature';
