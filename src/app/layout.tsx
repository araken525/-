import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // スマホで入力時に勝手にズームしないようにする
  userScalable: false,
  themeColor: "#0f172a", // スマホのステータスバーの色
};

export const metadata: Metadata = {
  title: "TaiSuke - タイムスケジュール共有",
  description: "舞台・イベントの進行状況をリアルタイムで共有",

  // favicon / app icon
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },

  // SNS（OGP / Twitter）
  openGraph: {
    title: "TaiSuke - タイムスケジュール共有",
    description: "舞台・イベントの進行状況をリアルタイムで共有",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "TaiSuke - タイムスケジュール共有",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TaiSuke - タイムスケジュール共有",
    description: "舞台・イベントの進行状況をリアルタイムで共有",
    images: ["/og.png"],
  },

  appleWebApp: {
    title: "TaiSuke",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        {children}
      </body>
    </html>
  );
}