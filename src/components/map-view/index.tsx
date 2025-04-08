import { Map } from 'react-map-gl/maplibre';

import 'maplibre-gl/dist/maplibre-gl.css';

import { useTheme } from '../../contexts/theme/context';

export const MapView = () => {
  const { theme } = useTheme();

  const mapStyle =
    theme === 'dark'
      ? 'https://tiles.openfreemap.org/styles/positron'
      : 'https://tiles.openfreemap.org/styles/liberty';

  return (
    <div className="w-screen h-screen">
      <Map
        initialViewState={{
          latitude: 0,
          longitude: 0,
          zoom: 14
        }}
        mapStyle={mapStyle}
        style={{ height: '100%', width: '100%' }}
      />
    </div>
  );
};
