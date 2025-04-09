import { useCallback, useEffect, useRef, useState } from 'react';

import type { editor } from 'monaco-editor';

import { useTheme } from '@contexts/theme/context';
import { useWorld } from '@contexts/world/use-world';
import { createLog } from '@helpers/log';
import { cn } from '@helpers/tailwind';
import Editor from '@monaco-editor/react';

import { EdgeFeature } from '../../types';
import { findFeatureAtTextPosition } from './helpers';

const log = createLog('SidePanel');

export const SidePanel = () => {
  const { featureCollection, setFeatureCollection, setHighlightedFeature } =
    useWorld();
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [localJson, setLocalJson] = useState('');
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

      log.debug('findContainingObjectInJson', result);

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
          ...newCollection,
          properties: { updatedAt: new Date().toISOString() }
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
        log.debug('onDidChangeCursorPosition', {
          position
        });
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
          <h2 className="text-lg font-semibold mb-4 dark:text-white">
            GeoJSON Source
          </h2>
          <div className="flex-1 relative">
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
          </div>
        </div>
      )}
    </div>
  );
};
