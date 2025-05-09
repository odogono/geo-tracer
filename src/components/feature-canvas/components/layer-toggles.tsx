import { FeatureCollection } from 'geojson';

type LayerTogglesProps = {
  featureCollections: (FeatureCollection | undefined)[];
  onChange: (index: number) => void;
  selected: number[];
};

const Labels = ['Roads', 'Mapped GPS', 'GPS', 'Route'];

export const LayerToggles = ({
  featureCollections,
  onChange,
  selected
}: LayerTogglesProps) => (
  <div className="absolute bottom-2 left-2 bg-white text-black px-2 py-1 rounded shadow hover:bg-gray-100 z-10">
    <div className="flex flex-row gap-4 text-xs">
      {featureCollections.map((fc, index) => (
        <div className="flex flex-row gap-1" key={index}>
          <input
            checked={selected.includes(index)}
            disabled={!fc}
            key={index}
            onChange={() => onChange(index)}
            type="checkbox"
          />
          <span>{Labels[index]}</span>
        </div>
      ))}
    </div>
  </div>
);
