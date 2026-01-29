"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Clock, ArrowRight, Check, Edit3, Users, MapPin, AlignLeft, Paperclip, Settings, ChevronUp, ChevronDown, ArrowUp, Minus, ArrowDown, RefreshCw, Save, XCircle } from "lucide-react";
import { detectEmoji, hhmm, getMaterialInfo, EMOJI_PRESETS } from "@/lib/editUtils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any; // 編集中のアイテム（なければnull）
  eventId: string;
  materials: any[];
  onSaved: () => void; // 保存完了時のコールバック
  setStatus: (s: string) => void;
  // 親から渡される入力候補
  recentTags: string[];
  recentAssignees: string[];
  // 親のリストを更新するためのコールバック（リネーム用）
  onReload: () => void;
  allItems: any[]; // リネーム用
};

export default function EditItemSheet({ 
  isOpen, onClose, editingItem, eventId, materials, onSaved, setStatus,
  recentTags, recentAssignees, onReload, allItems
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    startTime: "10:00", endTime: "", title: "", location: "", note: "", 
    target: "全員", assignee: "",
    emoji: "🎵", sortOrder: 0, materialIds: [] as string[]
  });

  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isTagEditMode, setIsTagEditMode] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [newAssigneeInput, setNewAssigneeInput] = useState("");

  // シートが開いた時 or 編集アイテムが変わった時の初期化
  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setFormData({
          startTime: hhmm(editingItem.start_time), 
          endTime: editingItem.end_time ? hhmm(editingItem.end_time) : "",
          title: editingItem.title ?? "", 
          location: editingItem.location ?? "", 
          note: editingItem.note ?? "",
          target: editingItem.target ?? "全員", 
          assignee: editingItem.assignee ?? "", 
          emoji: editingItem.emoji || detectEmoji(editingItem.title || ""), 
          sortOrder: editingItem.sort_order ?? 0,
          materialIds: editingItem.material_ids ? editingItem.material_ids.split(",") : []
        });
      } else {
        // 新規作成
        setFormData({ 
          startTime: "10:00", endTime: "", title: "", location: "", note: "", 
          target: "全員", assignee: "",
          emoji: "🎵", sortOrder: 0, materialIds: []
        }); 
      }
      setNewTagInput("");
      setNewAssigneeInput("");
      setIsSortOpen(false);
      setIsTagEditMode(false);
    }
  }, [isOpen, editingItem]);

  // 絵文字の自動推測
  useEffect(() => {
    if (!editingItem && formData.title) {
      const detected = detectEmoji(formData.title);
      if (formData.emoji === "🎵" || EMOJI_PRESETS.includes(formData.emoji)) {
         if (detected !== "🎵") setFormData(prev => ({ ...prev, emoji: detected }));
      }
    }
  }, [formData.title]);

  // 外側クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) onClose();
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // --- 各種操作ロジック ---

  function toggleTag(tag: string) {
    if (isTagEditMode) {
      if(tag === "全員") return;
      const newName = prompt(`「${tag}」の名前を変更しますか？\n(過去のデータも全て書き換わります)`, tag);
      if(newName && newName !== tag) {
        renameTagGlobally(tag, newName);
      }
      return;
    }

    if (tag === "全員") {
      setFormData({ ...formData, target: "全員" });
      return;
    }
    let currentTags = formData.target ? formData.target.split(",").map(t => t.trim()).filter(Boolean) : [];
    if (currentTags.includes("全員")) currentTags = [];
    if (currentTags.includes(tag)) {
      currentTags = currentTags.filter(t => t !== tag);
    } else {
      currentTags.push(tag);
    }
    const newTarget = currentTags.length === 0 ? "全員" : currentTags.join(",");
    setFormData({ ...formData, target: newTarget });
  }

  async function renameTagGlobally(oldName: string, newName: string) {
    if (!confirm(`本当に「${oldName}」を「${newName}」に変更しますか？\nこれは全てのスケジュールに反映されます。`)) return;
    setStatus("タグ名を変更中...");
    
    const targetsToUpdate = allItems.filter(it => {
       const tags = it.target ? it.target.split(",").map((t: string) => t.trim()) : [];
       return tags.includes(oldName);
    });

    for (const item of targetsToUpdate) {
       const oldTags = item.target.split(",").map((t: string) => t.trim());
       const newTags = oldTags.map((t: string) => t === oldName ? newName : t).join(",");
       await supabase.from("schedule_items").update({ target: newTags }).eq("id", item.id);
    }

    // フォーム上の表示も更新
    if(formData.target.includes(oldName)) {
       const currentFormTags = formData.target.split(",").map(t => t.trim());
       const newFormTags = currentFormTags.map(t => t === oldName ? newName : t).join(",");
       setFormData(prev => ({ ...prev, target: newFormTags }));
    }

    setStatus("変更完了");
    onReload();
    setTimeout(() => setStatus(""), 2000);
  }

  function toggleAssignee(name: string) {
    let current = formData.assignee ? formData.assignee.split(",").map(t => t.trim()).filter(Boolean) : [];
    if (current.includes(name)) {
      current = current.filter(t => t !== name);
    } else {
      current.push(name);
    }
    setFormData({ ...formData, assignee: current.join(",") });
  }

  function toggleMaterialLink(matId: number) {
    const idStr = String(matId);
    let currentIds = [...formData.materialIds];
    if (currentIds.includes(idStr)) {
      currentIds = currentIds.filter(id => id !== idStr);
    } else {
      currentIds.push(idStr);
    }
    setFormData({ ...formData, materialIds: currentIds });
  }

  async function saveItem() {
    if (!eventId) return setStatus("イベント不明");
    if (!formData.title.trim()) return setStatus("タイトル必須");
    const payload = {
      event_id: eventId, 
      start_time: formData.startTime + ":00", 
      end_time: formData.endTime ? formData.endTime + ":00" : null,
      title: formData.title.trim(), 
      location: formData.location.trim() || null, 
      note: formData.note.trim() || null,
      target: formData.target.trim() || "全員", 
      assignee: formData.assignee.trim() || null, 
      emoji: formData.emoji || "🎵", 
      sort_order: formData.sortOrder,
      material_ids: formData.materialIds.length > 0 ? formData.materialIds.join(",") : null
    };
    
    setStatus(editingItem ? "更新中..." : "追加中...");
    const res = editingItem
      ? await supabase.from("schedule_items").update(payload).eq("id", editingItem.id)
      : await supabase.from("schedule_items").insert(payload);
    
    if (res.error) return setStatus("エラー: " + res.error.message);
    
    setStatus(editingItem ? "更新しました" : "追加しました");
    onSaved(); // 親に通知して閉じる
    setTimeout(() => setStatus(""), 2000);
  }

  // --- 表示 ---
  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center pointer-events-none ${isOpen ? "visible" : "invisible"}`}>
       <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0"}`} onClick={onClose}></div>
       
       <div ref={sheetRef} className={`relative w-full max-w-lg bg-white rounded-t-[2.5rem] shadow-2xl pointer-events-auto transition-transform duration-300 ease-out flex flex-col max-h-[95vh] ${isOpen ? "translate-y-0" : "translate-y-full"}`}>
          <div className="shrink-0 relative h-12 flex items-center justify-center cursor-pointer" onClick={onClose}>
             <div className="w-12 h-1.5 bg-slate-200 rounded-full absolute top-4"></div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-0 space-y-8 no-scrollbar">
             {/* 1. タイトルセクション */}
             <div className="space-y-4">
                <div className="flex items-start gap-4">
                   <div className="w-20 h-20 shrink-0 bg-slate-50 rounded-2xl flex items-center justify-center relative shadow-inner border border-slate-100">
                      <input type="text" value={formData.emoji} onChange={(e)=>setFormData({...formData, emoji:e.target.value})} className="w-full h-full bg-transparent text-center text-5xl outline-none p-0 appearance-none" placeholder="🎵"/>
                   </div>
                   <div className="flex-1 pt-1">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">タイトル</label>
                      <input type="text" value={formData.title} onChange={(e)=>setFormData({...formData, title:e.target.value})} placeholder="練習, 移動, 本番..." className="w-full bg-transparent text-2xl font-black placeholder:text-slate-200 outline-none border-b-2 border-slate-100 focus:border-[#00c2e8] transition-colors py-1 text-slate-800 appearance-none rounded-none"/>
                   </div>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 mask-linear">
                   {EMOJI_PRESETS.map((emoji) => (
                      <button key={emoji} onClick={() => setFormData({...formData, emoji})} className={`shrink-0 w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${formData.emoji === emoji ? "bg-cyan-50 text-[#00c2e8] scale-110 shadow-sm border border-cyan-100" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}>{emoji}</button>
                   ))}
                </div>
             </div>

             {/* 2. タイムブロック */}
             <div className="bg-slate-50 p-4 rounded-3xl space-y-4 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                   <Clock className="w-4 h-4 text-[#00c2e8]"/>
                   <span className="text-xs font-bold text-slate-500">時間設定</span>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 text-center">開始</label>
                      <input type="time" value={formData.startTime} onChange={(e)=>setFormData({...formData, startTime:e.target.value})} className="w-full h-14 bg-white border border-slate-200 rounded-xl text-2xl font-black text-center outline-none shadow-sm focus:ring-2 focus:ring-cyan-100 focus:border-cyan-200 transition-all text-slate-800 appearance-none"/>
                   </div>
                   <div className="text-slate-300 pt-4"><ArrowRight className="w-6 h-6"/></div>
                   <div className="flex-1 relative">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 text-center">終了</label>
                      <div className="relative w-full h-14">
                         <input type="time" value={formData.endTime} onChange={(e)=>setFormData({...formData, endTime:e.target.value})} className={`w-full h-full bg-white border border-slate-200 rounded-xl text-2xl font-black text-center outline-none shadow-sm focus:ring-2 focus:ring-cyan-100 focus:border-cyan-200 transition-all appearance-none ${!formData.endTime ? 'text-transparent' : 'text-slate-800'}`}/>
                         {!formData.endTime && <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-2xl font-black pointer-events-none tracking-widest">--:--</div>}
                      </div>
                      {formData.endTime && <button onClick={() => setFormData({...formData, endTime: ""})} className="absolute -top-2 -right-2 w-6 h-6 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm z-10"><X className="w-3 h-3"/></button>}
                   </div>
                </div>
             </div>

             {/* 3. 詳細情報 */}
             <div className="space-y-4">
                
                {/* 対象タグ */}
                <div>
                   <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-400 block">対象タグ</label>
                      <button onClick={() => setIsTagEditMode(!isTagEditMode)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 ${isTagEditMode ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-400"}`}>{isTagEditMode ? "完了" : "編集"}</button>
                   </div>
                   
                   <div className="flex flex-wrap gap-2">
                      <button onClick={() => toggleTag("全員")} className={`h-9 px-4 rounded-full font-bold text-xs flex items-center gap-1 transition-all ${(formData.target === "全員" || !formData.target) ? "bg-[#00c2e8] text-white shadow-md shadow-cyan-200" : "bg-slate-100 text-slate-500"} ${isTagEditMode ? "opacity-50 pointer-events-none" : ""}`}>
                         {(formData.target === "全員" || !formData.target) && <Check className="w-3 h-3"/>} 全員
                      </button>
                      
                      {recentTags.filter(t => t !== "全員").map(t => {
                         const currentList = formData.target ? formData.target.split(",").map(x => x.trim()) : [];
                         const isActive = currentList.includes(t);
                         return (
                            <button key={t} onClick={() => isTagEditMode ? toggleTag(t) : toggleTag(t)} className={`h-9 px-3 rounded-full font-bold text-xs transition-all flex items-center gap-1 relative ${isTagEditMode ? "bg-red-50 text-red-500 border border-red-100 pr-8 animate-pulse-slow" : isActive ? "bg-cyan-50 text-[#00c2e8] border border-cyan-200" : "bg-white border border-slate-200 text-slate-500"}`}>
                               {(!isTagEditMode && isActive) && <Check className="w-3 h-3"/>} 
                               {t}
                               {isTagEditMode && <div className="absolute right-1 top-1/2 -translate-y-1/2"><XCircle className="w-4 h-4 fill-red-200 text-red-500" /></div>}
                            </button>
                         )
                      })}
                   </div>
                   
                   {!isTagEditMode && (
                      <div className="flex gap-2 mt-3">
                         <input type="text" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} placeholder="新しいタグ..." className="flex-1 h-9 bg-slate-50 rounded-lg px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-100 appearance-none"/>
                         {/* 単純に追加するだけなので、親のリストに追加したいが…今回は簡易的に入力欄クリア＋State反映のみ。次回保存時に反映される */}
                         <button onClick={() => {if(newTagInput.trim()){ toggleTag(newTagInput.trim()); setNewTagInput("") }}} disabled={!newTagInput.trim()} className="h-9 px-3 bg-slate-800 text-white rounded-lg text-xs font-bold disabled:opacity-50">追加</button>
                      </div>
                   )}
                </div>

                {/* 担当スタッフ */}
                <div className="pt-2 border-t border-slate-50">
                   <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-indigo-400"/>
                      <label className="text-[10px] font-bold text-slate-400 block">担当スタッフ (任意)</label>
                   </div>
                   <div className="flex flex-wrap gap-2 mb-3">
                      {recentAssignees.map(a => {
                         const current = formData.assignee ? formData.assignee.split(",").map(x => x.trim()) : [];
                         const isActive = current.includes(a);
                         return (
                            <button key={a} onClick={() => toggleAssignee(a)} className={`h-8 px-3 rounded-lg font-bold text-xs flex items-center gap-1 border transition-all ${isActive ? "bg-indigo-50 border-indigo-200 text-indigo-500" : "bg-white border-slate-200 text-slate-500"}`}>
                               {isActive && <Check className="w-3 h-3"/>}{a}
                            </button>
                         )
                      })}
                   </div>
                   <div className="flex gap-2">
                      <input type="text" value={newAssigneeInput} onChange={(e) => setNewAssigneeInput(e.target.value)} placeholder="担当者名 (例: 田中)" className="flex-1 h-9 bg-slate-50 rounded-lg px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100 appearance-none"/>
                      <button onClick={() => {if(newAssigneeInput.trim()){ toggleAssignee(newAssigneeInput.trim()); setNewAssigneeInput("") }}} disabled={!newAssigneeInput.trim()} className="h-9 px-3 bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50">追加</button>
                   </div>
                </div>

                <div className="space-y-3 pt-2">
                   <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 h-12 border border-slate-100">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0"/>
                      <input type="text" value={formData.location} onChange={(e)=>setFormData({...formData, location:e.target.value})} placeholder="場所 (例: 大ホール)" className="flex-1 bg-transparent text-sm font-bold outline-none text-slate-700 appearance-none"/>
                   </div>
                   <div className="flex items-start gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                      <AlignLeft className="w-4 h-4 text-slate-400 shrink-0 mt-1"/>
                      <textarea value={formData.note} onChange={(e) => { setFormData({ ...formData, note: e.target.value }); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }} placeholder="メモ・備考" className="flex-1 bg-transparent text-sm font-medium outline-none resize-none min-h-[4rem] text-slate-700 appearance-none"></textarea>
                   </div>
                </div>
             </div>
             
             {/* 4. 資料紐付け */}
             {materials.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                   <div className="flex items-center gap-2 px-1 text-slate-400">
                      <Paperclip className="w-4 h-4" />
                      <span className="text-xs font-bold">資料を紐付ける</span>
                   </div>
                   <div className="grid grid-cols-1 gap-2">
                      {materials.map(m => {
                         const isLinked = formData.materialIds.includes(String(m.id));
                         const { icon: Icon, color, bg } = getMaterialInfo(m.url);
                         return (
                            <button key={m.id} onClick={() => toggleMaterialLink(m.id)} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isLinked ? "bg-cyan-50 border-cyan-200 shadow-sm" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                               <div className="flex items-center gap-3 overflow-hidden">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
                                  <span className={`text-xs font-bold truncate ${isLinked ? "text-slate-800" : "text-slate-500"}`}>{m.title}</span>
                               </div>
                               {isLinked ? <div className="w-5 h-5 bg-[#00c2e8] rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white"/></div> : <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>}
                            </button>
                         )
                      })}
                   </div>
                </div>
             )}

             {/* 並び順設定 */}
             <div className="pt-4 border-t border-slate-100">
                <button onClick={() => setIsSortOpen(!isSortOpen)} className="flex items-center justify-between w-full py-2">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Settings className="w-4 h-4" /> 高度な設定・並び順</div>
                   {isSortOpen ? <ChevronUp className="w-4 h-4 text-slate-300"/> : <ChevronDown className="w-4 h-4 text-slate-300"/>}
                </button>
                {isSortOpen && (
                   <div className="flex items-center justify-between gap-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button onClick={() => setFormData({...formData, sortOrder: -10})} className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${formData.sortOrder < 0 ? "bg-cyan-50 border-cyan-200 text-[#00c2e8]" : "bg-white border-slate-100 text-slate-400"}`}><ArrowUp className="w-5 h-5"/><span className="text-[10px] font-black">一番上</span></button>
                      <button onClick={() => setFormData({...formData, sortOrder: 0})} className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${formData.sortOrder === 0 ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-400"}`}><Minus className="w-5 h-5"/><span className="text-[10px] font-black">標準</span></button>
                      <button onClick={() => setFormData({...formData, sortOrder: 10})} className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${formData.sortOrder > 0 ? "bg-orange-50 border-orange-200 text-orange-500" : "bg-white border-slate-100 text-slate-400"}`}><ArrowDown className="w-5 h-5"/><span className="text-[10px] font-black">一番下</span></button>
                   </div>
                )}
             </div>
          </div>

          <div className="shrink-0 p-6 pt-2 bg-white pb-8">
             <button onClick={saveItem} className="w-full h-14 bg-[#00c2e8] rounded-2xl font-black text-white active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-200/50 hover:bg-cyan-400">
                {editingItem ? <><RefreshCw className="w-5 h-5"/> 変更を保存</> : <><Save className="w-5 h-5"/> リストに追加</>}
             </button>
          </div>
       </div>
    </div>
  );
}