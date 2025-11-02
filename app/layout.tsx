import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sato Finder - Find Your Friendly Neighborhood Satoshi",
  description: "Discover Bitcoin miners in your neighborhood. Explore the global network of Bitcoin nodes and connect with nearby miners.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
