import { createFileRoute } from "@tanstack/react-router";
import { EmployeesPage } from "@/pages/Employees";
export const Route = createFileRoute("/_app/employees")({
  head: () => ({ meta: [{ title: "Employees — CURUZA" }] }),
  component: EmployeesPage,
});