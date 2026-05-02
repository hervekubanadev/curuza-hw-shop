import { createFileRoute } from "@tanstack/react-router";
import { DeliveryNotesPage } from "@/pages/DeliveryNotes";
export const Route = createFileRoute("/_app/delivery-notes")({
  head: () => ({ meta: [{ title: "Delivery Notes — CURUZA" }] }),
  component: DeliveryNotesPage,
});