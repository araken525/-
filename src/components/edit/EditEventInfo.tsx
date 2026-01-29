"use client";

import { useState } from "react";
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
  
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    venue_name: ""
  });

  // 編集モード開始
  function startEdit() {
    setFormData({
      title: event.title || "",
      date: event.date || "", // YYYY-MM-DD形式を想定
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
      onUpdate(); // 親に再読み込みを依頼
      setTimeout(() => setStatus(""), 2000);
    }
  }

  return (
    <section className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-slate-400">
          <LayoutDashboard className="w-4 h-4"/>
          <span className="text-xs font-bold">基本情報</span>
        </div>
        {!isEditing && (
          <button 
            onClick={startEdit}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-[#00c2e8] hover:bg-cyan-50 transition-all"
            title="編集"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        )}
      </div>

      {isEditing ? (
        // === 編集モード ===
        <div className="space-y-4 animate-in fade-in duration-200">
          <div>
            <label className="text-[10px] font-bold text-slate-400 block mb-1">イベント名</label>
            <input 
              type="text" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-800 outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-200 transition-all"
              placeholder="イベント名"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">開催日</label>
              <input 
                type="date" 
                value={formData.date} 
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-200 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">場所</label>
              <input 
                type="text" 
                value={formData.venue_name} 
                onChange={(e) => setFormData({...formData, venue_name: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-cyan-100 focus:border-cyan-200 transition-all"
                placeholder="未設定"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="flex-1 h-10 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-1"
            >
              <X className="w-4 h-4" /> キャンセル
            </button>
            <button 
              onClick={save}
              disabled={loading || !formData.title || !formData.date}
              className="flex-1 h-10 bg-[#00c2e8] text-white rounded-xl text-xs font-bold hover:bg-cyan-500 disabled:opacity-50 transition-all flex items-center justify-center gap-1 shadow-sm shadow-cyan-100"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> 保存</>}
            </button>
          </div>
        </div>
      ) : (
        // === 表示モード ===
        <div className="animate-in fade-in duration-200">
          <h1 className="text-xl font-black text-slate-800 leading-tight mb-4">{event.title}</h1>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0"/>
              {event.date}
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-50 p-2.5 rounded-xl">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0"/>
              {event.venue_name || "未設定"}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}