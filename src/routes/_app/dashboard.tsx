import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/pages/Dashboard";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CURUZA" }] }),
  component: DashboardPage,
});