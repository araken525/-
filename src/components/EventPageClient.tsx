"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { User, Users, ChevronDown, ChevronUp, Link2, Youtube, Video, FileText, Image as ImageIcon, Phone, AlertCircle } from "lucide-react"; // AlertCircleを復活

/* === ヘルパー: 資料アイコンとスタイル === */
function getMaterialInfo(url: string) {
  const u = url.toLowerCase();
  const style = { 
    color: "text-[#00c2e8]", 
    bg: "bg-cyan-50 sm:hover:bg-[#00c2e8] sm:hover:text-white transition-colors" 
  };

  if (u.includes("youtube") || u.includes("youtu.be")) return { icon: Youtube, ...style };
  if (u.endsWith(".mp4") || u.endsWith(".mov") || u.includes("vimeo")) return { icon: Video, ...style };
  if (u.endsWith(".pdf")) return { icon: FileText, ...style };
  if (u.match(/\.(jpg|jpeg|png|gif|webp)$/)) return { icon: ImageIcon, ...style };
  return { icon: Link2, ...style };
}

/* === 1. スタッフフィルター === */
export function StaffFilter({ assignees, slug }: { assignees: string[], slug: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const searchParams = useSearchParams();
  
  const currentTags = searchParams.get("t")?.split(",") || [];

  const createToggleUrl = (name: string) => {
    const newTags = currentTags.includes(name)
      ? currentTags.filter(t => t !== name)
      : [...currentTags, name];
    
    return newTags.length > 0
      ? `/e/${slug}?t=${encodeURIComponent(newTags.join(","))}`
      : `/e/${slug}`;
  };

  const activeCount = assignees.filter(a => currentTags.includes(a)).length;

  return (
    <div className="relative shrink-0 flex items-center">
      <div className="w-px h-6 bg-slate-200 mx-2"></div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm active:scale-95 relative
          ${activeCount > 0 ? "bg-indigo-500 text-white shadow-indigo-200" : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50"}
        `}
      >
        <Users className="w-5 h-5" />
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border border-white">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
            <div className="text-[10px] font-bold text-slate-400 px-2 py-1 mb-1">担当者で絞り込み</div>
            <div className="flex flex-col gap-1 max-h-60 overflow-y-auto no-scrollbar">
              {assignees.map((name) => {
                const isActive = currentTags.includes(name);
                return (
                  <Link
                    key={name}
                    href={createToggleUrl(name)}
                    scroll={false}
                    onClick={() => setIsOpen(false)}
                    className={`
                      px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors
                      ${isActive ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-50 text-slate-600"}
                    `}
                  >
                    <User className="w-3.5 h-3.5 opacity-70" />
                    {name}
                    {isActive && <div className="ml-auto w-2 h-2 bg-indigo-500 rounded-full"></div>}
                  </Link>
                );
              })}
              {assignees.length === 0 && (
                <div className="text-center py-4 text-xs text-slate-300">担当者設定なし</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* === 2. 資料アコーディオン === */
export function MaterialsAccordion({ materials }: { materials: any[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="bg-white rounded-[1.5rem] shadow-sm border border-slate-50 overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#00c2e8]" />
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-wider">配布資料・リンク</h2>
          <span className="bg-[#00c2e8] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-1">
            {materials.length}
          </span>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
      </button>

      <div 
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <div className="p-4 pt-0 grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div className="h-2 col-span-full"></div>
             {materials.map((m) => {
               const { icon: Icon, color, bg } = getMaterialInfo(m.url);
               return (
                 <a 
                   key={m.id} 
                   href={m.url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-100 sm:hover:border-cyan-200 sm:hover:shadow-md active:scale-95 transition-all group"
                 >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                       <Icon className={`w-4 h-4 transition-colors ${color} group-hover:text-white`} />
                    </div>
                    <div className="min-w-0 flex-1">
                       <div className="text-sm font-black text-slate-700 truncate leading-tight sm:group-hover:text-[#00c2e8] transition-colors">
                         {m.title}
                       </div>
                    </div>
                 </a>
               );
             })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* === 3. 緊急連絡先ボタン (Portal対応・赤色に戻す) === */
export function EmergencyAction({ contacts }: { contacts: { name: string, tel: string, role: string }[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!contacts || contacts.length === 0) return null;

  return (
    <>
      {/* ボタン: 赤色・AlertCircleに戻す */}
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 bg-red-50 text-red-500 px-3 py-1.5 rounded-full text-[10px] font-black hover:bg-red-100 active:scale-95 transition-all border border-red-100"
      >
        <AlertCircle className="w-3.5 h-3.5" />
        緊急連絡先
      </button>

      {/* ポップアップ: Portalで最前面表示 */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsOpen(false)}></div>
          <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl p-6 animate-in fade-in zoom-in-95 duration-200">
             <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800">緊急連絡先</h3>
                <p className="text-xs text-slate-400 mt-1">タップして発信できます</p>
             </div>
             
             <div className="space-y-3">
               {contacts.map((c, i) => (
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

             <button 
               onClick={() => setIsOpen(false)}
               className="mt-6 w-full py-4 rounded-xl text-sm font-bold text-slate-400 hover:bg-slate-50 transition-colors"
             >
               閉じる
             </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}