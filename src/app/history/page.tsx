import { redirect } from "next/navigation";

/*
 * The History page is intentionally turned OFF until accurate copy is provided.
 * Any direct visit is redirected home; the page is unlinked from the nav.
 *
 * The previous draft (timeline + narrative) lives in git history — restore it
 * (or replace with confirmed copy) when the real history is ready, and re-add
 * the { href: "/history", label: "History" } entry to `nav` in src/lib/site.ts.
 */
export default function HistoryPage() {
  redirect("/");
}
