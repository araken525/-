"use client";

import { useState } from "react";
// ★変更: Link2 を FolderOpen に変更
import { FolderOpen, X, FileText, Youtube, Video, Image as ImageIcon, Link as LinkIcon } from "lucide-react";

type Props = {
  materials: any[];
};

function getMaterialIcon(url: string) {
  const u = url.toLowerCase();
  if (u.includes("youtube") || u.includes("youtu.be")) return Youtube;
  if (u.endsWith(".mp4") || u.endsWith(".mov") || u.includes("vimeo")) return Video;
  if (u.endsWith(".pdf")) return FileText;
  if (u.match(/\.(jpg|jpeg|png|gif|webp)$/)) return ImageIcon;
  return LinkIcon;
}

export default function FloatingMaterials({ materials }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // 資料がない場合は何も表示しない
  if (!materials || materials.length === 0) return null;

  return (
    <>
      {/* トリガーボタン */}
      <div className="relative z-10">
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-white text-slate-600 rounded-full shadow-xl shadow-slate-200/50 flex items-center justify-center transition-all active:scale-90 border border-slate-50 hover:text-[#00c2e8]"
        >
          {/* ★変更: アイコンをフォルダに変更 */}
          <FolderOpen className="w-6 h-6" />
        </button>

        {/* ★追加: 資料の数を知らせる赤いバッジ */}
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm border-2 border-white pointer-events-none animate-in zoom-in duration-300">
          {materials.length}
        </span>
      </div>

      {/* メニュー (変更なし) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity pointer-events-auto"
            onClick={() => setIsOpen(false)}
          ></div>

          <div className="relative w-full max-w-md bg-white rounded-t-[2rem] shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-10 duration-300 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {/* ここもフォルダアイコンに合わせて変更 */}
                <FolderOpen className="w-5 h-5 text-[#00c2e8]" />
                <h3 className="text-lg font-black text-slate-800">配布資料・リンク</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-3 pb-12">
               <div className="text-xs font-bold text-slate-400 mb-2">リンク一覧 ({materials.length}件)</div>
               <div className="grid grid-cols-1 gap-3">
                  {materials.map((m) => {
                    const Icon = getMaterialIcon(m.url);
                    return (
                      <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 hover:border-cyan-200 hover:bg-cyan-50 transition-all group shadow-sm">
                         <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0 group-hover:bg-[#00c2e8] transition-colors">
                            <Icon className="w-5 h-5 text-[#00c2e8] group-hover:text-white transition-colors" />
                         </div>
                         <div className="min-w-0">
                           <div className="text-sm font-black text-slate-700 group-hover:text-[#00c2e8] transition-colors">{m.title}</div>
                           <div className="text-[10px] text-slate-400 truncate opacity-70 mt-0.5">{m.url}</div>
                         </div>
                      </a>
                    );
                  })}
               </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}