"use client";

import { ContactScreen } from "@/screens/contact/ContactScreen";
import { AppShell } from "@/components/presentational/AppShell";

export default function ContactPage() {
  return (
    <AppShell showLogin={true}>
      <ContactScreen />
    </AppShell>
  );
}
