import type { Metadata, Viewport } from "next";
import "./globals.css";
import { TopNav } from "@/components/top-nav";

export const metadata: Metadata = {
  title: "Quietli",
  description:
    "A quiet place to put a thought into the world without turning it into a performance.",
  applicationName: "Quietli",
  appleWebApp: {
    capable: true,
    title: "Quietli",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#b6a9ef",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className="min-h-screen antialiased"
        style={{
          background: "linear-gradient(to bottom right, #c6426e, #8f4db8, #642b73)",
          color: "#f8fafc",
        }}
      >
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_40%)]" />
        <TopNav />
        {children}
      </body>
    </html>
  );
}