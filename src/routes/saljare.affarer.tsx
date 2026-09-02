import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/saljare/affarer")({
  component: () => <Outlet />,
});
