"use client";

import { useState, useEffect } from "react";
import { Share2, Check, Copy } from "lucide-react";

type Props = {
  title: string;
  slug: string;
};

export default function EventHeader({ title, slug }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleShare = async () => {
    const url = `${window.location.origin}/e/${slug}`;
    const shareData = {
      title: title,
      text: `${title}のタイムスケジュール`,
      url: url,
    };

    // 1. スマホなど「共有メニュー」が使える場合
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // キャンセルされた場合は何もしない
        console.log("Share canceled");
      }
    } 
    // 2. PCなど対応していない場合はクリップボードにコピー
    else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
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
        onClick={handleShare}
        className={`w-9 h-9 ml-auto flex items-center justify-center rounded-full shadow-lg active-bounce transition-all relative
           ${scrolled ? "bg-slate-100 text-slate-600" : "bg-white text-[#00c2e8]"}
        `}
      >
        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        
        {/* コピー完了時の吹き出し (PC用) */}
        {copied && (
          <div className="absolute top-10 right-0 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap animate-in fade-in zoom-in duration-200">
            Copied!
          </div>
        )}
      </button>
    </header>
  );
}