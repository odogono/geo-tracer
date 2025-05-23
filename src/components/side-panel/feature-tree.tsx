import { useCallback, useMemo, useState } from 'react';

import { Feature, FeatureCollection } from 'geojson';
import {
  Box,
  Boxes,
  ChevronDown,
  ChevronRight,
  Library,
  Trash2
} from 'lucide-react';
import { NodeApi, Tree } from 'react-arborist';

import { useTheme } from '@contexts/theme/context';
import { useWorld } from '@contexts/world/use-world';
import { createLog } from '@helpers/log';
import { cn } from '@helpers/tailwind';

import { FeatureCollectionWithProps } from '../../types';

const log = createLog('featureTree');

// Define the node types for our tree
type TreeNode = {
  children?: TreeNode[];
  data: FeatureCollection | Feature;
  id: string;
  index: number;
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
  const {
    featureCollections,
    highlightedFeature,
    selectedFeatureCollectionIndex,
    setFeatureCollections,
    setHighlightedFeature,
    setSelectedFeatureCollectionIndex
  } = useWorld();
  const [isHovered, setIsHovered] = useState(false);

  // const data = node.data;

  const isFeatureCollection = node.data.type === 'collection';
  const isFeature = node.data.type === 'feature';

  const isSelected =
    isFeatureCollection && selectedFeatureCollectionIndex === node.data.index;

  // log.debug('data', data);
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

  const label = node.data.name;

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering the parent onClick

      if (!isFeature) {
        return;
      }

      // Find the collection that contains this feature
      const collectionIndex = featureCollections.findIndex(collection =>
        collection.features.includes(node.data.data as Feature)
      );

      if (collectionIndex === -1) {
        return;
      }

      // Create a new array of collections with the feature removed
      const newCollections = [...featureCollections];
      newCollections[collectionIndex] = {
        ...newCollections[collectionIndex],
        features: newCollections[collectionIndex].features.filter(
          feature => feature !== node.data.data
        )
      };

      // Update the collections
      setFeatureCollections(newCollections as FeatureCollectionWithProps[]);

      // If the deleted feature was highlighted, clear the highlight
      if (highlightedFeature === node.data.data) {
        setHighlightedFeature(null);
      }
    },
    [
      featureCollections,
      highlightedFeature,
      isFeature,
      node.data.data,
      setFeatureCollections,
      setHighlightedFeature
    ]
  );

  const handleDeleteCollection = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent triggering the parent onClick

      if (!isFeatureCollection) {
        return;
      }

      // Create a new array of collections with the features cleared
      const newCollections = [...featureCollections];
      newCollections[node.data.index] = {
        ...newCollections[node.data.index],
        features: []
      };

      // Update the collections
      setFeatureCollections(newCollections as FeatureCollectionWithProps[]);

      // If the deleted collection was selected, clear the selection
      if (selectedFeatureCollectionIndex === node.data.index) {
        setSelectedFeatureCollectionIndex(-1);
      }

      // If any highlighted feature was in this collection, clear the highlight
      if (
        highlightedFeature &&
        newCollections[node.data.index].features.includes(highlightedFeature)
      ) {
        setHighlightedFeature(null);
      }
    },
    [
      featureCollections,
      highlightedFeature,
      isFeatureCollection,
      node.data.index,
      selectedFeatureCollectionIndex,
      setFeatureCollections,
      setHighlightedFeature,
      setSelectedFeatureCollectionIndex
    ]
  );

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-500 group',
        isHighlighted && 'bg-blue-100 dark:bg-blue-900',
        isSelected && 'bg-green-100 dark:bg-green-900'
      )}
      onClick={() => {
        if (node.data.type === 'feature') {
          setHighlightedFeature(node.data.data as Feature);
        } else if (node.data.type === 'collection') {
          setSelectedFeatureCollectionIndex(node.data.index);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={dragHandle}
      style={style}
    >
      {isFeatureCollection && (
        <button
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          onClick={e => {
            e.stopPropagation();
            node.toggle();
          }}
          title={node.isOpen ? 'Collapse collection' : 'Expand collection'}
        >
          {node.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
      )}
      <span className="text-sm">{icon}</span>
      <span className="text-sm flex-grow">{label}</span>
      {isFeature && isHovered && (
        <button
          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          onClick={handleDelete}
          title="Delete feature"
        >
          <Trash2 size={16} />
        </button>
      )}
      {isFeatureCollection && isHovered && (
        <button
          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          onClick={handleDeleteCollection}
          title="Clear all features in collection"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
};

export const FeatureTree = () => {
  const { featureCollections } = useWorld();
  const { theme } = useTheme();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );

  // Convert feature collections to tree data
  const treeData = useMemo(
    () =>
      featureCollections.map((collection, index) =>
        featureCollectionToTreeNode(collection, index)
      ),
    [featureCollections]
  );

  // Initialize expanded state for all collection nodes
  useMemo(() => {
    const initialExpandedState: Record<string, boolean> = {};
    treeData.forEach(node => {
      initialExpandedState[node.id] = true; // Start with all collections expanded
    });
    setExpandedNodes(initialExpandedState);
  }, [treeData]);

  return (
    <div
      className={cn(
        'h-full overflow-auto',
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      )}
    >
      <Tree
        data={treeData}
        height={1024}
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

const getFeatureName = (feature: Feature, featureIndex: number) => {
  const id = feature?.id ? `(${feature.id})` : '';
  const name = feature?.properties?.name || `Feature ${featureIndex + 1}`;
  return `${id}${name} (${feature?.geometry?.type})`;
};

const featureCollectionToTreeNode = (
  collection: FeatureCollection,
  index: number
) => {
  const children = collection.features
    .map((feature, featureIndex) => {
      if (!feature) {
        return null;
      }

      return {
        data: feature as Feature,
        featureId: feature?.id ?? featureIndex,
        id: `feature-${index}-${featureIndex}`,
        index: featureIndex,
        name: getFeatureName(feature, featureIndex),
        type: 'feature'
      };
    })
    .filter(Boolean) as TreeNode[];

  children.sort((a, b) => {
    if (
      a.data.geometry.type === 'Point' &&
      b.data.geometry.type === 'LineString'
    ) {
      return -1;
    }

    return (a.featureId as number) - (b.featureId as number);
  });

  const collectionNode: TreeNode = {
    children: children as TreeNode[],
    data: collection,
    id: `collection-${index}`,
    index,
    name: `Collection ${index + 1}`,
    type: 'collection'
  };

  return collectionNode;
};
