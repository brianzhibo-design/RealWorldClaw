/** 根布局 — 全局 Header/Footer + 字体 + 元数据 */
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "RealWorldClaw — Open-Source Claw Machine Components",
  description:
    "Browse, share, and download 3D-printable claw machine components. Built by the community, for the community.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
