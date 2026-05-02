import { createFileRoute } from "@tanstack/react-router";
import { InboxPage } from "@/pages/Inbox";
export const Route = createFileRoute("/_app/inbox")({
  head: () => ({ meta: [{ title: "Inbox — CURUZA" }] }),
  component: InboxPage,
});