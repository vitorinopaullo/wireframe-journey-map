import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/kopare/affarer")({
  component: () => <Outlet />,
});
