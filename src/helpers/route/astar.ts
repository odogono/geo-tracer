import { createPointHash } from '../hash';

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
  if (from.id === to.id) {
    return graph;
  }

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

export const generateMermaidDiagram = (
  graph: Graph,
  path: GraphNode[] = []
): string => {
  let diagram = 'graph TD\n';

  // Add nodes
  for (const node of graph.nodes) {
    const nodeLabel = node.isGps ? 'GPS' : 'Road';
    const nodeStyle = node.isGps
      ? 'style GPS fill:#f9f,stroke:#333,stroke-width:2px'
      : 'style Road fill:#bbf,stroke:#333,stroke-width:2px';
    diagram += `    ${node.id}["${nodeLabel} (${node.point[0].toFixed(2)}, ${node.point[1].toFixed(2)})"]\n`;
    diagram += `    ${nodeStyle}\n`;
  }

  // Add edges
  for (const edge of graph.edges) {
    const isPathEdge = path.some(
      (node, i) =>
        (node.id === edge.from.id && path[i + 1]?.id === edge.to.id) ||
        (node.id === edge.to.id && path[i + 1]?.id === edge.from.id)
    );

    const edgeStyle = isPathEdge
      ? 'stroke:#f00,stroke-width:2px'
      : 'stroke:#333,stroke-width:1px';
    diagram += `    ${edge.from.id} -->|${edge.weight.toFixed(2)}| ${edge.to.id}\n`;
    diagram += `    linkStyle ${graph.edges.indexOf(edge)} ${edgeStyle}\n`;
  }

  return diagram;
};

export const generateSvgDiagram = (
  graph: Graph,
  path: GraphNode[] = [],
  options: {
    height?: number;
    nodeRadius?: number;
    padding?: number;
    width?: number;
  } = {}
): string => {
  const { height = 600, nodeRadius = 5, padding = 50, width = 800 } = options;

  // Find bounds of the graph
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of graph.nodes) {
    minX = Math.min(minX, node.point[0]);
    minY = Math.min(minY, node.point[1]);
    maxX = Math.max(maxX, node.point[0]);
    maxY = Math.max(maxY, node.point[1]);
  }

  // Handle cases where all points have the same coordinate
  const xRange = maxX - minX || 1; // Use 1 if range is 0
  const yRange = maxY - minY || 1; // Use 1 if range is 0

  // Create scale functions to map coordinates to SVG space
  const scaleX = (x: number) =>
    ((x - minX) / xRange) * (width - 2 * padding) + padding;
  const scaleY = (y: number) =>
    height - (((y - minY) / yRange) * (height - 2 * padding) + padding); // Flip Y axis to match SVG coordinates

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">\n`;

  // Add a white background
  svg += `  <rect width="100%" height="100%" fill="white"/>\n`;

  // Draw edges
  for (const edge of graph.edges) {
    const isPathEdge = path.some(
      (node, i) =>
        (node.id === edge.from.id && path[i + 1]?.id === edge.to.id) ||
        (node.id === edge.to.id && path[i + 1]?.id === edge.from.id)
    );

    const x1 = scaleX(edge.from.point[0]);
    const y1 = scaleY(edge.from.point[1]);
    const x2 = scaleX(edge.to.point[0]);
    const y2 = scaleY(edge.to.point[1]);

    svg += `  <line 
    x1="${x1}" 
    y1="${y1}" 
    x2="${x2}" 
    y2="${y2}" 
    stroke="${isPathEdge ? '#ff0000' : '#333333'}"
    stroke-width="${isPathEdge ? 2 : 1}"
  />\n`;

    // Add weight label
    const labelX = (x1 + x2) / 2;
    const labelY = (y1 + y2) / 2 - 5;
    svg += `  <text 
    x="${labelX}" 
    y="${labelY}" 
    text-anchor="middle" 
    font-size="10"
  >${edge.weight.toFixed(2)}</text>\n`;
  }

  // Draw nodes
  for (const node of graph.nodes) {
    const x = scaleX(node.point[0]);
    const y = scaleY(node.point[1]);
    const color = node.isGps ? '#ff99ff' : '#bbbbff';

    svg += `  <circle 
    cx="${x}" 
    cy="${y}" 
    r="${nodeRadius}"
    fill="${color}"
    stroke="#333333"
    stroke-width="1"
  />\n`;

    // Add coordinate label
    svg += `  <text 
    x="${x}" 
    y="${y - nodeRadius - 5}"
    text-anchor="middle"
    font-size="10"
  >(${node.point[0].toFixed(2)}, ${node.point[1].toFixed(2)})</text>\n`;
  }

  svg += '</svg>';
  return svg;
};
