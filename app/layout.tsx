import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/top-nav";
import { ThemeInitializer } from "@/components/theme-initializer";

export const metadata: Metadata = {
  title: "Quietli",
  description: "Social media for wallflowers.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        <ThemeInitializer />
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_38%)]" />
        <TopNav />
        {children}
      </body>
    </html>
  );
}
