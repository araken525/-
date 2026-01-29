"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Clock, MapPin, Edit3, Trash2, Paperclip, 
  User, MoreHorizontal, Calendar, Tag, AlertCircle, 
  StickyNote, Hourglass
} from "lucide-react";
import { hhmm, detectEmoji, getDuration, getTargetColor } from "@/lib/editUtils";

type Props = {
  items: any[];
  materials: any[];
  onEdit: (item: any) => void;
  onDelete: () => void;
  setStatus: (s: string) => void;
};

export default function EditScheduleList({ items, materials, onEdit, onDelete, setStatus }: Props) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  async function removeItem(id: string) {
    if (!confirm("本当に削除しますか？")) return;
    const { error } = await supabase.from("schedule_items").delete().eq("id", id);
    if (error) return setStatus("エラー: " + error.message);
    
    setOpenMenuId(null);
    onDelete(); 
    setStatus("削除しました"); 
    setTimeout(() => setStatus(""), 2000);
  }

  function toggleMenu(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  }

  return (
    <section className="space-y-3 md:col-span-8 pb-32">
      <div className="flex items-center justify-between mb-2 px-1">
         <span className="text-xs font-bold text-slate-400">スケジュール ({items.length}件)</span>
      </div>
      
      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)}></div>
      )}
      
      {items.map((it) => {
         const emoji = it.emoji || detectEmoji(it.title);
         const duration = getDuration(it.start_time, it.end_time);
         
         const tags = it.target && it.target !== "all" 
            ? it.target.split(",").map((t: string) => t.trim()) 
            : ["全員"];
         
         const assignees = it.assignee 
            ? it.assignee.split(",").map((a: string) => a.trim()) 
            : [];
         
         const currentMaterialIds = it.material_ids ? it.material_ids.split(",") : [];
         const validCount = currentMaterialIds.filter((id: string) => materials.some(m => String(m.id) === id)).length;
         
         return (
          <div 
            key={it.id} 
            onClick={() => onEdit(it)}
            // ★修正: active:scaleなどを削除し、静的なカードに変更
            className="relative bg-white rounded-[1.5rem] p-5 flex gap-4 items-start shadow-sm border border-slate-100"
          >
            {/* 左側: 開始時間と絵文字 */}
            <div className="flex flex-col items-center shrink-0 space-y-3 pt-1 w-14">
               <div className="text-lg font-black text-slate-800 leading-none tracking-tight">{hhmm(it.start_time)}</div>
               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-slate-100">{emoji}</div>
            </div>

            {/* 右側: 情報エリア (上から順に配置) */}
            <div className="flex-1 min-w-0 py-0.5 space-y-2">
              
              {/* 1. タイトル */}
              <h3 className="text-lg font-black leading-tight text-slate-900 pr-8">{it.title}</h3>

              {/* 2. 終了時刻 (アイコンのみ・囲いなし) */}
              {it.end_time && (
                 <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-[#00c2e8]"/>
                    <span>~{hhmm(it.end_time)} まで</span>
                 </div>
              )}

              {/* 3. タグ (バッジ表示) */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                 {tags.map((tag: string) => {
                    const colorClass = getTargetColor(tag);
                    return (
                      <span key={tag} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black ${colorClass}`}>
                        <Tag className="w-3 h-3 opacity-50"/> {tag}
                      </span>
                    );
                 })}
              </div>

              {/* 4. メモ (アイコンのみ・囲いなし・省略あり) */}
              {it.note && (
                <div className="flex items-start gap-1.5 text-xs text-slate-500 leading-relaxed font-medium pt-1">
                  <StickyNote className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5"/>
                  <span className="line-clamp-2">{it.note}</span>
                </div>
              )}
              
              {/* 5. 担当スタッフ (バッジ表示) */}
              {assignees.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                   {assignees.map((a: string) => (
                      <span key={a} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-500 px-2.5 py-1 rounded-lg text-[10px] font-black border border-indigo-100">
                         <User className="w-3 h-3"/> {a}
                      </span>
                   ))}
                </div>
              )}

              {/* 6. フッター情報 (場所・添付・時間 / アイコンのみ・囲いなし) */}
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-slate-400 pt-2 mt-1 border-t border-slate-50">
                 {it.location && (
                   <div className="flex items-center gap-1">
                     <MapPin className="w-3.5 h-3.5 text-slate-300"/>{it.location}
                   </div>
                 )}
                 {validCount > 0 && (
                    <div className="flex items-center gap-1 text-[#00c2e8]">
                      <Paperclip className="w-3.5 h-3.5"/>{validCount}件
                    </div>
                 )}
                 {duration && (
                   <div className="flex items-center gap-1">
                     <Hourglass className="w-3.5 h-3.5 text-slate-300"/> {duration}
                   </div>
                 )}
              </div>
            </div>

            {/* 右上メニューボタン */}
            <div className="absolute top-4 right-2 z-20">
               <button 
                 onClick={(e) => toggleMenu(e, it.id)} 
                 className="w-8 h-8 rounded-full text-slate-300 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
               >
                  <MoreHorizontal className="w-5 h-5"/>
               </button>

               {openMenuId === it.id && (
                 <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 p-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-200 z-30">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onEdit(it); setOpenMenuId(null); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg transition-colors text-left"
                    >
                       <Edit3 className="w-3.5 h-3.5"/> 編集する
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeItem(it.id); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors text-left"
                    >
                       <Trash2 className="w-3.5 h-3.5"/> 削除する
                    </button>
                 </div>
               )}
            </div>
          </div>
         );
      })}
      
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-300 gap-4">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 opacity-20"/>
           </div>
           <div className="text-sm font-bold opacity-50">まだ予定がありません</div>
           <div className="text-xs">右下の「＋」ボタンから追加してください</div>
        </div>
      )}
    </section>
  );
}