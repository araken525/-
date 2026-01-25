"use client";

import { useState, useEffect } from "react";
import { Share2, X, Copy, Check, MessageCircle, Twitter } from "lucide-react";

type Props = {
  title: string;
  slug: string;
};

export default function EventHeader({ title, slug }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isStaffUrl, setIsStaffUrl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  
  // スクロール状態: 0=トップ, 1=少しスクロール, 2=ヒーロー通過(白背景へ)
  const [scrollState, setScrollState] = useState(0);

  useEffect(() => {
    setOrigin(window.location.origin);
    const handleScroll = () => {
      const y = window.scrollY;
      if (y > 200) setScrollState(2); // タイトル表示
      else if (y > 10) setScrollState(1); // 背景白化開始
      else setScrollState(0); // 透明
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const shareUrl = `${origin}/e/${slug}${isStaffUrl ? "?t=staff" : ""}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${title}のスケジュール ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLine = () => window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`, "_blank");
  const shareX = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title + "\n")}&url=${encodeURIComponent(shareUrl)}`, "_blank");

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-5 transition-all duration-300
          ${scrollState >= 1 ? "bg-white/90 backdrop-blur-md shadow-sm" : "bg-transparent"}
        `}
      >
        {/* タイトルはスクロールして青背景が消えたら出る */}
        <h1 
          className={`flex-1 text-sm font-black truncate pr-4 transition-all duration-300 transform
            ${scrollState === 2 ? "opacity-100 translate-y-0 text-slate-800" : "opacity-0 translate-y-2 pointer-events-none"}
          `}
        >
          {title}
        </h1>
        
        <button
          onClick={() => setIsOpen(true)}
          className={`w-9 h-9 ml-auto flex items-center justify-center rounded-full shadow-lg active-bounce transition-all
             ${scrollState >= 1 ? "bg-slate-100 text-slate-600" : "bg-white/20 text-white backdrop-blur-md border border-white/30"}
          `}
        >
          <Share2 className="w-4 h-4" />
        </button>
      </header>

      {/* 共有モーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 space-y-6 animate-in slide-in-from-bottom-10 duration-300">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">共有する 📤</h3>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl font-bold text-sm">
              <button onClick={() => setIsStaffUrl(false)} className={`flex-1 py-3 rounded-xl transition-all ${!isStaffUrl ? "bg-white text-[#00c2e8] shadow-sm" : "text-slate-400"}`}>全員用 🎵</button>
              <button onClick={() => setIsStaffUrl(true)} className={`flex-1 py-3 rounded-xl transition-all ${isStaffUrl ? "bg-white text-[#00c2e8] shadow-sm" : "text-slate-400"}`}>スタッフ用 🔧</button>
            </div>
            <div onClick={copyToClipboard} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 cursor-pointer active:bg-slate-100 transition-colors">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm ${copied ? "bg-[#00c2e8] text-white" : "bg-white text-[#00c2e8]"}`}>
                {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-400 mb-1">タップしてコピー</div>
                <div className="text-sm font-black text-slate-700 truncate">{shareUrl}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={shareLine} className="active-bounce flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#06C755] text-white font-black text-sm shadow-lg shadow-green-100"><MessageCircle className="w-5 h-5 fill-current" /> LINE</button>
              <button onClick={shareX} className="active-bounce flex items-center justify-center gap-2 py-4 rounded-2xl bg-black text-white font-black text-sm shadow-lg shadow-slate-200"><Twitter className="w-4 h-4 fill-current" /> Post</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}