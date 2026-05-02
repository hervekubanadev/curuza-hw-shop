import { createFileRoute } from "@tanstack/react-router";
import { DebtsPage } from "@/pages/Debts";
export const Route = createFileRoute("/_app/debts")({
  head: () => ({ meta: [{ title: "Debts — CURUZA" }] }),
  component: DebtsPage,
});