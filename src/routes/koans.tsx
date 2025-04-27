import { FeatureCanvas } from '@components/feature-canvas';
import { createFileRoute } from '@tanstack/react-router';

const Component = () => (
  <div className="relative w-screen h-screen bg-yellow-700">
    <div className="flex flex-col gap-12 justify-center items-center pt-12">
      <FeatureCanvas scenarioId="scenario-one" />
      <FeatureCanvas scenarioId="scenario-two" />
    </div>
  </div>
);

export const Route = createFileRoute('/koans')({
  component: Component
});
