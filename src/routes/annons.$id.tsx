import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/annons/$id")({
  component: () => <Outlet />,
});
