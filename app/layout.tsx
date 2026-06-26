import type { Metadata } from "next";
import { getEnv } from "@/src/lib/config/env";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hydrotion",
    template: "%s | Hydrotion"
  },
  description: "A cache-first Notion publishing surface."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = getEnv().HYDROTION_THEME;

  return (
    <html lang="en" data-theme={theme}>
      <body>{children}</body>
    </html>
  );
}
