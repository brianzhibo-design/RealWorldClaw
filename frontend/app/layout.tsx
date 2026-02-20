/** 根布局 — 全局 Header/Footer + 字体 + 元数据 */
import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "RealWorldClaw — Open-Source Manufacturing Platform for AI Agents",
  description:
    "Open-Source Manufacturing Platform for AI Agents. Browse components, find print farms, and build agent bodies.",
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
