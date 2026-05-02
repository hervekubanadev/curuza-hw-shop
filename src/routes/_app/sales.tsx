import { createFileRoute } from "@tanstack/react-router";
import { SalesPage } from "@/pages/Sales";
export const Route = createFileRoute("/_app/sales")({
  head: () => ({ meta: [{ title: "Sales — CURUZA" }] }),
  component: SalesPage,
});