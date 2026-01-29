"use client";

import { supabase } from "@/lib/supabaseClient";
import { Clock, MapPin, Edit3, Trash2, Paperclip, User } from "lucide-react";
import { hhmm, detectEmoji, getDuration, getTargetColor } from "@/lib/editUtils";

type Props = {
  items: any[];
  materials: any[];
  onEdit: (item: any) => void;
  onDelete: () => void;
  setStatus: (s: string) => void;
};

export default function EditScheduleList({ items, materials, onEdit, onDelete, setStatus }: Props) {

  async function removeItem(id: string) {
    if (!confirm("本当に削除しますか？")) return;
    const { error } = await supabase.from("schedule_items").delete().eq("id", id);
    if (error) return setStatus("エラー: " + error.message);
    onDelete(); 
    setStatus("削除しました"); 
    setTimeout(() => setStatus(""), 2000);
  }

  return (
    <section className="space-y-4 md:col-span-8 pb-32">
      <div className="flex items-center justify-between mb-4 px-1">
         <span className="text-xs font-bold text-slate-400">スケジュール ({items.length}件)</span>
      </div>
      
      {items.map((it) => {
         const badgeColor = getTargetColor(it.target);
         const emoji = it.emoji || detectEmoji(it.title);
         const duration = getDuration(it.start_time, it.end_time);
         const displayTarget = it.target && it.target !== "all" ? it.target.replace(/,/g, "・") : "全員";
         const displayAssignee = it.assignee ? it.assignee.replace(/,/g, ", ") : null;
         
         const currentMaterialIds = it.material_ids ? it.material_ids.split(",") : [];
         const validCount = currentMaterialIds.filter((id: string) => materials.some(m => String(m.id) === id)).length;
         
         return (
          <div key={it.id} className="relative bg-white rounded-[1.5rem] p-5 flex gap-5 items-stretch shadow-sm border border-slate-100 sm:hover:border-slate-300 transition-all group">
            <div className="flex flex-col items-center shrink-0 space-y-2 pt-1">
               <div className="text-lg font-black text-slate-800 leading-none">{hhmm(it.start_time)}</div>
               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">{emoji}</div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center py-1 pr-12">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                 <h3 className="text-lg font-black leading-tight text-slate-900">{it.title}</h3>
                 <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${badgeColor}`}>{displayTarget}</span>
              </div>
              
              {it.end_time && (
                 <div className="flex items-center text-xs font-bold text-[#00c2e8] mb-2 bg-cyan-50 w-fit px-2 py-0.5 rounded-lg">
                    <Clock className="w-3 h-3 mr-1"/>~{hhmm(it.end_time)}
                 </div>
              )}
              
              {it.note && <div className="text-xs text-slate-600 leading-relaxed font-medium mb-3 line-clamp-2">{it.note}</div>}
              
              <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
                 {it.location && <div className="flex items-center bg-slate-50 px-2 py-1 rounded-md"><MapPin className="w-3 h-3 mr-1 text-slate-300"/>{it.location}</div>}
                 {displayAssignee && (
                    <div className="flex items-center bg-indigo-50 text-indigo-500 px-2 py-1 rounded-md">
                       <User className="w-3 h-3 mr-1" />{displayAssignee}
                    </div>
                 )}
                 {duration && <div className="bg-slate-50 px-2 py-1 rounded-md">⏳ {duration}</div>}
                 {validCount > 0 && (
                    <div className="flex items-center text-[#00c2e8] bg-cyan-50 px-2 py-1 rounded-md">
                      <Paperclip className="w-3 h-3 mr-1"/>{validCount}件
                    </div>
                 )}
              </div>
            </div>

            <div className="absolute top-4 right-4 flex flex-col gap-2">
               <button onClick={() => onEdit(it)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-[#00c2e8] hover:bg-cyan-50 flex items-center justify-center transition-all shadow-sm active:scale-95" title="編集">
                  <Edit3 className="w-4 h-4"/>
               </button>
               <button onClick={() => removeItem(it.id)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all shadow-sm active:scale-95" title="削除">
                  <Trash2 className="w-4 h-4"/>
               </button>
            </div>
          </div>
         );
      })}
      {items.length === 0 && <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-300 font-bold">まだ予定がありません</div>}
    </section>
  );
}