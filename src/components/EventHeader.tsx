"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Share2, Check, QrCode, Wrench, X, Printer, Smartphone } from "lucide-react";
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
  const btnBase = "w-9 h-9 flex items-center justify-center rounded-full shadow-md active:scale-95 transition-all relative z-10 border border-transparent";
  const btnStyle = scrolled 
    ? "bg-white text-slate-600 border-slate-100 hover:bg-slate-50" 
    : "bg-white/80 backdrop-blur-md text-slate-600 hover:text-[#00c2e8] hover:bg-white";
  
  const shareBtnStyle = scrolled
    ? "bg-slate-900 text-white hover:bg-slate-700" // スクロール時は黒く目立たせる
    : "bg-[#00c2e8] text-white hover:bg-cyan-500 shadow-cyan-200/50";

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 transition-all duration-500 gap-4
          ${scrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/50" : "bg-transparent pointer-events-none"}
        `}
      >
        {/* タイトル */}
        <h1 
          className={`flex-1 text-sm font-black truncate transition-all duration-500 pointer-events-auto
            ${scrolled ? "opacity-100 translate-y-0 text-slate-800" : "opacity-0 -translate-y-2"}
          `}
        >
          {title}
        </h1>
        
        {/* ボタン群 (常に操作可能) */}
        <div className="flex items-center gap-2 ml-auto pointer-events-auto pb-1 pt-1">
          
          {/* 1. 編集 */}
          <Link href={`/e/${slug}/edit`} className={`${btnBase} ${btnStyle}`} title="編集">
            <Wrench className="w-4 h-4" />
          </Link>

          {/* 2. 印刷 (ここに追加！) */}
          <Link href={`/e/${slug}/print`} target="_blank" className={`${btnBase} ${btnStyle}`} title="印刷プレビュー">
            <Printer className="w-4 h-4" />
          </Link>

          {/* 3. QR */}
          <button onClick={() => setShowQR(true)} className={`${btnBase} ${btnStyle}`} title="QRコード">
            <QrCode className="w-4 h-4" />
          </button>

          {/* 4. 共有 */}
          <button onClick={handleShare} className={`${btnBase} ${shareBtnStyle}`} title="共有">
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* スタイリッシュなQRモーダル */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowQR(false)} />
          
          {/* カード本体 */}
          <div className="relative w-full max-w-xs bg-white rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center text-center">
            
            {/* 上部デザインエリア */}
            <div className="w-full h-32 bg-gradient-to-br from-[#00c2e8] to-[#0099cc] flex flex-col items-center justify-center p-6 text-white relative">
               <div className="absolute top-4 right-4 cursor-pointer opacity-70 hover:opacity-100" onClick={() => setShowQR(false)}>
                 <X className="w-6 h-6" />
               </div>
               <Smartphone className="w-8 h-8 mb-2 opacity-90" />
               <h3 className="text-lg font-black tracking-tight leading-none">Mobile Pass</h3>
               <p className="text-[10px] font-bold opacity-80 mt-1">スマホでスキャン</p>
            </div>

            {/* QRエリア (チケットのミシン目風デザイン) */}
            <div className="relative w-full bg-white px-8 py-10">
               {/* 疑似的な切り取り線 */}
               <div className="absolute -top-3 left-0 w-full flex justify-between px-2">
                  {[...Array(12)].map((_, i) => <div key={i} className="w-4 h-4 rounded-full bg-slate-800/40 opacity-0" />)} 
                  {/* ここは装飾としてあえてシンプルに */}
               </div>
               
               {/* QRコード本体 */}
               <div className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm mx-auto w-fit">
                 {currentUrl && <EventQRCode url={currentUrl} />}
               </div>

               <div className="mt-6 space-y-1">
                 <p className="text-sm font-black text-slate-800 truncate px-4">{title}</p>
                 <p className="text-[10px] font-bold text-slate-400">Scan to Open Schedule</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}