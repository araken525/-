"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import { AlertCircle, Plus, Phone, Trash2, X, Loader2, User, ChevronRight, RefreshCw } from "lucide-react";

type Props = {
  eventId: string;
  contacts: any[];
  setContacts: (contacts: any[]) => void;
  setStatus: (s: string) => void;
};

export default function EditEmergencyContacts({ eventId, contacts, setContacts, setStatus }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // フォーム状態
  // editingIndex: nullなら新規追加、数字ならそのインデックスの修正
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({ role: "", name: "", tel: "" });

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- Actions ---

  function openAdd() {
    setEditingIndex(null);
    setFormData({ role: "", name: "", tel: "" });
    setIsOpen(true);
  }

  function openEdit(index: number, c: any) {
    setEditingIndex(index);
    setFormData({ role: c.role || "", name: c.name || "", tel: c.tel || "" });
    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setFormData({ role: "", name: "", tel: "" });
    setEditingIndex(null);
  }

  async function save() {
    if (!formData.name.trim() || !formData.tel.trim()) return;
    setLoading(true);

    let newContacts = [...contacts];

    if (editingIndex !== null) {
      // 既存の修正
      newContacts[editingIndex] = formData;
    } else {
      // 新規追加
      newContacts.push(formData);
    }

    const { error } = await supabase
      .from("events")
      .update({ emergency_contacts: newContacts })
      .eq("id", eventId);

    setLoading(false);

    if (error) {
      setStatus("エラー: " + error.message);
    } else {
      setContacts(newContacts);
      setStatus(editingIndex !== null ? "連絡先を更新しました" : "連絡先を追加しました");
      close();
      setTimeout(() => setStatus(""), 2000);
    }
  }

  async function remove() {
    if (editingIndex === null) return;
    if (!confirm("この連絡先を削除しますか？")) return;

    setLoading(true);
    const newContacts = contacts.filter((_, i) => i !== editingIndex);

    const { error } = await supabase
      .from("events")
      .update({ emergency_contacts: newContacts })
      .eq("id", eventId);

    setLoading(false);

    if (error) {
      setStatus("削除エラー: " + error.message);
    } else {
      setContacts(newContacts);
      setStatus("削除しました");
      close();
      setTimeout(() => setStatus(""), 2000);
    }
  }

  return (
    <>
      {/* === メインリスト表示 === */}
      <section className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-50">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2 text-slate-400">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-bold">緊急連絡先</span>
           </div>
           
           {/* 新規追加ボタン */}
           <button 
             onClick={openAdd}
             className="flex items-center gap-1 bg-slate-50 text-red-500 px-3 py-1.5 rounded-full text-[10px] font-black hover:bg-red-50 transition-all border border-slate-100 active:scale-95"
           >
             <Plus className="w-3.5 h-3.5" /> 追加
           </button>
        </div>

        <div className="space-y-2">
           {contacts.length > 0 ? contacts.map((c, i) => (
             <button 
               key={i} 
               onClick={() => openEdit(i, c)}
               className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50 hover:border-slate-200 transition-all group active:scale-[0.98]"
             >
                <div className="flex items-center gap-3 overflow-hidden">
                   <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-50 text-red-500">
                      <Phone className="w-5 h-5" />
                   </div>
                   <div className="min-w-0 text-left">
                      <div className="text-[10px] font-bold text-slate-400">{c.role}</div>
                      <div className="text-xs font-black text-slate-800 truncate">{c.name}</div>
                      <div className="text-[10px] text-slate-400 truncate opacity-70 font-mono tracking-wide">
                        {c.tel}
                      </div>
                   </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400" />
             </button>
           )) : (
              <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                 <p className="text-xs font-bold text-slate-300">連絡先はまだありません</p>
                 <button onClick={openAdd} className="text-[10px] font-black text-red-400 mt-1 hover:underline">追加する</button>
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
                {editingIndex !== null ? "連絡先の編集" : "連絡先を追加"}
              </h3>
              <button 
                onClick={close}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="flex justify-center mb-2">
                 <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-50 text-red-500">
                    <User className="w-8 h-8" />
                 </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5 ml-1">役割 (任意)</label>
                <input 
                  type="text" 
                  value={formData.role} 
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all placeholder:text-slate-300"
                  placeholder="例: 舞台監督, インスペクター"
                />
              </div>
              
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5 ml-1">お名前</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all placeholder:text-slate-300"
                  placeholder="例: 山田 太郎"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5 ml-1">電話番号</label>
                <input 
                  type="tel" 
                  value={formData.tel} 
                  onChange={(e) => setFormData({...formData, tel: e.target.value})}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-300 transition-all placeholder:text-slate-300 font-mono"
                  placeholder="090-0000-0000"
                />
              </div>
            </div>

            <div className="mt-8 shrink-0 flex flex-col gap-3">
              <button 
                onClick={save}
                disabled={loading || !formData.name || !formData.tel}
                className="w-full h-14 bg-red-500 text-white rounded-2xl text-sm font-black hover:bg-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-200/50 active:scale-95"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><RefreshCw className="w-5 h-5" /> 保存する</>}
              </button>
              
              {editingIndex !== null && (
                 <button 
                   onClick={remove}
                   disabled={loading}
                   className="w-full h-12 bg-white text-red-500 border border-slate-100 rounded-2xl text-xs font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                 >
                   <Trash2 className="w-4 h-4" /> この連絡先を削除
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