import { useCallback } from 'react';

import { createLog } from '@helpers/log';

import type { UseModelResult } from './use-model';

const log = createLog('useActions');

export type UseActionsResult = ReturnType<typeof useActions>;

type UseActionsProps = UseModelResult;

export const useActions = ({ featureCollections }: UseActionsProps) => {
  const calculateRoute = useCallback(() => {
    log.debug('calculateRoute');

    const routeCollection = featureCollections[0];

    if (!routeCollection) {
      log.error('No feature collection selected');
      return;
    }

    log.debug('routeCollection', routeCollection);
  }, [featureCollections]);

  return {
    calculateRoute
  };
};
