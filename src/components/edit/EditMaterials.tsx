"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
// ▼ ChevronDown, ChevronUp を追加
import { Link2, Plus, RefreshCw, Edit3, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { getMaterialInfo } from "@/lib/editUtils";

type Props = {
  eventId: string;
  materials: any[];
  onUpdate: () => void;
  setStatus: (s: string) => void;
};

export default function EditMaterials({ eventId, materials, onUpdate, setStatus }: Props) {
  const [matTitle, setMatTitle] = useState("");
  const [matUrl, setMatUrl] = useState("");
  const [matLoading, setMatLoading] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  
  // ★追加: 開閉状態 (デフォルトは false = 閉じておく、 true = 開いておく)
  const [isOpen, setIsOpen] = useState(false);

  function startEditMaterial(m: any) {
    setEditingMaterialId(m.id);
    setMatTitle(m.title);
    setMatUrl(m.url);
    setIsOpen(true); // 編集ボタンを押したら自動で開くようにすると親切
  }

  function cancelEditMaterial() {
    setEditingMaterialId(null);
    setMatTitle("");
    setMatUrl("");
  }

  async function updateMaterial() {
    if (!matTitle.trim() || !matUrl.trim() || !editingMaterialId) return;
    setMatLoading(true);
    const { error } = await supabase.from("event_materials").update({
      title: matTitle.trim(),
      url: matUrl.trim()
    }).eq("id", editingMaterialId);
    setMatLoading(false);
    if (error) {
       setStatus("エラー: " + error.message);
    } else {
       cancelEditMaterial();
       onUpdate();
       setStatus("リンクを更新しました");
       setTimeout(() => setStatus(""), 2000);
    }
  }

  async function addMaterial() {
    if (!matTitle.trim() || !matUrl.trim()) return;
    setMatLoading(true);
    const { error } = await supabase.from("event_materials").insert({
      event_id: eventId,
      title: matTitle.trim(),
      url: matUrl.trim(),
      sort_order: materials.length + 1
    });
    setMatLoading(false);
    if (error) {
       setStatus("エラー: " + error.message);
    } else {
       setMatTitle("");
       setMatUrl("");
       onUpdate();
    }
  }

  async function removeMaterial(id: number) {
    if (!confirm("このリンクを削除しますか？")) return;
    const { error } = await supabase.from("event_materials").delete().eq("id", id);
    if (error) {
      setStatus("削除エラー");
    } else {
      if (editingMaterialId === id) cancelEditMaterial();
      onUpdate();
    }
  }

  return (
    <section className="bg-white rounded-[1.5rem] shadow-sm border border-slate-50 overflow-hidden">
      {/* ▼ ヘッダーをクリック可能に変更 */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100 transition-colors"
      >
         <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-[#00c2e8]" />
            <h3 className="text-sm font-black text-slate-700">資料リンク管理</h3>
         </div>
         <div className="flex items-center gap-2">
            <div className="text-[10px] font-bold text-slate-400">{materials.length}件</div>
            {/* 矢印アイコン */}
            {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
         </div>
      </button>
      
      {/* ▼ 開閉エリア (isOpenがtrueの時だけ表示) */}
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? "block" : "hidden"}`}>
        <div className="p-4 bg-white space-y-3">
           <div className="space-y-2">
              <input type="text" value={matTitle} onChange={(e) => setMatTitle(e.target.value)} placeholder="タイトル (例: 進行表)" className="w-full h-10 px-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-100 transition-all border border-transparent focus:border-cyan-100"/>
              <input type="text" value={matUrl} onChange={(e) => setMatUrl(e.target.value)} placeholder="URL (https://...)" className="w-full h-10 px-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-100 transition-all border border-transparent focus:border-cyan-100"/>
           </div>
           {editingMaterialId ? (
             <div className="flex gap-2">
                <button onClick={cancelEditMaterial} className="flex-1 h-10 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">キャンセル</button>
                <button onClick={updateMaterial} disabled={!matTitle || !matUrl || matLoading} className="flex-[2] h-10 bg-[#00c2e8] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-cyan-500 disabled:opacity-50 transition-all">{matLoading ? "更新中" : <><RefreshCw className="w-3.5 h-3.5" /> 保存</>}</button>
             </div>
           ) : (
             <button onClick={addMaterial} disabled={!matTitle || !matUrl || matLoading} className="w-full h-10 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-black disabled:opacity-50 transition-all shadow-sm">{matLoading ? "追加中..." : <><Plus className="w-3.5 h-3.5" /> 新規追加</>}</button>
           )}
        </div>

        <div className="bg-slate-50/50 p-2 space-y-1 border-t border-slate-100 min-h-[50px]">
           {materials.length > 0 ? materials.map(m => {
              const { icon: Icon, color, bg } = getMaterialInfo(m.url);
              const isEditing = editingMaterialId === m.id;
              return (
                <div key={m.id} className={`flex items-center justify-between p-2.5 rounded-xl transition-all group bg-white border ${isEditing ? "border-[#00c2e8] shadow-sm" : "border-slate-100 sm:hover:border-slate-300"}`}>
                   <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
                      <div className="min-w-0">
                         <div className={`text-xs font-bold truncate ${isEditing ? "text-[#00c2e8]" : "text-slate-800"}`}>{m.title}</div>
                         <div className="text-[10px] text-slate-400 truncate opacity-70">{m.url}</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-1 shrink-0">
                     <button onClick={() => startEditMaterial(m)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#00c2e8] hover:bg-cyan-50 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                     <button onClick={() => removeMaterial(m.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                   </div>
                </div>
              );
           }) : (
              <div className="flex flex-col items-center justify-center py-4 text-slate-300 gap-1"><Link2 className="w-5 h-5 opacity-50"/><span className="text-[10px] font-bold">リンクなし</span></div>
           )}
        </div>
      </div>
    </section>
  );
}