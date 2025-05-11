import { useCallback, useEffect, useRef, useState } from 'react';

import { CodeIcon, RouteIcon } from 'lucide-react';

import { createLog } from '@helpers/log';

import { renderFeatureCollection } from './canvas';
import { LayerToggles } from './components/layer-toggles';
import { data as initialData } from './data';
import { useDimensions } from './hooks/use-dimensions';
import { useScenario } from './hooks/use-scenario';

const log = createLog('FeatureCanvas');

export type FeatureCanvasProps = {
  scenarioId: string;
};

export const FeatureCanvas = ({ scenarioId }: FeatureCanvasProps) => {
  const { containerRef, dimensions } = useDimensions();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isTextView, setIsTextView] = useState(false);
  const [featureData, setFeatureData] = useState(initialData);
  const [textValue, setTextValue] = useState(() =>
    JSON.stringify(initialData, null, 2)
  );
  const [error, setError] = useState<string | null>(null);

  const {
    bbox: scenarioBbox,
    featureCollections: scenarioFeatureCollections,
    gpsFC,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  } = useScenario(scenarioId);

  // log.debug('scenarioFeatureCollections', scenarioFeatureCollections);
  log.debug('gpsFC', gpsFC);
  const gpsStr = gpsFC ? gpsFC.bbox?.join(',') : '';

  const [selectedFeatureCollections, setSelectedFeatureCollections] = useState<
    number[]
  >(Array.from({ length: scenarioFeatureCollections.length }, (_, i) => i));

  const handleFeatureCollectionChange = (index: number) => {
    setSelectedFeatureCollections(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      }
      return [...prev, index];
    });
  };

  useEffect(() => {
    setTextValue(JSON.stringify(gpsFC, null, 2));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gpsStr]);

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
    if (!canvas || !scenarioFeatureCollections?.length) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let ii = 0; ii < scenarioFeatureCollections.length; ii++) {
      const featureCollection = scenarioFeatureCollections[ii];
      if (!featureCollection || !selectedFeatureCollections.includes(ii)) {
        continue;
      }

      // console.debug('rendering featureCollection', featureCollection);
      renderFeatureCollection({
        bbox: scenarioBbox,
        canvas,
        ctx,
        featureCollection
      });
    }

    // renderFeatureCollection({
    //   bbox: scenarioBbox,
    //   canvas,
    //   featureCollection: featureData as unknown as FeatureCollection
    // });
  }, [scenarioFeatureCollections, scenarioBbox, selectedFeatureCollections]);

  // Call renderCanvas whenever dimensions, featureData changes or view toggles
  useEffect(() => {
    if (!isTextView && dimensions.width > 0 && dimensions.height > 0) {
      renderCanvas();
    }
  }, [isTextView, dimensions, renderCanvas]);

  return (
    <div
      className="w-[768px] h-[768px] bg-slate-400 relative"
      ref={containerRef}
    >
      <button
        className="absolute top-2 right-2 bg-white text-black px-2 py-1 rounded shadow hover:bg-gray-100 z-10"
        onClick={() => setIsTextView(!isTextView)}
      >
        {isTextView ? (
          <RouteIcon className="w-4 h-4" />
        ) : (
          <CodeIcon className="w-4 h-4" />
        )}
      </button>

      <LayerToggles
        featureCollections={scenarioFeatureCollections}
        onChange={handleFeatureCollectionChange}
        selected={selectedFeatureCollections}
      />

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
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
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
