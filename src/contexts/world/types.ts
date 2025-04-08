import { DrawMode } from '@types';

export type WorldContextType = {
  drawMode: DrawMode;

  setDrawMode: (drawMode: DrawMode) => void;
};
