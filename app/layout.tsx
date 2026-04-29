import type { Metadata } from "next";
import "./globals.css";
import { TopNav } from "@/components/top-nav";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Quietli",
  description:
    "A quiet place to put a thought into the world without turning it into a performance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <TopNav />
        {children}
        <Footer />
      </body>
    </html>
  );
}