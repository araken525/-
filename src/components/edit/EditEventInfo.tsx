"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabaseClient";
import { LayoutDashboard, Calendar, MapPin, Edit3, Save, X, Loader2 } from "lucide-react";

type Props = {
  event: any;
  onUpdate: () => void;
  setStatus: (s: string) => void;
};

export default function EditEventInfo({ event, onUpdate, setStatus }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    venue_name: ""
  });

  // クライアントサイドでのマウント確認 (Portal用)
  useEffect(() => {
    setMounted(true);
  }, []);

  // 編集モード開始
  function startEdit() {
    setFormData({
      title: event.title || "",
      date: event.date || "", 
      venue_name: event.venue_name || ""
    });
    setIsEditing(true);
  }

  // 保存処理
  async function save() {
    if (!formData.title.trim() || !formData.date) return;
    
    setLoading(true);
    const { error } = await supabase
      .from("events")
      .update({
        title: formData.title.trim(),
        date: formData.date,
        venue_name: formData.venue_name.trim()
      })
      .eq("id", event.id);
    
    setLoading(false);

    if (error) {
      setStatus("エラー: " + error.message);
    } else {
      setStatus("基本情報を更新しました");
      setIsEditing(false);
      onUpdate();
      setTimeout(() => setStatus(""), 2000);
    }
  }

  return (
    <>
      {/* === 表示用カード (常に表示) === */}
      <section className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-50 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-slate-400">
            <LayoutDashboard className="w-4 h-4"/>
            <span className="text-xs font-bold">基本情報</span>
          </div>
          <button 
            onClick={startEdit}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-[#00c2e8] hover:bg-cyan-50 transition-all"
            title="編集"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        <h1 className="text-xl font-black text-slate-800 leading-tight mb-4">{event.title}</h1>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-50 p-3 rounded-xl">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0"/>
            {event.date}
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-50 p-3 rounded-xl">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0"/>
            {event.venue_name || "未設定"}
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-50">
          <p className="text-[10px] text-slate-400 leading-relaxed opacity-60">
             ※ タイトルと日付はイベントの核となる情報です。変更の際はご注意ください。
          </p>
        </div>
      </section>

      {/* === 編集用モーダル (Portalで最前面に表示) === */}
      {isEditing && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4">
          {/* 背景 (クリックで閉じる) */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setIsEditing(false)}
          ></div>
          
          {/* モーダル本体 */}
          <div className="relative w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black text-slate-800">基本情報の編集</h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5 ml-1">イベント名</label>
                <input 
                  type="text" 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-base font-bold text-slate-800 outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-all placeholder:text-slate-300"
                  placeholder="例: 第5回 定期演奏会"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5 ml-1">開催日</label>
                  <input 
                    type="date" 
                    value={formData.date} 
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1.5 ml-1">場所</label>
                  <input 
                    type="text" 
                    value={formData.venue_name} 
                    onChange={(e) => setFormData({...formData, venue_name: e.target.value})}
                    className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-300 transition-all placeholder:text-slate-300"
                    placeholder="例: 市民ホール 大ホール"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8">
              <button 
                onClick={save}
                disabled={loading || !formData.title || !formData.date}
                className="w-full h-14 bg-[#00c2e8] text-white rounded-2xl text-sm font-black hover:bg-cyan-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-200/50 active:scale-95"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> 保存して閉じる</>}
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}
    </>
  );
}