import { describe, expect, it } from 'vitest';

import { findContainingObjectInJson } from '../json';

describe('helpers/json', () => {
  describe('findContainingObject', () => {
    const jsonA = `[ { "id": 1 }, { "id": 2, "child": { "id": 2.1 } }, { "id": 3 } ]`;
    it('should return the nearest containing object', () => {
      const result = findContainingObjectInJson(jsonA, 44);

      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ id: 2.1 });
      expect(result.parents).toEqual([
        { child: { id: 2.1 }, id: 2 },
        [{ id: 1 }, { child: { id: 2.1 }, id: 2 }, { id: 3 }]
      ]);
    });

    it('should return the nearest containing object', () => {
      const result = findContainingObjectInJson(jsonA, 9);

      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ id: 1 });
      expect(result.parents).toEqual([
        [{ id: 1 }, { child: { id: 2.1 }, id: 2 }, { id: 3 }]
      ]);
    });

    const jsonB = `{  "features": [  { "type": "Feature", "properties": { "id": 3 } },  { "type": "Feature", "properties": { "id": 10 } }   ]   }`;

    it('should return id 10', () => {
      const result = findContainingObjectInJson(jsonB, 112);

      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ id: 10 });
      expect(result.parents).toEqual([
        {
          properties: {
            id: 10
          },
          type: 'Feature'
        },
        [
          {
            properties: {
              id: 3
            },
            type: 'Feature'
          },
          {
            properties: {
              id: 10
            },
            type: 'Feature'
          }
        ],
        {
          features: [
            {
              properties: {
                id: 3
              },
              type: 'Feature'
            },
            {
              properties: {
                id: 10
              },
              type: 'Feature'
            }
          ]
        }
      ]);
    });

    it('should return properties id 10', () => {
      const result = findContainingObjectInJson(jsonB, 90);

      expect(result.ok).toBe(true);
      expect(result.value).toEqual({
        properties: {
          id: 10
        },
        type: 'Feature'
      });
      expect(result.parents).toEqual([
        [
          {
            properties: {
              id: 3
            },
            type: 'Feature'
          },
          {
            properties: {
              id: 10
            },
            type: 'Feature'
          }
        ],
        {
          features: [
            {
              properties: {
                id: 3
              },
              type: 'Feature'
            },
            {
              properties: {
                id: 10
              },
              type: 'Feature'
            }
          ]
        }
      ]);
    });
  });
});
