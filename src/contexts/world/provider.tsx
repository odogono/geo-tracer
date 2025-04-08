import { useAtom } from 'jotai';

import { drawModeAtom } from './atoms';
import { WorldContext } from './context';

export const WorldProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [drawMode, setDrawMode] = useAtom(drawModeAtom);

  return (
    <WorldContext.Provider value={{ drawMode, setDrawMode }}>
      {children}
    </WorldContext.Provider>
  );
};
