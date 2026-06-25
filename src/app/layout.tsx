import type { Metadata } from "next";
import localFont from "next/font/local";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

// Display face — PP Neue York (self-hosted, Normal width: Light + Medium).
// Personal-use license for now; revisit before public launch (see PLAN intake).
const neueYork = localFont({
  variable: "--font-neue-york",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/PPNeueYork-NormalLight.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/PPNeueYork-NormalMedium.otf",
      weight: "500",
      style: "normal",
    },
  ],
});

// Display heading face — Neue York Narrow Extrabold.
const neueYorkNarrow = localFont({
  variable: "--font-neue-york-narrow",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/PPNeueYork-NarrowExtrabold.otf",
      weight: "800",
      style: "normal",
    },
  ],
});

// Optional editorial heading face — PP Editorial Old Ultralight Italic.
const editorialOld = localFont({
  variable: "--font-editorial",
  display: "swap",
  src: [
    {
      path: "../../public/fonts/PPEditorialOld-UltralightItalic.otf",
      weight: "200",
      style: "italic",
    },
  ],
});

export const metadata: Metadata = {
  title: "Eclipse Poster Generator",
  description:
    "Swiss-style commemorative poster generator for The Eclipse App.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${neueYork.variable} ${neueYorkNarrow.variable} ${editorialOld.variable} ${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
