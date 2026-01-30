import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

// ★ここがミソ：Tailwindが探している変数名「--font-geist-sans」に
// Noto Sans JP を割り当てることで、設定変更なしで強制適用させます。
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  preload: true,
  display: "swap",
  variable: "--font-geist-sans", // ← 変数名をあえて既存のものに合わせる
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
      {/* variable をクラス名に追加することで、
         Tailwindの font-sans がこのフォントを参照するようになります 
      */}
      <body
        className={`${notoSansJP.variable} antialiased bg-slate-50 text-slate-900 font-sans`}
      >
        {children}
      </body>
    </html>
  );
}