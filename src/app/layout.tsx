import type { Metadata, Viewport } from "next";
// ★変更: 定番の「Inter」と「Noto Sans JP」の2つを読み込みます
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

// 1. 英語・数字用 (世界で一番使われている標準フォント)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// 2. 日本語用 (クセがなく読みやすい定番フォント)
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "TaiSuke - タイムスケジュール共有",
  description: "舞台・イベントの進行状況をリアルタイムで共有",

  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },

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
        className={`${inter.variable} ${notoSansJP.variable} antialiased bg-slate-50 text-slate-900 tracking-normal`}
        // ★ここがポイント: 英数字はInter、日本語はNoto、それ以外はシステムフォントという優先順位を強制指定します
        style={{ fontFamily: "var(--font-inter), var(--font-noto-sans-jp), sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}