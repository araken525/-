"use client";

import { useState, useEffect } from "react";
import { Share2, X, Copy, Check, MessageCircle, Twitter, Users, Wrench } from "lucide-react";

type Props = {
  title: string;
  slug: string;
};

export default function EventHeader({ title, slug }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isStaffUrl, setIsStaffUrl] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fullUrl, setFullUrl] = useState(""); 
  const [scrolled, setScrolled] = useState(false);

  // クライアント側でのみURLを生成（バグ防止）
  useEffect(() => {
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const baseUrl = `${origin}/e/${slug}`;
      setFullUrl(isStaffUrl ? `${baseUrl}?t=staff` : baseUrl);
    }
  }, [slug, isStaffUrl]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copyToClipboard = () => {
    if (!fullUrl) return;
    navigator.clipboard.writeText(`${title}のスケジュール ${fullUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLine = () => {
    if (!fullUrl) return;
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(fullUrl)}`, "_blank");
  };

  const shareX = () => {
    if (!fullUrl) return;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title + "\n")}&url=${encodeURIComponent(fullUrl)}`, "_blank");
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-5 transition-all duration-300
          ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-transparent"}
        `}
      >
        <h1 
          className={`flex-1 text-sm font-black truncate pr-4 transition-opacity duration-300
            ${scrolled ? "opacity-100 text-slate-800" : "opacity-0"}
          `}
        >
          {title}
        </h1>
        
        <button
          onClick={() => setIsOpen(true)}
          className={`w-9 h-9 ml-auto flex items-center justify-center rounded-full shadow-lg active-bounce transition-all
             ${scrolled ? "bg-slate-100 text-slate-600" : "bg-white text-[#00c2e8]"}
          `}
        >
          <Share2 className="w-4 h-4" />
        </button>
      </header>

      {/* 新・共有シート */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          
          <div className="relative w-full max-w-sm bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            
            {/* ヘッダー */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800">共有する</h3>
              <button onClick={() => setIsOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 切り替えスイッチ */}
              <div className="bg-slate-100 p-1 rounded-xl flex font-bold text-xs">
                <button 
                  onClick={() => setIsStaffUrl(false)}
                  className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${!isStaffUrl ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}
                >
                  <Users className="w-4 h-4" /> 全員用
                </button>
                <button 
                  onClick={() => setIsStaffUrl(true)}
                  className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${isStaffUrl ? "bg-white text-slate-800 shadow-sm" : "text-slate-400"}`}
                >
                  <Wrench className="w-4 h-4" /> スタッフ用
                </button>
              </div>

              {/* URLコピー */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-400 ml-1">共有リンク</div>
                <div 
                  onClick={copyToClipboard}
                  className="group relative flex items-center gap-3 p-4 rounded-2xl border-2 border-slate-100 bg-slate-50 hover:bg-white hover:border-[#00c2e8] transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${copied ? "bg-[#00c2e8] text-white" : "bg-white text-slate-400 shadow-sm group-hover:text-[#00c2e8]"}`}>
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-400 mb-0.5">{copied ? "コピーしました！" : "タップしてコピー"}</div>
                    <div className="text-sm font-black text-slate-700 truncate">
                      {fullUrl || "読み込み中..."}
                    </div>
                  </div>
                </div>
              </div>

              {/* SNSボタン */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={shareLine} disabled={!fullUrl} className="h-12 rounded-xl bg-[#06C755] text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-100 active:scale-95 transition-all">
                  <MessageCircle className="w-5 h-5 fill-current" /> LINEで送る
                </button>
                <button onClick={shareX} disabled={!fullUrl} className="h-12 rounded-xl bg-black text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-slate-200 active:scale-95 transition-all">
                  <Twitter className="w-4 h-4 fill-current" /> Xにポスト
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}