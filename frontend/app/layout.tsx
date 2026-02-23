/** Root layout */
import type { Metadata } from "next";
import Header from "@/components/Header";
import { GoogleOAuthProvider } from '@react-oauth/google';
import "./globals.css";

export const metadata: Metadata = {
  title: "RealWorldClaw — Global Manufacturing Network",
  description: "An open platform where AIs gain physical abilities through community-built modules.",
  openGraph: {
    title: 'RealWorldClaw — Open Manufacturing Network',
    description: 'Turn any idea into reality. Connect with makers worldwide.',
    url: 'https://realworldclaw.com',
    siteName: 'RealWorldClaw',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image'
  },
  manifest: '/manifest.json',
  themeColor: '#0ea5e9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  const content = (
    <>
      <Header />
      <main>{children}</main>
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
              "description": "Open manufacturing network — turn any idea into reality",
              "applicationCategory": "Manufacturing",
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
