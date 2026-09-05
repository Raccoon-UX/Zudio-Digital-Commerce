import type { Metadata, Viewport } from "next";
import "./globals.css";
import { WebsiteLoader } from "@/components/ui/WebsiteLoader";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { APP_CONFIG } from "@/lib/constants";

const rawAppUrl = process.env.NEXT_PUBLIC_APP_URL;
const validAppUrl =
  rawAppUrl && (rawAppUrl.startsWith("http://") || rawAppUrl.startsWith("https://"))
    ? rawAppUrl
    : "https://zudio.demo";

export const metadata: Metadata = {
  metadataBase: new URL(validAppUrl),
  title: {
    template: `%s | ${APP_CONFIG.name}`,
    default: `${APP_CONFIG.name} — Fashion for Everyday (Concept Pilot)`,
  },
  description: APP_CONFIG.description,
  keywords: ["fashion", "everyday fashion", "menswear", "womenswear", "footwear", "store locator", "omnichannel pilot"],
  authors: [{ name: "Zudio Concept Pilot Engineering Team" }],
  openGraph: {
    title: `${APP_CONFIG.name} — Fashion for Everyday`,
    description: APP_CONFIG.description,
    type: "website",
    locale: "en_IN",
    siteName: APP_CONFIG.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_CONFIG.name} — Fashion for Everyday`,
    description: APP_CONFIG.description,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-full flex-col bg-white text-neutral-900 font-sans pb-16 md:pb-0">
        <WebsiteLoader />
        <SessionProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileNav />
        </SessionProvider>
      </body>
    </html>
  );
}
