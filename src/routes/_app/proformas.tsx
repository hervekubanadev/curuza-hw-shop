import { createFileRoute } from "@tanstack/react-router";
import { ProformasPage } from "@/pages/Proformas";
export const Route = createFileRoute("/_app/proformas")({
  head: () => ({ meta: [{ title: "Proformas — CURUZA" }] }),
  component: ProformasPage,
});