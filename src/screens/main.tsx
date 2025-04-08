import { IconView } from '@components/icon-view';
import { MapView } from '@components/map-view';
import { ThemeTogglePortal } from '@components/theme/toggle-portal';
import { WorldProvider } from '@contexts/world/provider';
import { createLog } from '@helpers/log';

const log = createLog('Main');

const Main = () => {
  const message = 'Geo Path Tracer';

  log.info(message);

  return (
    <WorldProvider>
      <MapView />
      <IconView />
      <ThemeTogglePortal />
    </WorldProvider>
  );
};

export default Main;
