"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Share2, Check, QrCode, Wrench, X, Printer, Phone, 
  MoreHorizontal, Ticket 
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
  const [showMenu, setShowMenu] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const hasContacts = emergencyContacts.length > 0;

  // パラメータが変わるたびに共有用URLを更新
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
    setShowMenu(false);
  };

  // 印刷用URL生成 (絞り込み状態を引き継ぐ)
  const printUrl = `/e/${slug}/print${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;

  // ボタン共通スタイル
  const btnBase = "w-9 h-9 flex items-center justify-center rounded-full shadow-md active:scale-95 transition-all relative z-10 border border-transparent";
  const btnStyle = scrolled 
    ? "bg-white text-slate-600 border-slate-100 hover:bg-slate-50" 
    : "bg-white/80 backdrop-blur-md text-slate-600 hover:text-[#00c2e8] hover:bg-white";
  
  // 緊急連絡先ボタン
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
          
          {/* 1. 緊急連絡先 */}
          {hasContacts && (
            <button 
              onClick={() => setShowContact(true)} 
              className={`${btnBase} ${emergencyBtnStyle}`} 
              title="緊急連絡先"
            >
              <Phone className="w-4 h-4" />
            </button>
          )}

          {/* 2. その他メニュー */}
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
                 <div className="absolute right-0 top-12 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 flex flex-col gap-1 animate-in fade-in zoom-in-95 origin-top-right z-20">
                    
                    {/* 一般機能 */}
                    <button onClick={handleShare} className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-slate-50 text-left transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-cyan-50 text-[#00c2e8] flex items-center justify-center group-hover:bg-[#00c2e8] group-hover:text-white transition-colors">
                        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                      </div>
                      <span className="text-xs font-bold text-slate-700">共有する</span>
                    </button>

                    <button onClick={() => { setShowQR(true); setShowMenu(false); }} className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-slate-50 text-left transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">QRコードを表示</span>
                    </button>

                    {/* 印刷ボタン */}
                    <Link href={printUrl} target="_blank" onClick={() => setShowMenu(false)} className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-slate-50 text-left transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                        <Printer className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-700">印刷プレビュー</span>
                    </Link>

                    {/* 区切り線 */}
                    <div className="h-px bg-slate-100 my-1 mx-2"></div>

                    {/* 管理者向け機能 */}
                    <Link href={`/e/${slug}/edit`} onClick={() => setShowMenu(false)} className="flex items-center gap-3 w-full px-3 py-3 rounded-xl hover:bg-slate-50 text-left transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-600">編集モード</span>
                        <span className="text-[10px] text-slate-400">管理者用</span>
                      </div>
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
             <button onClick={() => setShowContact(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
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
                 <a key={i} href={`tel:${c.tel}`} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-red-50 hover:border-red-100 transition-colors group">
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

      {/* --- QRコードモーダル (Access Pass風・日本語・青テーマ) --- */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowQR(false)} />
          
          <div className="relative w-full max-w-xs bg-white rounded-[2rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8 duration-500">
            {/* 1. Header (青テーマ・日本語化) */}
            <div className="bg-gradient-to-br from-[#00c2e8] to-blue-500 p-6 text-center text-white relative">
               <div className="absolute top-4 right-4">
                 <button onClick={() => setShowQR(false)} className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors">
                   <X className="w-4 h-4" />
                 </button>
               </div>
               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-sm border border-white/30">
                  <Ticket className="w-6 h-6 text-white" />
               </div>
               <h3 className="text-xl font-black tracking-tight leading-none">スケジュール共有</h3>
               <p className="text-[10px] font-bold opacity-90 mt-1">スマホで読み取ってアクセス</p>
            </div>

            {/* 2. Content */}
            <div className="p-8 flex flex-col items-center bg-white relative">
               {/* Ticket cutout effect */}
               <div className="absolute -top-3 left-0 w-6 h-6 bg-slate-900 rounded-full translate-x-[-50%]"></div>
               <div className="absolute -top-3 right-0 w-6 h-6 bg-slate-900 rounded-full translate-x-[50%]"></div>
               
               {/* QR Code Container (動的URL反映) */}
               <div className="p-1 rounded-xl border-2 border-slate-100 mb-6">
                 <div className="bg-white rounded-lg overflow-hidden">
                   {shareUrl && <EventQRCode url={shareUrl} />}
                 </div>
               </div>

               {/* Info */}
               <div className="text-center w-full">
                  <div className="text-[10px] font-bold text-slate-400 mb-1">イベント名</div>
                  <h2 className="text-lg font-black text-slate-800 leading-tight line-clamp-2 px-2">
                    {title}
                  </h2>
               </div>

               {/* Helper Text */}
               <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 px-4 py-2 rounded-full">
                  <QrCode className="w-3 h-3" />
                  <span>読み取ると、現在の条件で開きます</span>
               </div>
            </div>
            
            {/* 3. Bottom Decorative Bar */}
            <div className="h-2 bg-slate-100 flex items-center justify-center gap-1 overflow-hidden">
               {[...Array(20)].map((_, i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-slate-200 shrink-0"></div>
               ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}