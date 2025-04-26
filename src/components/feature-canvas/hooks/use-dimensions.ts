import { useEffect, useRef, useState } from 'react';

export const useDimensions = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ height: 0, width: 0 });

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
  }, [containerRef]);

  return {
    containerRef,
    dimensions
  };
};
