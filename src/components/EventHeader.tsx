"use client";

import { useState, useEffect } from "react";
import { Share2, X, Copy, Check, MessageCircle, Twitter, Link as LinkIcon } from "lucide-react";

type Props = {
  title: string;
  slug: string;
};

export default function EventHeader({ title, slug }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isStaffUrl, setIsStaffUrl] = useState(false); // スタッフ用URL切り替え
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // シェアするURLを生成
  const shareUrl = `${origin}/e/${slug}${isStaffUrl ? "?t=staff" : ""}`;
  const shareText = `${title}のタイムスケジュール ${shareUrl}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLine = () => {
    window.open(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  const shareX = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title + "\n")}&url=${encodeURIComponent(shareUrl)}`, "_blank");
  };

  return (
    <>
      {/* 1. 極薄・シンプルヘッダー (常時固定) */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-5 bg-white/70 backdrop-blur-md border-b border-white/40 shadow-sm transition-all">
        <h1 className="text-sm font-bold text-slate-800 truncate pr-4 opacity-90">
          {title}
        </h1>
        <button
          onClick={() => setIsOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/80 text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-colors shadow-sm ring-1 ring-slate-900/5"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </header>

      {/* 2. 共有ポップアップ (モーダル) */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* 背景 (暗くする) */}
          <div 
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* モーダル本体 */}
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800">共有する</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* URL切り替えタブ */}
            <div className="bg-slate-100 p-1 rounded-xl flex font-bold text-xs">
              <button
                onClick={() => setIsStaffUrl(false)}
                className={`flex-1 py-2.5 rounded-lg transition-all ${!isStaffUrl ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                全員用URL
              </button>
              <button
                onClick={() => setIsStaffUrl(true)}
                className={`flex-1 py-2.5 rounded-lg transition-all ${isStaffUrl ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
              >
                スタッフ用URL
              </button>
            </div>

            {/* URL表示 & コピー */}
            <div 
              onClick={copyToClipboard}
              className="flex items-center gap-3 p-3 rounded-2xl border-2 border-slate-100 bg-slate-50 cursor-pointer active:scale-[0.98] transition-transform group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold text-slate-400 mb-0.5">タップしてリンクをコピー</div>
                <div className="text-xs font-bold text-slate-700 truncate font-mono">
                  {shareUrl}
                </div>
              </div>
            </div>

            {/* SNSボタン */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={shareLine}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#06C755] text-white font-bold text-sm shadow-lg shadow-green-100 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <MessageCircle className="w-5 h-5 fill-current" />
                LINEで送る
              </button>
              <button
                onClick={shareX}
                className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-black text-white font-bold text-sm shadow-lg shadow-slate-200 hover:opacity-90 active:scale-[0.98] transition-all"
              >
                <Twitter className="w-4 h-4 fill-current" />
                ポストする
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}