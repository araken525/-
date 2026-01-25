"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Share2, Check, QrCode, Wrench, X, Printer } from "lucide-react";
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
    ? "bg-slate-900 text-white hover:bg-slate-700"
    : "bg-[#00c2e8] text-white hover:bg-cyan-500 shadow-cyan-200/50";

  return (
    <>
      {/* --- ヘッダー本体 (変更なし) --- */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 transition-all duration-500 gap-4
          ${scrolled ? "bg-white/80 backdrop-blur-xl border-b border-slate-200/50" : "bg-transparent pointer-events-none"}
        `}
      >
        <h1 
          className={`flex-1 text-sm font-black truncate transition-all duration-500 pointer-events-auto
            ${scrolled ? "opacity-100 translate-y-0 text-slate-800" : "opacity-0 -translate-y-2"}
          `}
        >
          {title}
        </h1>
        
        <div className="flex items-center gap-2 ml-auto pointer-events-auto pb-1 pt-1">
          <Link href={`/e/${slug}/edit`} className={`${btnBase} ${btnStyle}`} title="編集">
            <Wrench className="w-4 h-4" />
          </Link>
          <Link href={`/e/${slug}/print`} target="_blank" className={`${btnBase} ${btnStyle}`} title="印刷プレビュー">
            <Printer className="w-4 h-4" />
          </Link>
          <button onClick={() => setShowQR(true)} className={`${btnBase} ${btnStyle}`} title="QRコード">
            <QrCode className="w-4 h-4" />
          </button>
          <button onClick={handleShare} className={`${btnBase} ${shareBtnStyle}`} title="共有">
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* --- 新しいQRコードモーダル --- */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          {/* 背景 */}
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-md transition-opacity" onClick={() => setShowQR(false)} />
          
          {/* モーダル本体 */}
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-300 flex flex-col items-center text-center border border-slate-100">
            
            {/* 閉じるボタン */}
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mt-4 space-y-6 w-full">
               {/* タイトルと説明 */}
               <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">スケジュールを共有</h3>
                  <p className="text-sm font-bold text-slate-400 mt-1">スマホのカメラで読み取ってください</p>
               </div>

               {/* QRコードエリア (主役) */}
               {/* QRコード自体のサイズは EventQRCode コンポーネント側の設定にも依存しますが、
                   ここではコンテナを大きくし、余計な装飾を排除して際立たせています */}
               <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm mx-auto w-fit">
                 {currentUrl && <EventQRCode url={currentUrl} />}
               </div>
               
               {/* イベント名 */}
               <div className="pt-2">
                 <p className="text-xs font-black text-slate-500 bg-slate-50 inline-block px-4 py-1 rounded-full truncate max-w-full">
                    {title}
                 </p>
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}