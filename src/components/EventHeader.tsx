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

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

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
      {/* note風ヘッダー：シンプル・白背景・下線あり */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 bg-white border-b border-gray-200 transition-all">
        <h1 className="text-sm font-bold text-gray-800 truncate pr-4">
          {title}
        </h1>
        {/* 共有ボタン：シンプルに */}
        <button
          onClick={() => setIsOpen(true)}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {/* 共有モーダル */}
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="relative w-full max-w-sm bg-white rounded-xl shadow-xl p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="text-lg font-bold text-gray-800">共有する</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex gap-2 text-sm font-bold">
              <button
                onClick={() => setIsStaffUrl(false)}
                className={`flex-1 py-2 rounded-lg border ${!isStaffUrl ? "border-[#2cb696] text-[#2cb696] bg-[#2cb696]/10" : "border-gray-200 text-gray-500"}`}
              >
                全員用URL
              </button>
              <button
                onClick={() => setIsStaffUrl(true)}
                className={`flex-1 py-2 rounded-lg border ${isStaffUrl ? "border-[#2cb696] text-[#2cb696] bg-[#2cb696]/10" : "border-gray-200 text-gray-500"}`}
              >
                スタッフ用URL
              </button>
            </div>

            <div 
              onClick={copyToClipboard}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${copied ? "bg-[#2cb696] text-white" : "bg-gray-200 text-gray-500"}`}>
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 mb-0.5">リンクをコピー</div>
                <div className="text-sm font-bold text-gray-800 truncate font-mono">{shareUrl}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button onClick={shareLine} className="flex items-center justify-center gap-2 py-3 rounded-lg bg-[#06C755] text-white font-bold text-sm hover:opacity-90">
                <MessageCircle className="w-5 h-5 fill-current" /> LINE
              </button>
              <button onClick={shareX} className="flex items-center justify-center gap-2 py-3 rounded-lg bg-black text-white font-bold text-sm hover:opacity-90">
                <Twitter className="w-4 h-4 fill-current" /> X (Twitter)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}