import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/george/annonser")({
  component: () => <Outlet />,
});
