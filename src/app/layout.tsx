import type { Metadata } from "next";
import { Noto_Sans_KR, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";

const sans = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans",
});

const serif = Noto_Serif_KR({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "해나의 일기장",
  description: "해나의 생각과 일상을 기록하는 공간",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "해나의 일기장",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#f7f9fd" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#151722" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${sans.variable} ${serif.variable} font-sans relative min-h-screen selection:bg-primary/20`}>
        {/* Soft magical background gradients */}
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-[#9ab4f2]/10 to-sky-50/50 dark:from-indigo-950/30 dark:via-blue-950/20 dark:to-slate-950/80 pointer-events-none" />

        <Providers>
          <Header />
          <main className="max-w-5xl mx-auto px-6 py-8 md:py-12">{children}</main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
