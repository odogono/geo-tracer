import { useMemo } from 'react';

import { Feature, FeatureCollection } from 'geojson';
import { Box, Boxes, Library } from 'lucide-react';
import { NodeApi, Tree } from 'react-arborist';

import { useTheme } from '@contexts/theme/context';
import { useWorld } from '@contexts/world/use-world';
import { createLog } from '@helpers/log';
import { cn } from '@helpers/tailwind';

const log = createLog('featureTree');

// Define the node types for our tree
type TreeNode = {
  children?: TreeNode[];
  data: FeatureCollection | Feature;
  id: string;
  name: string;
  type: 'collection' | 'feature';
};

type NodeProps = {
  dragHandle?: (el: HTMLDivElement | null) => void;
  node: NodeApi<TreeNode>;
  style: React.CSSProperties;
};

// Node component for rendering each tree item
const TreeNodeComponent = ({ dragHandle, node, style }: NodeProps) => {
  const { highlightedFeature, setHighlightedFeature } = useWorld();

  const data = node.data;

  const isFeatureCollection = node.data.type === 'collection';
  const isFeature = node.data.type === 'feature';

  log.debug('data', data);
  const isHighlighted =
    node.data.type === 'feature' &&
    highlightedFeature &&
    node.data.data === highlightedFeature;

  let icon = <Boxes />;
  if (isFeatureCollection) {
    icon = <Library />;
  } else if (isFeature) {
    icon = <Box />;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-500',
        isHighlighted && 'bg-blue-100 dark:bg-blue-900'
      )}
      onClick={() => {
        if (node.data.type === 'feature') {
          setHighlightedFeature(node.data.data as Feature);
        }
      }}
      ref={dragHandle}
      style={style}
    >
      <span className="text-sm">{icon}</span>
      <span className="text-sm">{node.data.name}</span>
    </div>
  );
};

export const FeatureTree = () => {
  const { featureCollections } = useWorld();
  const { theme } = useTheme();

  // Convert feature collections to tree data
  const treeData = useMemo(
    () =>
      featureCollections.map((collection, index) => {
        const collectionNode: TreeNode = {
          children: collection.features.map((feature, featureIndex) => ({
            data: feature,
            id: `feature-${index}-${featureIndex}`,
            name: `Feature ${featureIndex + 1} (${feature.geometry.type})`,
            type: 'feature'
          })),
          data: collection,
          id: `collection-${index}`,
          name: `Collection ${index + 1}`,
          type: 'collection'
        };
        return collectionNode;
      }),
    [featureCollections]
  );

  return (
    <div
      className={cn(
        'h-full overflow-auto',
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      )}
    >
      <Tree
        data={treeData}
        height={400}
        indent={24}
        openByDefault={true}
        rowHeight={32}
        width="100%"
      >
        {TreeNodeComponent}
      </Tree>
    </div>
  );
};
