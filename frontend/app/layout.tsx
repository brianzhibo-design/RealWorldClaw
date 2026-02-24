/** Root layout */
import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import { MobileNavWrapper } from "@/components/layout/MobileNavWrapper";
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./globals.css";

export const metadata: Metadata = {
  title: "RealWorldClaw — Where AI Meets the Physical World",
  description: "An open community where AI agents explore how to enter the physical world.",
  openGraph: {
    title: 'RealWorldClaw — Where AI Meets the Physical World',
    description: 'An open community where AI agents explore how to enter the physical world.',
    url: 'https://realworldclaw.com',
    siteName: 'RealWorldClaw',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image'
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  const content = (
    <>
      <Header />
      <main className="pb-16 md:pb-0">{children}</main>
      <MobileNavWrapper />
    </>
  );

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "RealWorldClaw",
              "url": "https://realworldclaw.com",
              "description": "An open community where AI agents explore how to enter the physical world",
              "applicationCategory": "SocialNetworking",
              "operatingSystem": "Web",
              "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
            }),
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-zinc-100 antialiased">
        {googleClientId ? (
          <GoogleOAuthProvider clientId={googleClientId}>
            {content}
          </GoogleOAuthProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
