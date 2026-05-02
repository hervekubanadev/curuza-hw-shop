import { createFileRoute } from "@tanstack/react-router";
import { CustomersPage } from "@/pages/Customers";
export const Route = createFileRoute("/_app/customers")({
  head: () => ({ meta: [{ title: "Customers — CURUZA" }] }),
  component: CustomersPage,
});