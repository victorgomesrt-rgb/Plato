import type { Metadata } from "next";
import { Bricolage_Grotesque, Inter } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://platodigital.io"),
  title: {
    default: "Plato — Video menus for Caribbean restaurants",
    template: "%s · Plato",
  },
  description:
    "A fast, mobile-first video menu for every restaurant. Scan, watch the food, decide.",
  openGraph: {
    type: "website",
    siteName: "Plato",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Plato — turn every table into a video menu" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
