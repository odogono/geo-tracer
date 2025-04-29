import { createPointHash } from './hash';

export type GraphNode = {
  id: string;
  isGps: boolean;
  point: GeoJSON.Position;
};

export type GraphEdge = {
  from: GraphNode;
  id: string; // hash of the original line segment
  to: GraphNode;
  weight: number;
};

export type GraphNodeMap = Map<string, GraphNode>;

export type Graph = {
  edges: GraphEdge[];
  nodeMap: GraphNodeMap;
  nodes: GraphNode[];
};

export const createGraph = (): Graph => ({
  edges: [],
  nodeMap: new Map<string, GraphNode>(),
  nodes: []
});

export const createGraphNode = (
  graph: Graph,
  point: GeoJSON.Position,
  isGps: boolean = false
): GraphNode => {
  const id = createPointHash(point);

  const node = graph.nodeMap.get(id);

  if (!node) {
    const newNode: GraphNode = {
      id,
      isGps,
      point
    };
    graph.nodeMap.set(id, newNode);
    graph.nodes.push(newNode);
    return newNode;
  }

  if (isGps && !node.isGps) {
    node.isGps = true;
  }

  return node;
};

export const addGraphEdge = (
  graph: Graph,
  from: GraphNode,
  to: GraphNode,
  weight: number
) => {
  const exists = graph.edges.find(
    edge => edge.from.id === from.id && edge.to.id === to.id
  );

  if (exists) {
    return graph;
  }

  graph.edges.push({
    from,
    id: `${from.id}.${to.id}`,
    to,
    weight
  });

  return graph;
};

const distancePointToPoint = (
  a: GeoJSON.Position,
  b: GeoJSON.Position
): number => {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  return Math.sqrt(dx * dx + dy * dy);
};

const heuristicCost = (node: GraphNode, end: GraphNode) =>
  distancePointToPoint(node.point, end.point);

const reconstructPath = (
  cameFrom: Map<GraphNode, GraphNode>,
  current: GraphNode
) => {
  const path: GraphNode[] = [current];
  while (cameFrom.has(current)) {
    current = cameFrom.get(current)!;
    path.push(current);
  }
  return path.reverse();
};

export const graphSearch = (graph: Graph, start: GraphNode, end: GraphNode) => {
  // cost from start to node
  const gScore = new Map<GraphNode, number>();

  // estimated cost from start to end via node
  const fScore = new Map<GraphNode, number>();

  // nodes to be evaluated
  const openSet = new Set<GraphNode>([start]);

  // nodes already evaluated
  const closedSet = new Set<GraphNode>();

  // node we came from
  const cameFrom = new Map<GraphNode, GraphNode>();

  // initialise scores
  for (const node of graph.nodes) {
    gScore.set(node, Infinity);
    fScore.set(node, Infinity);
  }

  // start node
  gScore.set(start, 0);
  fScore.set(start, heuristicCost(start, end));

  while (openSet.size > 0) {
    // get node with lowest fScore
    let current: GraphNode | undefined = undefined;
    let lowestFScore = Infinity;

    for (const node of openSet) {
      const score = fScore.get(node) || Infinity;
      if (score < lowestFScore) {
        lowestFScore = score;
        current = node;
      }
    }

    if (!current) {
      break;
    }

    // we have found the end
    if (current === end) {
      return reconstructPath(cameFrom, current);
    }

    openSet.delete(current);
    closedSet.add(current);

    // find all edges from current node
    const edges = graph.edges.filter(
      edge => edge.from === current || edge.to === current
    );

    for (const edge of edges) {
      // get the neighbour node
      const neighbour = edge.from === current ? edge.to : edge.from;

      // skip if we have already evaluated this node
      if (closedSet.has(neighbour)) {
        continue;
      }

      // calculate tentative gScore
      const tentativeGScore = (gScore.get(current) || 0) + edge.weight;

      if (!openSet.has(neighbour)) {
        openSet.add(neighbour);
      } else if (tentativeGScore >= (gScore.get(neighbour) || Infinity)) {
        continue;
      }

      // this path is better
      cameFrom.set(neighbour, current);
      gScore.set(neighbour, tentativeGScore);
      fScore.set(neighbour, tentativeGScore + heuristicCost(neighbour, end));
    }
  }

  // no path found
  return [];
};
