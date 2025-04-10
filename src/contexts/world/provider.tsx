import { ReactNode } from 'react';

import { WorldContext } from './context';
import { useActions } from './hooks/use-actions';
import { useModel } from './hooks/use-model';

type Props = {
  children: ReactNode;
};

export const WorldProvider = ({ children }: Props) => {
  const model = useModel();

  const actions = useActions(model);

  return (
    <WorldContext.Provider
      value={{
        ...model,
        ...actions
      }}
    >
      {children}
    </WorldContext.Provider>
  );
};
