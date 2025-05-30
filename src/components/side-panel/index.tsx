import { useCallback, useEffect, useRef, useState } from 'react';

import { Plus, Radiation } from 'lucide-react';
import type { editor } from 'monaco-editor';

import { useTheme } from '@contexts/theme/context';
import { useWorld } from '@contexts/world/use-world';
import { createLog } from '@helpers/log';
import { cn } from '@helpers/tailwind';
import Editor from '@monaco-editor/react';

import { EdgeFeature } from '../../types';
import { FeatureTree } from './feature-tree';
import { findFeatureAtTextPosition } from './helpers';

const log = createLog('SidePanel');

type TabType = 'json' | 'tree';

export const SidePanel = () => {
  const { featureCollection, setFeatureCollection, setHighlightedFeature } =
    useWorld();
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [localJson, setLocalJson] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('tree');
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const parseTimeoutRef = useRef<number | undefined>(undefined);

  // Update local JSON when roadCollection changes from outside
  useEffect(() => {
    setLocalJson(JSON.stringify(featureCollection, null, 2));
  }, [featureCollection]);

  const findFeatureAtCursor = useCallback(
    (position: { column: number; lineNumber: number }) => {
      if (!editorRef.current) {
        return;
      }

      const model = editorRef.current.getModel();
      if (!model) {
        return;
      }

      const text = model.getValue();
      const cursorPosition = model.getOffsetAt(position);

      // log.debug('findFeatureAtCursor', {
      //   cursorPosition,
      //   text
      // });

      const result = findFeatureAtTextPosition(text, cursorPosition);

      // log.debug('findContainingObjectInJson', result);

      // if (result) {
      setHighlightedFeature(result ? (result as unknown as EdgeFeature) : null);
      // return;
      // }
    },
    [setHighlightedFeature]
  );

  const tryParseAndUpdate = useCallback(
    (text: string) => {
      try {
        const newCollection = JSON.parse(text);
        // Basic validation
        if (
          newCollection.type !== 'FeatureCollection' ||
          !Array.isArray(newCollection.features)
        ) {
          throw new Error('Invalid GeoJSON FeatureCollection');
        }
        setFeatureCollection({
          ...newCollection
        });
        setJsonError(null);
      } catch (error) {
        setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
      }
    },
    [setFeatureCollection]
  );

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!value) {
        return;
      }
      setLocalJson(value);

      // Clear any existing timeout
      if (parseTimeoutRef.current) {
        window.clearTimeout(parseTimeoutRef.current);
      }

      // Set a new timeout to parse the JSON after a short delay
      parseTimeoutRef.current = window.setTimeout(() => {
        tryParseAndUpdate(value);
      }, 500);
    },
    [tryParseAndUpdate]
  );

  const handleEditorDidMount = useCallback(
    (editor: editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;

      // Add cursor position change listener
      editor.onDidChangeCursorPosition(() => {
        const position = editor.getPosition();
        // log.debug('onDidChangeCursorPosition', {
        //   position
        // });
        if (position) {
          findFeatureAtCursor(position);
        }
      });
    },
    [findFeatureAtCursor]
  );

  // Cleanup timeout on unmount
  useEffect(
    () => () => {
      if (parseTimeoutRef.current) {
        window.clearTimeout(parseTimeoutRef.current);
      }
    },
    []
  );

  return (
    <div
      className={cn(
        'fixed right-0 top-0 h-screen bg-white dark:bg-gray-800 shadow-lg transition-all duration-300',
        'border-l border-gray-200 dark:border-gray-700',
        isExpanded ? 'w-96' : 'w-12'
      )}
    >
      <button
        className="absolute -left-10 top-4 p-2 bg-white dark:bg-gray-800 rounded-l-lg shadow-md border border-r-0 border-gray-200 dark:border-gray-700"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? '→' : '←'}
      </button>

      {isExpanded && (
        <div className="p-4 h-full flex flex-col">
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 gap-4 pb-4">
            <button>
              <Plus />
            </button>
            <button aria-label="Reset">
              <Radiation />
            </button>
          </div>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
            <button
              className={cn(
                'px-4 py-2 text-sm font-medium',
                activeTab === 'tree'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              )}
              onClick={() => setActiveTab('tree')}
            >
              Feature Tree
            </button>
            <button
              className={cn(
                'px-4 py-2 text-sm font-medium',
                activeTab === 'json'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              )}
              onClick={() => setActiveTab('json')}
            >
              JSON Editor
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 relative">
            {activeTab === 'json' ? (
              <>
                <Editor
                  defaultLanguage="json"
                  height="100%"
                  onChange={handleEditorChange}
                  onMount={handleEditorDidMount}
                  options={{
                    automaticLayout: true,
                    bracketPairColorization: { enabled: true },
                    formatOnPaste: true,
                    formatOnType: true,
                    guides: { bracketPairs: true },
                    lineNumbers: 'on',
                    minimap: { enabled: false },
                    renderWhitespace: 'selection',
                    scrollBeyondLastLine: false,
                    tabSize: 2,
                    wordWrap: 'on',
                    wrappingIndent: 'indent'
                  }}
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  value={localJson}
                />
                {jsonError && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 text-sm">
                    {jsonError}
                  </div>
                )}
              </>
            ) : (
              <FeatureTree />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
