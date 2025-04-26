import { useCallback, useEffect, useRef, useState } from 'react';

import { FeatureCollection } from 'geojson';

import { renderFeatureCollection } from './canvas';
import { data as initialData } from './data';

export type FeatureCanvasProps = {
  id: string;
};

export const FeatureCanvas = ({ id }: FeatureCanvasProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isTextView, setIsTextView] = useState(false);
  const [featureData, setFeatureData] = useState(initialData);
  const [textValue, setTextValue] = useState(() =>
    JSON.stringify(initialData, null, 2)
  );
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 });

  // Update canvas dimensions when container size changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      // Use device pixel ratio for better rendering on high DPI displays
      const scale = window.devicePixelRatio || 1;
      setDimensions({
        height: Math.floor(rect.height * scale),
        width: Math.floor(rect.width * scale)
      });
    };

    // Initial size
    updateDimensions();

    // Watch for size changes
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, []);

  // Handle text changes and validate JSON
  const handleTextChange = (text: string) => {
    setTextValue(text);
    try {
      const parsed = JSON.parse(text);
      if (parsed?.features?.length >= 0) {
        // Basic validation that it's a FeatureCollection
        setFeatureData(parsed);
        setError(null);
      } else {
        setError('Invalid FeatureCollection format');
      }
    } catch {
      setError('Invalid JSON format');
    }
  };

  // Render canvas effect
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !featureData?.features?.length) {
      return;
    }

    renderFeatureCollection({
      canvas,
      featureCollection: featureData as unknown as FeatureCollection
    });
  }, [featureData]);

  // Call renderCanvas whenever dimensions, featureData changes or view toggles
  useEffect(() => {
    if (!isTextView && dimensions.width > 0 && dimensions.height > 0) {
      renderCanvas();
    }
  }, [isTextView, dimensions, renderCanvas]);

  return (
    <div className="w-96 h-96 bg-blue-300 relative" ref={containerRef}>
      <button
        className="absolute top-2 right-2 bg-white px-2 py-1 rounded shadow hover:bg-gray-100 z-10"
        onClick={() => setIsTextView(!isTextView)}
      >
        {isTextView ? 'Show Canvas' : 'Show JSON'}
      </button>

      {isTextView ? (
        <div className="w-full h-full p-4">
          <textarea
            className="w-full h-full font-mono text-xs p-2 resize-none"
            onChange={e => handleTextChange(e.target.value)}
            spellCheck={false}
            value={textValue}
          />
          {error && (
            <div className="absolute bottom-2 left-2 right-2 bg-red-100 text-red-700 px-2 py-1 rounded text-sm">
              {error}
            </div>
          )}
        </div>
      ) : (
        <canvas
          className="w-full h-full"
          height={dimensions.height}
          ref={canvasRef}
          style={{
            height: dimensions.height / (window.devicePixelRatio || 1),
            width: dimensions.width / (window.devicePixelRatio || 1)
          }}
          width={dimensions.width}
        />
      )}
    </div>
  );
};
