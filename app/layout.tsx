import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/top-nav";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Quietli",
  description: "A quiet place for passing thoughts.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeProvider />

        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_40%)]" />

        <TopNav />

        {children}
      </body>
    </html>
  );
}