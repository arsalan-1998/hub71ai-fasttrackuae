import type { Metadata } from "next";
import "./globals.css";
import "./landing.css";
import "./analytics.css";
import "./brand.css";

export const metadata: Metadata = {
  title: "MAD — Manufacturing in Abu Dhabi",
  description: "Compare manufacturing expansion scenarios, explore sourced evidence and test investment assumptions.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
