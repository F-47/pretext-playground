import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pretext Playground — text flows around obstacles",
  description:
    "Interactive editor for flowing text around arbitrary obstacles. Pre-calculated layouts, zero layout shift. Export production-ready React code. Powered by Pretext.",
  keywords: [
    "text layout",
    "pretext",
    "obstacle layout",
    "text wrapping",
    "CSS layout",
    "react component",
    "zero CLS",
    "typography tool",
    "text around image",
  ],
  authors: [{ name: "F-47", url: "https://github.com/F-47" }],
  openGraph: {
    title: "Pretext Playground — text flows around obstacles",
    description:
      "Interactive editor for flowing text around arbitrary obstacles. Pre-calculated layouts, zero layout shift. Export production-ready React code.",
    type: "website",
    url: "https://github.com/F-47/pretext-playground",
    siteName: "Pretext Playground",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pretext Playground — text flows around obstacles",
    description:
      "Interactive editor for flowing text around arbitrary obstacles. Pre-calculated layouts, zero layout shift. Export production-ready React code.",
    creator: "@F_47",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-[100dvh] flex flex-col bg-[#09090b]">
        {children}
      </body>
    </html>
  );
}
