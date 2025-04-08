import { createContext } from 'react';

import { WorldContextType } from './types';

export const WorldContext = createContext<WorldContextType | undefined>(
  undefined
);
