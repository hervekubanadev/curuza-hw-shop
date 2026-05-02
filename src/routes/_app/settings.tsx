import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/pages/Settings";
export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — CURUZA" }] }),
  component: SettingsPage,
});