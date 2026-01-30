"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Share2, Check, QrCode, Wrench, X, Printer, Phone, 
  AlertCircle, MoreHorizontal 
} from "lucide-react";
import EventQRCode from "./EventQRCode";

type Props = {
  title: string;
  slug: string;
  emergencyContacts?: { name: string, tel: string, role: string }[];
};

export default function EventHeader({ title, slug, emergencyContacts = [] }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showContact, setShowContact] = useState(false);
  
  // ▼ 追加: メニュー開閉用
  const [showMenu, setShowMenu] = useState(false);
  
  const [currentUrl, setCurrentUrl] = useState("");

  const hasContacts = emergencyContacts.length > 0;

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
    // シェアしたらメニューを閉じる
    setShowMenu(false);
  };

  // ボタン共通スタイル
  const btnBase = "w-9 h-9 flex items-center justify-center rounded-full shadow-md active:scale-95 transition-all relative z-10 border border-transparent";
  const btnStyle = scrolled 
    ? "bg-white text-slate-600 border-slate-100 hover:bg-slate-50" 
    : "bg-white/80 backdrop-blur-md text-slate-600 hover:text-[#00c2e8] hover:bg-white";
  
  // 緊急連絡先ボタン (赤系)
  const emergencyBtnStyle = scrolled
    ? "bg-red-50 text-red-500 border-red-100 hover:bg-red-100"
    : "bg-red-500/80 backdrop-blur-md text-white hover:bg-red-500";

  return (
    <>
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
        
        <div className="flex items-center gap-2 ml-auto pointer-events-auto pb-1 pt-1 relative">
          
          {/* 1. 緊急連絡先 (最優先・単独表示) */}
          {hasContacts && (
            <button 
              onClick={() => setShowContact(true)} 
              className={`${btnBase} ${emergencyBtnStyle}`} 
              title="緊急連絡先"
            >
              <AlertCircle className="w-4 h-4" />
            </button>
          )}

          {/* 2. 編集ボタン (よく使うので単独表示) */}
          <Link href={`/e/${slug}/edit`} className={`${btnBase} ${btnStyle}`} title="編集">
            <Wrench className="w-4 h-4" />
          </Link>

          {/* 3. その他メニュー (共有・QR・印刷を収納) */}
          <div className="relative">
             <button 
               onClick={() => setShowMenu(!showMenu)} 
               className={`${btnBase} ${btnStyle} ${showMenu ? "ring-2 ring-cyan-100 bg-white" : ""}`} 
               title="メニュー"
             >
               <MoreHorizontal className="w-4 h-4" />
             </button>

             {/* ドロップダウンメニュー */}
             {showMenu && (
               <>
                 <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)}></div>
                 <div className="absolute right-0 top-12 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 flex flex-col gap-1 animate-in fade-in zoom-in-95 origin-top-right z-20">
                    
                    <button 
                      onClick={handleShare} 
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-slate-50 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-cyan-50 text-[#00c2e8] flex items-center justify-center group-hover:bg-[#00c2e8] group-hover:text-white transition-colors">
                        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-bold text-slate-700">共有する</span>
                    </button>

                    <button 
                      onClick={() => { setShowQR(true); setShowMenu(false); }} 
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-slate-50 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">QRコードを表示</span>
                    </button>

                    <Link 
                      href={`/e/${slug}/print`} 
                      target="_blank"
                      onClick={() => setShowMenu(false)}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-slate-50 text-left transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                        <Printer className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">印刷プレビュー</span>
                    </Link>

                 </div>
               </>
             )}
          </div>

        </div>
      </header>

      {/* --- 緊急連絡先モーダル --- */}
      {showContact && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => setShowContact(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center border border-slate-100">
             <button 
               onClick={() => setShowContact(false)}
               className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
             >
               <X className="w-5 h-5" />
             </button>

             <div className="text-center mb-6 mt-2">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800">緊急連絡先</h3>
                <p className="text-xs text-slate-400 mt-1">タップして発信できます</p>
             </div>
             
             <div className="space-y-3 w-full">
               {emergencyContacts.map((c, i) => (
                 <a 
                   key={i} 
                   href={`tel:${c.tel}`}
                   className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-red-50 hover:border-red-100 transition-colors group"
                 >
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

      {/* --- QRコードモーダル --- */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-md transition-opacity" onClick={() => setShowQR(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] animate-in zoom-in-95 duration-300 flex flex-col items-center text-center border border-slate-100">
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mt-4 space-y-6 w-full">
               <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">スケジュールを共有</h3>
                  <p className="text-sm font-bold text-slate-400 mt-1">スマホのカメラで読み取ってください</p>
               </div>
               <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm mx-auto w-fit">
                 {currentUrl && <EventQRCode url={currentUrl} />}
               </div>
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