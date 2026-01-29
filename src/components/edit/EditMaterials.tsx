"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import { Link2, Plus, RefreshCw, Edit3, Trash2, X, Loader2, ExternalLink, ChevronRight } from "lucide-react";
import { getMaterialInfo } from "@/lib/editUtils";

type Props = {
  eventId: string;
  materials: any[];
  onUpdate: () => void;
  setStatus: (s: string) => void;
};

export default function EditMaterials({ eventId, materials, onUpdate, setStatus }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // フォーム状態
  const [editingId, setEditingId] = useState<number | null>(null); // nullなら新規追加
  const [formData, setFormData] = useState({ title: "", url: "" });

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Actions ---

  function openAdd() {
    setEditingId(null);
    setFormData({ title: "", url: "" });
    setIsOpen(true);
  }

  function openEdit(m: any) {
    setEditingId(m.id);
    setFormData({ title: m.title, url: m.url });
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setFormData({ title: "", url: "" });
    setEditingId(null);
  }

  async function save() {
    if (!formData.title.trim() || !formData.url.trim()) return;
    setLoading(true);

    let error;
    if (editingId) {
      // 更新
      const res = await supabase.from("event_materials").update({
        title: formData.title.trim(),
        url: formData.url.trim()
      }).eq("id", editingId);
      error = res.error;
    } else {
      // 新規追加
      const res = await supabase.from("event_materials").insert({
        event_id: eventId,
        title: formData.title.trim(),
        url: formData.url.trim(),
        sort_order: materials.length + 1
      });
      error = res.error;
    }

    setLoading(false);

    if (error) {
      setStatus("エラー: " + error.message);
    } else {
      setStatus(editingId ? "リンクを更新しました" : "リンクを追加しました");
      close();
      onUpdate();
      setTimeout(() => setStatus(""), 2000);
    }
  }

  async function remove() {
    if (!editingId) return;
    if (!confirm("本当に削除しますか？")) return;
    
    setLoading(true);
    const { error } = await supabase.from("event_materials").delete().eq("id", editingId);
    setLoading(false);

    if (error) {
      setStatus("削除エラー: " + error.message);
    } else {
      setStatus("削除しました");
      close();
      onUpdate();
      setTimeout(() => setStatus(""), 2000);
    }
  }

  // URLからアイコン情報を取得（プレビュー用）
  const previewIconInfo = getMaterialInfo(formData.url || "");
  const PreviewIcon = previewIconInfo.icon;

  return (
    <>
      {/* === メインリスト表示 === */}
      <section className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-50">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2 text-slate-400">
              <Link2 className="w-4 h-4" />
              <span className="text-xs font-bold">資料・リンク</span>
           </div>
           
           {/* 新規追加ボタン */}
           <button 
             onClick={openAdd}
             className="flex items-center gap-1 bg-slate-50 text-[#00c2e8] px-3 py-1.5 rounded-full text-[10px] font-black hover:bg-cyan-50 transition-all border border-slate-100 active:scale-95"
           >
             <Plus className="w-3.5 h-3.5" /> 追加
           </button>
        </div>

        <div className="space-y-2">
           {materials.length > 0 ? materials.map(m => {
              const { icon: Icon, bg, color } = getMaterialInfo(m.url);
              return (
                <button 
                  key={m.id} 
                  onClick={() => openEdit(m)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all group active:scale-[0.98]"
                >
                   <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bg}`}>
                         <Icon className={`w-5 h-5 ${color}`} />
                      </div>
                      <div className="min-w-0 text-left">
                         <div className="text-xs font-black text-slate-700 truncate">{m.title}</div>
                         <div className="text-[10px] text-slate-400 truncate opacity-70 flex items-center gap-1">
                           {m.url}
                         </div>
                      </div>
                   </div>
                   <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
                </button>
              );
           }) : (
              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                 <p className="text-xs font-bold text-slate-300">リンクはまだありません</p>
                 <button onClick={openAdd} className="text-[10px] font-black text-[#00c2e8] mt-1 hover:underline">追加する</button>
              </div>
           )}
        </div>
      </section>

      {/* === 追加・編集モーダル (Portal) === */}
      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={close}
          ></div>
          
          <div className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-6 shrink-0">
              <h3 className="text-lg font-black text-slate-800">
                {editingId ? "リンクの編集" : "リンクを追加"}
              </h3>
              <button 
                onClick={close}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* アイコンプレビュー */}
              <div className="flex justify-center mb-2">
                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${previewIconInfo.bg}`}>
                    <PreviewIcon className={`w-8 h-8 ${previewIconInfo.color}`} />
                 </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5 ml-1">タイトル</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-all placeholder:text-slate-300"
                  placeholder="例: 楽譜PDF, YouTube参考音源"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5 ml-1">URL</label>
                <input 
                  type="url" 
                  value={formData.url} 
                  onChange={(e) => setFormData({...formData, url: e.target.value})}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-all placeholder:text-slate-300 font-mono text-xs"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="mt-8 shrink-0 flex flex-col gap-3">
              <button 
                onClick={save}
                disabled={loading || !formData.title || !formData.url}
                className="w-full h-14 bg-[#00c2e8] text-white rounded-2xl text-sm font-black hover:bg-cyan-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-200/50 active:scale-95"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><RefreshCw className="w-5 h-5" /> 保存する</>}
              </button>
              
              {editingId && (
                 <button 
                   onClick={remove}
                   disabled={loading}
                   className="w-full h-12 bg-white text-red-500 border border-slate-100 rounded-2xl text-xs font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                 >
                   <Trash2 className="w-4 h-4" /> このリンクを削除
                 </button>
              )}
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}