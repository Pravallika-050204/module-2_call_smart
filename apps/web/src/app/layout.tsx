import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "R-Revenue Intelligence — Boilerplate Platform Hub",
  description: "Futuristic enterprise revenue operations command center driving capturing, deep conversation intelligence, AI summaries, deal drivers, forecasting, and cross-cutting GDPR/CCPA data compliance.",
  keywords: ["Revenue Intelligence", "Next.js 14", "Modular Monolith", "Speech-to-Text", "RAG", "Data Export"],
  authors: [{ name: "Technical Architecture Team & Relanto Engineering" }],
};

export const viewport: Viewport = {
  themeColor: "#02040c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body style={{ fontFamily: "var(--font-plus-jakarta), sans-serif" }}>
        <div className="cyber-grid" />
        {children}
      </body>
    </html>
  );
}
