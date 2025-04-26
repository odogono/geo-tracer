import { createFileRoute } from '@tanstack/react-router';

const RouteComponent = () => <div>Hello &quot;koans&quot;!</div>;

export const Route = createFileRoute('/koans')({
  component: RouteComponent
});
