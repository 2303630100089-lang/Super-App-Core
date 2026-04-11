// src/app/page.tsx — Root redirects to the landing page
import { redirect } from "next/navigation";

export default function RootPage() {
  redirect("/landing");
}
