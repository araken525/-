"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Share2, Check, QrCode, Wrench, X, Printer, Phone 
} from "lucide-react";
import EventQRCode from "./EventQRCode";

type Props = {
  title: string;
  slug: string;
  emergencyContacts?: { name: string, tel: string, role: string }[];
};

export default function EventHeader({ title, slug, emergencyContacts = [] }: Props) {
  const searchParams = useSearchParams();
  const [scrolled, setScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showContact, setShowContact] = useState(false);
  // showMenu は廃止
  const [shareUrl, setShareUrl] = useState("");

  const hasContacts = emergencyContacts.length > 0;

  useEffect(() => {
    const origin = window.location.origin;
    const params = searchParams?.toString();
    const fullUrl = `${origin}/e/${slug}${params ? `?${params}` : ""}`;
    setShareUrl(fullUrl);

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [slug, searchParams]);

  const handleShare = async () => {
    const shareData = {
      title: title,
      text: `${title}のタイムスケジュール`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share canceled");
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const printUrl = `/e/${slug}/print${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

  // ボタン共通スタイル
  const btnBase = "w-9 h-9 flex shrink-0 items-center justify-center rounded-full shadow-sm active:scale-95 transition-all relative z-10 border pointer-events-auto";
  
  // 通常ボタン（スクロールで白く、ホバーはCSS設定依存）
  const btnStyle = scrolled 
    ? "bg-white text-slate-600 border-slate-100" 
    : "bg-white/80 backdrop-blur-md text-slate-600 border-white/50";
  
  // 青アクセントボタン（共有など）
  const accentBtnStyle = scrolled
    ? "bg-cyan-50 text-[#00c2e8] border-cyan-100"
    : "bg-[#00c2e8]/10 backdrop-blur-md text-[#00c2e8] border-white/50";

  // 緊急連絡先ボタン（赤）
  const emergencyBtnStyle = scrolled
    ? "bg-red-50 text-red-500 border-red-100"
    : "bg-red-500/80 backdrop-blur-md text-white border-transparent";

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 transition-all duration-500 gap-4
          ${scrolled ? "bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm" : "bg-transparent pointer-events-none"}
        `}
      >
        {/* タイトル */}
        <h1 
          className={`flex-1 text-sm font-black truncate transition-all duration-500 pointer-events-auto min-w-0
            ${scrolled ? "opacity-100 translate-y-0 text-slate-800" : "opacity-0 -translate-y-2"}
          `}
        >
          {title}
        </h1>
        
        {/* ボタン群 (横スクロール可能) */}
        <div className="flex items-center gap-2 ml-auto overflow-x-auto no-scrollbar pl-2 py-2 mask-linear-to-r pointer-events-auto">
          
          {/* 1. 緊急連絡先 (存在する場合のみ最優先) */}
          {hasContacts && (
            <button onClick={() => setShowContact(true)} className={`${btnBase} ${emergencyBtnStyle}`} title="緊急連絡先">
              <Phone className="w-4 h-4" />
            </button>
          )}
          
          {/* 2. 共有ボタン (青アクセント) */}
          <button onClick={handleShare} className={`${btnBase} ${accentBtnStyle}`} title="共有する">
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </button>

          {/* 3. QRコード表示 */}
          <button onClick={() => setShowQR(true)} className={`${btnBase} ${btnStyle}`} title="QRコード">
            <QrCode className="w-4 h-4" />
          </button>

          {/* 4. 印刷プレビュー */}
          <Link href={printUrl} target="_blank" className={`${btnBase} ${btnStyle}`} title="印刷プレビュー">
            <Printer className="w-4 h-4" />
          </Link>

          {/* 5. 編集モード (管理者用) */}
          <Link href={`/e/${slug}/edit`} className={`${btnBase} ${btnStyle}`} title="編集モード">
            <Wrench className="w-4 h-4" />
          </Link>

        </div>
      </header>

      {/* --- 緊急連絡先モーダル --- */}
      {showContact && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => setShowContact(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center border border-slate-100">
             <button onClick={() => setShowContact(false)} className="absolute top-4 right-4 p-2 text-slate-400 bg-slate-50 rounded-full transition-colors">
               <X className="w-5 h-5" />
             </button>

             <div className="text-center mb-6 mt-2">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Phone className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800">緊急連絡先</h3>
                <p className="text-xs text-slate-400 mt-1">タップして発信できます</p>
             </div>
             
             <div className="space-y-3 w-full">
               {emergencyContacts.map((c, i) => (
                 <a key={i} href={`tel:${c.tel}`} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-colors group">
                    <div>
                       <div className="text-xs font-bold text-slate-400 mb-0.5">{c.role}</div>
                       <div className="text-lg font-black text-slate-800 group-hover:text-red-600">{c.name}</div>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-300 group-hover:text-red-500">
                       <Phone className="w-5 h-5" />
                    </div>
                 </a>
               ))}
             </div>
          </div>
        </div>
      )}

      {/* --- QRコードモーダル (シンプル・日本語) --- */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
          {/* 背景クリックで閉じる */}
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={() => setShowQR(false)} />
          
          <div className="relative w-full max-w-sm bg-white rounded-[2rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-center">
            {/* 閉じるボタン */}
            <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 p-2 text-slate-400 bg-slate-50 rounded-full">
               <X className="w-5 h-5" />
            </button>
            
            <h3 className="text-xl font-black text-slate-800 mb-2">QRコードで共有</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed font-bold">
              スマホのカメラで読み取ると、<br/>現在のスケジュールが表示されます。
            </p>

            {/* QRコード表示エリア */}
            <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-slate-200 inline-block mb-6">
              {shareUrl && <EventQRCode url={shareUrl} />}
            </div>

            {/* イベント名表示 */}
            <div className="bg-slate-50 rounded-xl p-3 text-sm font-bold text-slate-600 truncate px-6">
              {title}
            </div>

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