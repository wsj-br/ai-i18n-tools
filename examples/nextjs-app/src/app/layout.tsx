import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "ai-i18n-tools Next.js example",
  description:
    "Example Next.js application demonstrating ai-i18n-tools",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" dir="ltr" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
