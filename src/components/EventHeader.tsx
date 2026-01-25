"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Share2, Check, QrCode, Wrench, X } from "lucide-react";
// 以前作成したクライアントサイド用のQR部品を再利用
import EventQRCode from "./EventQRCode";

type Props = {
  title: string;
  slug: string;
};

export default function EventHeader({ title, slug }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    // クライアントサイドでのみ実行
    setCurrentUrl(window.location.href);

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleShare = async () => {
    const url = currentUrl || `${window.location.origin}/e/${slug}`;
    const shareData = {
      title: title,
      text: `${title}のタイムスケジュール`,
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share canceled");
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ボタン共通スタイル
  const btnBase = "w-9 h-9 flex items-center justify-center rounded-full shadow-lg active:scale-95 transition-all relative z-10";
  const btnStyle = scrolled 
    ? "bg-slate-100 text-slate-600 hover:bg-slate-200" 
    : "bg-white/90 backdrop-blur-sm text-slate-600 hover:text-[#00c2e8] hover:bg-white";
  // 共有ボタンだけ少し目立たせる
  const shareBtnStyle = scrolled
    ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
    : "bg-white text-[#00c2e8] hover:bg-cyan-50";

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 transition-all duration-300 gap-4
          ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent pointer-events-none"}
        `}
      >
        {/* タイトル (スクロール時のみ表示) */}
        <h1 
          className={`flex-1 text-sm font-black truncate transition-opacity duration-300 pointer-events-auto
            ${scrolled ? "opacity-100 text-slate-800" : "opacity-0"}
          `}
        >
          {title}
        </h1>
        
        {/* 右側のボタン群 */}
        <div className="flex items-center gap-2 ml-auto pointer-events-auto">
          
          {/* 1. 編集ボタン */}
          <Link
            href={`/e/${slug}/edit`}
            className={`${btnBase} ${btnStyle}`}
            title="編集ページへ"
          >
            <Wrench className="w-4 h-4" />
          </Link>

          {/* 2. QR表示ボタン */}
          <button
            onClick={() => setShowQR(true)}
            className={`${btnBase} ${btnStyle}`}
            title="QRコードを表示"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* 3. 共有ボタン (OS標準) */}
          <button
            onClick={handleShare}
            className={`${btnBase} ${shareBtnStyle}`}
            title="共有する"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied && (
              <div className="absolute top-full right-0 mt-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap animate-in fade-in zoom-in duration-200">
                Copied!
              </div>
            )}
          </button>
        </div>
      </header>

      {/* QRコードモーダル */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* 背景タップで閉じる */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowQR(false)} />
          
          {/* モーダル本体 */}
          <div className="relative bg-white rounded-[2.5rem] p-8 shadow-2xl w-full max-w-xs text-center animate-in zoom-in-95 duration-300 space-y-6">
            <div className="space-y-2">
               <h3 className="text-xl font-black text-slate-800 tracking-tight">QRコードで共有</h3>
               <p className="text-xs font-bold text-slate-400">カメラで読み取ると、<br/>このページがスマホで開きます。</p>
            </div>
            
            <div className="flex justify-center p-4 bg-slate-50 rounded-3xl border-4 border-white shadow-inner">
               {/* 安全なQR部品を使用 */}
              {currentUrl && <EventQRCode url={currentUrl} />}
            </div>
            
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}