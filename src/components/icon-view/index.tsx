import { useCallback } from 'react';

import { Route, SquareDashed } from 'lucide-react';

import { useTheme } from '@contexts/theme/context';
import { useWorld } from '@contexts/world/use-world';
import { cn } from '@helpers/tailwind';
import { DrawMode } from '@types';

export const IconView = () => {
  const { theme } = useTheme();
  const { drawMode, setDrawMode } = useWorld();

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

  return (
    <div className="absolute top-0 left-0">
      <button
        aria-label={`Select Mode`}
        className={cn(
          'fixed top-4 left-4 p-2 rounded-full',
          'bg-gray-500 dark:bg-opacity-20 dark:backdrop-blur-sm',
          'hover:bg-gray-700 dark:hover:bg-opacity-30',
          'transition-colors',
          {
            'bg-orange-500 dark:bg-opacity-30': drawMode === 'route',
            'hover:bg-opacity-30': drawMode === 'route'
          }
        )}
        onClick={() => handleSetDrawMode('route')}
      >
        <SquareDashed />
      </button>
      <button
        aria-label={`Draw Route`}
        className={cn(
          'fixed top-24 left-4 p-2 rounded-full',
          'bg-gray-500 dark:bg-opacity-20 dark:backdrop-blur-sm',
          'hover:bg-gray-700 dark:hover:bg-opacity-30',
          'transition-colors',
          {
            'bg-orange-500 dark:bg-opacity-30': drawMode === 'road',
            'hover:bg-opacity-30': drawMode === 'road'
          }
        )}
        onClick={() => handleSetDrawMode('road')}
      >
        <Route />
      </button>
    </div>
  );
};
