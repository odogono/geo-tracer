import { Node, ParseError, findNodeAtOffset, parseTree } from 'jsonc-parser';

import { createLog } from './log';

const log = createLog('json');

type ResultError = {
  error: string;
  ok: false;
  parents: undefined;
  value: undefined;
};

type ResultSuccess = {
  error: undefined;
  ok: true;
  parents: JSON[];
  value: JSON;
};

type Result = ResultError | ResultSuccess;

/**
 * Finds the nearest JSON object containing the given offset in a string.
 *
 * @param {string} jsonString The JSON string to search within.
 * @param {number} offset The character offset index.
 * @returns {string | null} The substring representing the nearest containing
 *   object, or null if not found or on error.
 */
export const findContainingObjectInJson = (
  jsonString: string,
  offset: number
): Result => {
  const errors: ParseError[] = [];
  const rootNode = parseTree(jsonString, errors);

  // Basic error handling for parsing and offset
  if (!rootNode || errors.length > 0) {
    return {
      error: 'Failed to parse JSON.',
      ok: false,
      parents: undefined,
      value: undefined
    };
  }
  if (offset < 0 || offset >= jsonString.length) {
    return {
      error: 'Offset is out of bounds.',
      ok: false,
      parents: undefined,
      value: undefined
    };
  }

  // Find the most specific node at the offset
  const node = findNodeAtOffset(rootNode, offset);
  if (!node) {
    return {
      error: 'Offset is out of bounds.',
      ok: false,
      parents: undefined,
      value: undefined
    };
  }

  // Find all nodes that contain the offset
  const containingNodes: Node[] = [];
  let current: Node | undefined = node;

  while (current) {
    if (
      (current.type === 'object' || current.type === 'array') &&
      current.offset <= offset &&
      current.offset + current.length >= offset
    ) {
      containingNodes.push(current);
    }
    current = current.parent;
  }

  // If we didn't find any containing nodes, return an error
  if (containingNodes.length === 0) {
    return {
      error: 'No containing object found.',
      ok: false,
      parents: undefined,
      value: undefined
    };
  }

  // Find the innermost object node
  let targetNode: Node | undefined;
  for (const node of containingNodes) {
    if (node.type === 'object') {
      targetNode = node;
      break;
    }
  }

  if (!targetNode) {
    return {
      error: 'No containing object found.',
      ok: false,
      parents: undefined,
      value: undefined
    };
  }

  // Collect parent nodes (objects and arrays)
  const parentNodes: Node[] = [];
  current = targetNode.parent;
  while (current) {
    if (current.type === 'object' || current.type === 'array') {
      parentNodes.push(current);
    }
    current = current.parent;
  }

  // Extract the substring for the final object node and its parents
  const value = JSON.parse(stringFromNode(targetNode, jsonString));
  const parents = parentNodes.map(node =>
    JSON.parse(stringFromNode(node, jsonString))
  );

  return {
    error: undefined,
    ok: true,
    parents,
    value
  };
};

const stringFromNode = (node: Node, jsonString: string) => {
  const start = node.offset;
  const end = start + node.length;
  return jsonString.slice(start, end);
};
