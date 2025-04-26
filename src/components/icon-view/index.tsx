import { useCallback } from 'react';

import {
  Copy,
  DraftingCompass,
  PenLine,
  Route,
  SquareDashed
} from 'lucide-react';

import { useTheme } from '@contexts/theme/context';
import { useWorld } from '@contexts/world/use-world';
import { cn } from '@helpers/tailwind';
import { DrawMode } from '@types';

const iconY = (offset: number) => offset * 48 + 96 + 'px';

export const IconView = () => {
  const { theme } = useTheme();
  const { calculateRoute, drawMode, selectedFeatures, setDrawMode } =
    useWorld();

  const handleSetDrawMode = useCallback(
    (mode: DrawMode) => {
      if (mode === drawMode) {
        setDrawMode('none');
      } else {
        setDrawMode(mode);
      }
    },
    [drawMode, setDrawMode]
  );

  const handleCopyToClipboard = useCallback(() => {
    if (selectedFeatures.length === 0) {
      return;
    }

    const featureCollection = {
      features: selectedFeatures,
      type: 'FeatureCollection'
    };

    navigator.clipboard
      .writeText(JSON.stringify(featureCollection, null, 2))
      .catch(error => console.error('Failed to copy to clipboard:', error));
  }, [selectedFeatures]);

  return (
    <div className="absolute top-0 left-0">
      <button
        aria-label={`Select Mode`}
        className={cn(
          `fixed left-4 p-2 rounded-full`,
          'bg-gray-500 dark:bg-opacity-20 dark:backdrop-blur-sm',
          'hover:bg-gray-700 dark:hover:bg-opacity-30',
          'transition-colors',
          {
            'bg-orange-500 dark:bg-opacity-30': drawMode === 'select',
            'hover:bg-opacity-30': drawMode === 'select'
          }
        )}
        onClick={() => handleSetDrawMode('select')}
        style={{ top: iconY(0) }}
      >
        <SquareDashed />
      </button>
      <button
        aria-label={`Select Route`}
        className={cn(
          `fixed left-4 p-2 rounded-full`,
          'bg-gray-500 dark:bg-opacity-20 dark:backdrop-blur-sm',
          'hover:bg-gray-700 dark:hover:bg-opacity-30',
          'transition-colors',
          {
            'bg-orange-500 dark:bg-opacity-30': drawMode === 'route',
            'hover:bg-opacity-30': drawMode === 'route'
          }
        )}
        onClick={() => handleSetDrawMode('route')}
        style={{ top: iconY(1) }}
      >
        <PenLine />
      </button>
      <button
        aria-label={`Draw Roads`}
        className={cn(
          `fixed left-4 p-2 rounded-full`,
          'bg-gray-500 dark:bg-opacity-20 dark:backdrop-blur-sm',
          'hover:bg-gray-700 dark:hover:bg-opacity-30',
          'transition-colors',
          {
            'bg-orange-500 dark:bg-opacity-30': drawMode === 'road',
            'hover:bg-opacity-30': drawMode === 'road'
          }
        )}
        onClick={() => handleSetDrawMode('road')}
        style={{ top: iconY(2) }}
      >
        <Route />
      </button>
      <button
        aria-label={`Calculate`}
        className={cn(
          `fixed left-4 p-2 rounded-full`,
          'bg-gray-500 dark:bg-opacity-20 dark:backdrop-blur-sm',
          'hover:bg-gray-700 dark:hover:bg-opacity-30',
          'active:bg-orange-500 dark:active:bg-opacity-30',
          'transition-colors'
        )}
        onClick={() => calculateRoute()}
        style={{ top: iconY(3) }}
      >
        <DraftingCompass />
      </button>
      <button
        aria-label={`Copy Selected Features`}
        className={cn(
          `fixed left-4 p-2 rounded-full`,
          'bg-gray-500 dark:bg-opacity-20 dark:backdrop-blur-sm',
          'hover:bg-gray-700 dark:hover:bg-opacity-30',
          'transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          selectedFeatures.length > 0 && 'bg-blue-500 dark:bg-opacity-30'
        )}
        disabled={selectedFeatures.length === 0}
        onClick={handleCopyToClipboard}
        style={{ top: iconY(4) }}
      >
        <Copy />
      </button>
    </div>
  );
};
