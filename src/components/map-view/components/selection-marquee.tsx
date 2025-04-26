import { useCallback, useEffect, useState } from 'react';

import { createPortal } from 'react-dom';

type SelectionMarqueeProps = {
  active: boolean;
  mapContainer: HTMLElement | null;
  onSelectionCancel?: () => void;
  onSelectionComplete?: (bounds: {
    end: [number, number];
    start: [number, number];
  }) => void;
};

type MarqueeState = {
  current: [number, number] | null;
  isDrawing: boolean;
  start: [number, number] | null;
};

export const SelectionMarquee: React.FC<SelectionMarqueeProps> = ({
  active,
  mapContainer,
  onSelectionCancel,
  onSelectionComplete
}) => {
  const [marqueeState, setMarqueeState] = useState<MarqueeState>({
    current: null,
    isDrawing: false,
    start: null
  });

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (!active) {
        return;
      }

      const rect = mapContainer?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMarqueeState({
        current: [x, y],
        isDrawing: true,
        start: [x, y]
      });
    },
    [active, mapContainer]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!marqueeState.isDrawing || !mapContainer) {
        return;
      }

      const rect = mapContainer.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMarqueeState(prev => ({
        ...prev,
        current: [x, y]
      }));
    },
    [marqueeState.isDrawing, mapContainer]
  );

  const handleMouseUp = useCallback(() => {
    if (marqueeState.isDrawing && marqueeState.start && marqueeState.current) {
      onSelectionComplete?.({
        end: marqueeState.current,
        start: marqueeState.start
      });
    }

    setMarqueeState({
      current: null,
      isDrawing: false,
      start: null
    });
  }, [marqueeState, onSelectionComplete]);

  useEffect(() => {
    if (!mapContainer || !active) {
      return;
    }

    mapContainer.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      mapContainer.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [mapContainer, active, handleMouseDown, handleMouseMove, handleMouseUp]);

  if (
    !mapContainer ||
    !marqueeState.isDrawing ||
    !marqueeState.start ||
    !marqueeState.current
  ) {
    return null;
  }

  const [startX, startY] = marqueeState.start;
  const [currentX, currentY] = marqueeState.current;

  const left = Math.min(startX, currentX);
  const top = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  return createPortal(
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: '2px dashed rgba(0, 0, 0, 0.8)',
        height,
        left,
        pointerEvents: 'none',
        position: 'absolute',
        top,
        width
      }}
    />,
    mapContainer
  );
};
