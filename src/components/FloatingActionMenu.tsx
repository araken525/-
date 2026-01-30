"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  MoreHorizontal, X, Share2, Check, QrCode, Printer, Wrench 
} from "lucide-react";
import EventQRCode from "./EventQRCode";

type Props = {
  title: string;
  slug: string;
};

export default function FloatingActionMenu({ title, slug }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  const handleShare = async () => {
    const shareData = { title, text: `${title}のタイムスケジュール`, url: shareUrl };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (e) {}
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 印刷URL（現在の絞り込み状態を引き継ぐ）
  const printUrl = `/e/${slug}/print${typeof window !== "undefined" ? window.location.search : ""}`;

  return (
    <>
      {/* --- メニューボタン (下から3番目: bottom-42) --- */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-42 right-6 z-40 w-14 h-14 bg-white text-slate-600 rounded-full shadow-xl shadow-slate-200/50 flex items-center justify-center transition-all active:scale-90 border border-slate-50"
      >
        <MoreHorizontal className="w-6 h-6" />
      </button>

      {/* --- メニューモーダル --- */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity pointer-events-auto"
            onClick={() => setIsOpen(false)}
          ></div>

          <div className="relative w-full max-w-md bg-white rounded-t-[2rem] shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-10 duration-300 flex flex-col pb-8">
            
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-black text-slate-800">その他メニュー</h3>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-4 gap-2">
              <button onClick={handleShare} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-[#00c2e8] flex items-center justify-center group-hover:bg-[#00c2e8] group-hover:text-white transition-colors">
                  {copied ? <Check className="w-6 h-6" /> : <Share2 className="w-6 h-6" />}
                </div>
                <span className="text-[10px] font-bold text-slate-500">共有</span>
              </button>

              <button onClick={() => setShowQR(true)} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                  <QrCode className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-slate-500">QRコード</span>
              </button>

              <Link href={printUrl} target="_blank" className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                  <Printer className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-slate-500">印刷</span>
              </Link>

              <Link href={`/e/${slug}/edit`} className="flex flex-col items-center gap-2 group">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <Wrench className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-slate-400">編集</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* --- QRコードモーダル --- */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setShowQR(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 p-2 text-slate-400 bg-slate-50 rounded-full">
               <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-slate-800 mb-2">QRコードで共有</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed font-bold">スマホで読み取ってアクセス</p>
            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-slate-200 inline-block mb-6">
              {shareUrl && <EventQRCode url={shareUrl} />}
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-sm font-bold text-slate-600 truncate px-6">{title}</div>
            <div className="mt-6 text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1.5">
              <QrCode className="w-3.5 h-3.5" />
              <span>絞り込み状態も共有されます</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}