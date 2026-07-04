import type { Metadata, Viewport } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const serif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  themeColor: "#CCFF5E",
};

export const metadata: Metadata = {
  title: "UdyamAI — MSME Financial Health, in real time.",
  description:
    "Every GST-registered business in India gets a live Health Score. See where you stand with 64 lenders — before you apply.",
  metadataBase: new URL("https://udyam.credit"),
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/udyamai.svg", sizes: "any", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
  openGraph: {
    title: "UdyamAI — MSME Financial Health, in real time.",
    description:
      "Every GST-registered business in India gets a live Health Score. See where you stand with 64 lenders — before you apply.",
    type: "website",
    images: ["/udyamai.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${serif.variable}`}>
      <body className="min-h-screen bg-black font-sans text-base-50 antialiased">
        {children}
      </body>
    </html>
  );
}
