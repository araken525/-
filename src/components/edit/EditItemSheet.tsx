"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  X, Clock, ArrowRight, Check, Edit3, Users, MapPin, 
  StickyNote, Tag, Plus, Settings, ChevronUp, ChevronDown, 
  ArrowUp, Minus, ArrowDown, RefreshCw, Save, XCircle, 
  Paperclip, Trash2, Pencil, MoreHorizontal, AlertTriangle
} from "lucide-react";
import { detectEmoji, hhmm, getMaterialInfo, EMOJI_PRESETS } from "@/lib/editUtils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any;
  eventId: string;
  materials: any[];
  onSaved: () => void;
  setStatus: (s: string) => void;
  recentTags: string[];
  recentAssignees: string[];
  onReload: () => void;
  allItems: any[];
};

export default function EditItemSheet({ 
  isOpen, onClose, editingItem, eventId, materials, onSaved, setStatus,
  recentTags, recentAssignees, onReload, allItems
}: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // フォームデータ
  const [formData, setFormData] = useState({
    startTime: "10:00", endTime: "", title: "", location: "", note: "", 
    target: "全員", assignee: "",
    emoji: "🎵", sortOrder: 0, materialIds: [] as string[]
  });

  // UI制御フラグ
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  const [isTagEditMode, setIsTagEditMode] = useState(false);
  const [isAssigneeEditMode, setIsAssigneeEditMode] = useState(false);
  
  // 入力用一時ステート
  const [newTagInput, setNewTagInput] = useState("");
  const [newAssigneeInput, setNewAssigneeInput] = useState("");

  // ★修正1: このセッションで追加された一時的なタグ・担当者を保持するStateを追加
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [localAssignees, setLocalAssignees] = useState<string[]>([]);

  // アクションメニュー用ステート
  const [actionMenu, setActionMenu] = useState<{ type: 'tag' | 'assignee', name: string } | null>(null);

  // --- 初期化 ---
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
        setFormData({ 
          startTime: "10:00", endTime: "", title: "", location: "", note: "", 
          target: "全員", assignee: "",
          emoji: "🎵", sortOrder: 0, materialIds: []
        }); 
      }
      setNewTagInput("");
      setNewAssigneeInput("");
      // ★修正1: モーダルを開くたびに一時リストをリセット
      setLocalTags([]);
      setLocalAssignees([]);
      
      setIsSortOpen(false);
      setIsMaterialsOpen(false);
      setIsTagEditMode(false);
      setIsAssigneeEditMode(false);
      setActionMenu(null);
    }
  }, [isOpen, editingItem]);

  // 絵文字自動推測
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


  // --- タグ・担当者 操作ロジック ---

  function handleTagClick(tag: string) {
    if (isTagEditMode) {
      if (tag === "全員") return alert("「全員」タグは編集・削除できません");
      setActionMenu({ type: 'tag', name: tag });
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

  function handleAssigneeClick(name: string) {
    if (isAssigneeEditMode) {
      setActionMenu({ type: 'assignee', name: name });
      return;
    }
    let current = formData.assignee ? formData.assignee.split(",").map(t => t.trim()).filter(Boolean) : [];
    if (current.includes(name)) {
      current = current.filter(t => t !== name);
    } else {
      current.push(name);
    }
    setFormData({ ...formData, assignee: current.join(",") });
  }

  // --- グローバル変更・削除ロジック ---

  async function executeRename(newName: string) {
    if (!actionMenu || !newName || newName === actionMenu.name) return;
    const { type, name: oldName } = actionMenu;
    const isTag = type === 'tag';
    
    if (!confirm(`「${oldName}」を「${newName}」に変更しますか？\nこれを使用している全てのスケジュールの表記が書き換わります。`)) return;
    setStatus(`${isTag ? "タグ" : "担当者"}名を変更中...`);

    const targetsToUpdate = allItems.filter(it => {
       const list = isTag 
         ? (it.target ? it.target.split(",").map((t: string) => t.trim()) : [])
         : (it.assignee ? it.assignee.split(",").map((t: string) => t.trim()) : []);
       return list.includes(oldName);
    });

    for (const item of targetsToUpdate) {
       const currentList = isTag 
         ? item.target.split(",").map((t: string) => t.trim()) 
         : (item.assignee ? item.assignee.split(",").map((t: string) => t.trim()) : []);
       
       const newList = currentList.map((t: string) => t === oldName ? newName : t).join(",");
       const updatePayload = isTag ? { target: newList } : { assignee: newList };
       await supabase.from("schedule_items").update(updatePayload).eq("id", item.id);
    }

    if (isTag) {
      if (formData.target.includes(oldName)) {
         const currentFormTags = formData.target.split(",").map(t => t.trim());
         const newFormTags = currentFormTags.map(t => t === oldName ? newName : t).join(",");
         setFormData(prev => ({ ...prev, target: newFormTags }));
      }
    } else {
      if (formData.assignee.includes(oldName)) {
         const currentFormAss = formData.assignee.split(",").map(t => t.trim());
         const newFormAss = currentFormAss.map(t => t === oldName ? newName : t).join(",");
         setFormData(prev => ({ ...prev, assignee: newFormAss }));
      }
    }

    setStatus("変更完了");
    setActionMenu(null);
    onReload();
    setTimeout(() => setStatus(""), 2000);
  }

  async function executeDelete() {
    if (!actionMenu) return;
    const { type, name: targetName } = actionMenu;
    const isTag = type === 'tag';

    if (!confirm(`本当に「${targetName}」を削除しますか？\n\n【注意】\nこの${isTag ? "タグ" : "担当者"}が設定されている全てのスケジュールから、この項目だけが削除されます。`)) return;
    setStatus(`${isTag ? "タグ" : "担当者"}を削除中...`);

    const targetsToUpdate = allItems.filter(it => {
       const list = isTag 
         ? (it.target ? it.target.split(",").map((t: string) => t.trim()) : [])
         : (it.assignee ? it.assignee.split(",").map((t: string) => t.trim()) : []);
       return list.includes(targetName);
    });

    for (const item of targetsToUpdate) {
       let currentList = isTag 
         ? item.target.split(",").map((t: string) => t.trim()) 
         : (item.assignee ? item.assignee.split(",").map((t: string) => t.trim()) : []);
       
       currentList = currentList.filter((t: string) => t !== targetName);

       let newListStr = currentList.join(",");
       if (isTag && currentList.length === 0) {
          newListStr = "全員"; 
       }

       const updatePayload = isTag ? { target: newListStr } : { assignee: newListStr };
       await supabase.from("schedule_items").update(updatePayload).eq("id", item.id);
    }

    if (isTag) {
      let currentFormTags = formData.target.split(",").map(t => t.trim());
      if (currentFormTags.includes(targetName)) {
         currentFormTags = currentFormTags.filter(t => t !== targetName);
         if (currentFormTags.length === 0) currentFormTags = ["全員"];
         setFormData(prev => ({ ...prev, target: currentFormTags.join(",") }));
      }
    } else {
      let currentFormAss = formData.assignee ? formData.assignee.split(",").map(t => t.trim()) : [];
      if (currentFormAss.includes(targetName)) {
         currentFormAss = currentFormAss.filter(t => t !== targetName);
         setFormData(prev => ({ ...prev, assignee: currentFormAss.join(",") }));
      }
    }

    setStatus("削除完了");
    setActionMenu(null);
    onReload();
    setTimeout(() => setStatus(""), 2000);
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
    
    setStatus(editingItem ? "更新中..." : "追加中...");
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
    
    const res = editingItem
      ? await supabase.from("schedule_items").update(payload).eq("id", editingItem.id)
      : await supabase.from("schedule_items").insert(payload);
    
    if (res.error) return setStatus("エラー: " + res.error.message);
    
    setStatus(editingItem ? "更新しました" : "追加しました");
    onSaved();
    setTimeout(() => setStatus(""), 2000);
  }

  // ★修正1: 表示用タグリストに localTags を含める
  const currentSelectedTags = formData.target ? formData.target.split(",").map(t => t.trim()).filter(Boolean) : [];
  const displayTags = Array.from(new Set([...recentTags, ...currentSelectedTags, ...localTags])).filter(t => t !== "全員");

  // ★修正1: 表示用担当者リストに localAssignees を含める
  const currentAssignees = formData.assignee ? formData.assignee.split(",").map(t => t.trim()).filter(Boolean) : [];
  const displayAssignees = Array.from(new Set([...recentAssignees, ...currentAssignees, ...localAssignees]));


  // --- UI構成 ---
  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center pointer-events-none ${isOpen ? "visible" : "invisible"}`}>
       <div 
         className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0"}`} 
         onClick={onClose}
       ></div>
       
       <div 
         ref={sheetRef} 
         className={`
           relative w-full max-w-lg bg-[#f8fafc] rounded-t-[2rem] shadow-2xl pointer-events-auto 
           transition-transform duration-300 ease-out flex flex-col max-h-[92vh]
           ${isOpen ? "translate-y-0" : "translate-y-full"}
         `}
       >
          <div className="shrink-0 h-8 flex items-center justify-center cursor-pointer" onClick={onClose}>
             <div className="w-10 h-1.5 bg-slate-300 rounded-full opacity-60"></div>
          </div>
          
          <div className="flex-1 overflow-y-auto px-5 pb-32 pt-2 space-y-6 no-scrollbar">
             
             {/* 1. ヘッダー情報 */}
             <div className="space-y-4">
                <div className="flex items-start gap-3">
                   <div className="w-16 h-16 shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 relative overflow-hidden">
                      <input type="text" value={formData.emoji} onChange={(e)=>setFormData({...formData, emoji:e.target.value})} className="w-full h-full bg-transparent text-center text-4xl outline-none p-0 appearance-none z-10"/>
                   </div>
                   <div className="flex-1 min-w-0">
                      <input type="text" value={formData.title} onChange={(e)=>setFormData({...formData, title:e.target.value})} placeholder="タイトルを入力..." className="w-full bg-transparent text-xl font-black placeholder:text-slate-300 outline-none border-b-2 border-slate-200 focus:border-[#00c2e8] transition-colors py-2 text-slate-800 rounded-none"/>
                      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 mask-linear">
                         {EMOJI_PRESETS.map((emoji) => (
                            <button key={emoji} onClick={() => setFormData({...formData, emoji})} className="shrink-0 text-lg opacity-60 hover:opacity-100 transition-opacity hover:scale-110">{emoji}</button>
                         ))}
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-2">
                   {/* ★修正2: 開始 - flex-col items-center を追加し、inputの w-full を w-auto に変更 */}
                   <label className="flex-1 bg-white rounded-2xl p-2 border border-slate-100 shadow-sm relative group focus-within:ring-2 focus-within:ring-cyan-100 transition-all cursor-pointer flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-400 block text-center mb-1 pointer-events-none">開始</span>
                      <input 
                        type="time" 
                        value={formData.startTime} 
                        onChange={(e)=>setFormData({...formData, startTime:e.target.value})} 
                        className="w-auto min-w-[100px] bg-transparent text-2xl font-black text-center outline-none text-slate-800 appearance-none tracking-tight relative z-10 cursor-pointer"
                      />
                   </label>
                   
                   <ArrowRight className="w-5 h-5 text-slate-300" />
                   
                   {/* ★修正2: 終了 - flex-col items-center を追加し、inputの w-full を w-auto に変更 */}
                   <label className="flex-1 bg-white rounded-2xl p-2 border border-slate-100 shadow-sm relative group focus-within:ring-2 focus-within:ring-cyan-100 transition-all cursor-pointer flex flex-col items-center justify-center">
                      <span className="text-[10px] font-bold text-slate-400 block text-center mb-1 pointer-events-none">終了</span>
                      <input 
                        type="time" 
                        value={formData.endTime} 
                        onChange={(e)=>setFormData({...formData, endTime:e.target.value})} 
                        className={`w-auto min-w-[100px] bg-transparent text-2xl font-black text-center outline-none appearance-none tracking-tight relative z-10 cursor-pointer ${!formData.endTime ? 'text-slate-300' : 'text-slate-800'}`}
                      />
                      {formData.endTime && (
                        <button 
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFormData({...formData, endTime: ""}); }} 
                          className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm z-20"
                        >
                          <X className="w-3.5 h-3.5 pointer-events-none"/>
                        </button>
                      )}
                   </label>
                </div>
             </div>

             {/* 2. 詳細設定カード */}
             <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-50">
                   <div className="w-8 h-8 rounded-full bg-cyan-50 text-[#00c2e8] flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4"/>
                   </div>
                   <input type="text" value={formData.location} onChange={(e)=>setFormData({...formData, location:e.target.value})} placeholder="場所 (例: 大ホール)" className="flex-1 bg-transparent text-sm font-bold outline-none text-slate-700 placeholder:text-slate-300 min-w-0"/>
                </div>

                <div className="flex items-start gap-3 px-5 py-4 border-b border-slate-50">
                   <div className="w-8 h-8 rounded-full bg-yellow-50 text-yellow-500 flex items-center justify-center shrink-0 mt-0.5">
                      <StickyNote className="w-4 h-4"/>
                   </div>
                   <textarea 
                     value={formData.note} 
                     onChange={(e) => { 
                       setFormData({ ...formData, note: e.target.value }); 
                       e.target.style.height = "auto"; 
                       e.target.style.height = `${e.target.scrollHeight}px`; 
                     }} 
                     placeholder="メモ・備考" 
                     className="flex-1 bg-transparent text-sm font-medium outline-none resize-none min-h-[3rem] text-slate-700 placeholder:text-slate-300 leading-relaxed min-w-0"
                   ></textarea>
                </div>

                {/* タグ */}
                <div className="px-5 py-4 border-b border-slate-50">
                   <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Tag className="w-3 h-3"/> 対象タグ</span>
                      <button onClick={() => { setIsTagEditMode(!isTagEditMode); setActionMenu(null); }} className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 ${isTagEditMode ? "bg-red-100 text-red-500" : "bg-slate-100 text-slate-400"}`}>
                        {isTagEditMode ? <><Check className="w-3 h-3"/>完了</> : <><Settings className="w-3 h-3"/>編集</>}
                      </button>
                   </div>
                   <div className="flex flex-wrap gap-2 mb-3">
                      <button onClick={() => handleTagClick("全員")} className={`h-8 px-3 rounded-full font-bold text-xs flex items-center gap-1 transition-all ${(formData.target === "全員" || !formData.target) ? "bg-[#00c2e8] text-white" : "bg-slate-50 text-slate-500"} ${isTagEditMode ? "opacity-30 pointer-events-none" : ""}`}>
                         {(formData.target === "全員" || !formData.target) && <Check className="w-3 h-3"/>} 全員
                      </button>
                      {displayTags.map(t => {
                         const isActive = currentSelectedTags.includes(t);
                         return (
                            <button 
                              key={t} 
                              onClick={() => handleTagClick(t)} 
                              className={`
                                h-8 px-3 rounded-full font-bold text-xs flex items-center gap-1 relative transition-all 
                                ${isTagEditMode 
                                  ? "bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200" 
                                  : isActive ? "bg-cyan-50 text-[#00c2e8] border border-cyan-200" : "bg-slate-50 text-slate-500 border border-transparent"}
                              `}
                            >
                               {isTagEditMode 
                                 ? <Settings className="w-3 h-3 text-slate-400" /> 
                                 : (isActive && <Check className="w-3 h-3"/>)
                               }
                               {t}
                            </button>
                         )
                      })}
                   </div>
                   
                   {!isTagEditMode && (
                      <div className="flex gap-2">
                         <div className="flex-1 h-12 bg-slate-50 rounded-xl flex items-center px-3 border border-slate-100 focus-within:ring-2 focus-within:ring-cyan-100 transition-all">
                            <Plus className="w-4 h-4 text-slate-300 mr-2 shrink-0" />
                            {/* ★修正1: タグ入力時の localTags 追加処理 */}
                            <input 
                              type="text" 
                              value={newTagInput} 
                              onChange={(e)=>setNewTagInput(e.target.value)} 
                              onKeyDown={(e) => { 
                                if (e.key === 'Enter' && newTagInput.trim()) { 
                                  const val = newTagInput.trim();
                                  handleTagClick(val); 
                                  setLocalTags(prev => [...prev, val]); 
                                  setNewTagInput(""); 
                                } 
                              }}
                              placeholder="新しいタグ..." 
                              className="flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-300 min-w-0"
                            />
                         </div>
                         {/* ★修正1: ボタンクリック時の localTags 追加処理 */}
                         <button onClick={() => {
                            const val = newTagInput.trim();
                            if(val){ 
                              handleTagClick(val); 
                              setLocalTags(prev => [...prev, val]);
                              setNewTagInput("") 
                            }
                         }} disabled={!newTagInput.trim()} className="h-12 px-4 bg-slate-800 text-white rounded-xl text-xs font-bold disabled:opacity-30 active:scale-95 transition-all shrink-0">追加</button>
                      </div>
                   )}
                </div>

                {/* 担当者 */}
                <div className="px-5 py-4">
                   <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1"><Users className="w-3 h-3"/> 担当スタッフ</span>
                      <button onClick={() => { setIsAssigneeEditMode(!isAssigneeEditMode); setActionMenu(null); }} className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 ${isAssigneeEditMode ? "bg-red-100 text-red-500" : "bg-slate-100 text-slate-400"}`}>
                        {isAssigneeEditMode ? <><Check className="w-3 h-3"/>完了</> : <><Settings className="w-3 h-3"/>編集</>}
                      </button>
                   </div>
                   <div className="flex flex-wrap gap-2 mb-3">
                      {displayAssignees.map(a => {
                         const isActive = currentAssignees.includes(a);
                         return (
                            <button 
                              key={a} 
                              onClick={() => handleAssigneeClick(a)} 
                              className={`
                                h-8 px-3 rounded-lg font-bold text-xs flex items-center gap-1 border transition-all 
                                ${isAssigneeEditMode 
                                  ? "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200" 
                                  : isActive ? "bg-indigo-50 border-indigo-200 text-indigo-500" : "bg-white border-slate-200 text-slate-500"}
                              `}
                            >
                               {isAssigneeEditMode 
                                 ? <Settings className="w-3 h-3 text-slate-400" />
                                 : (isActive && <Check className="w-3 h-3"/>)
                               }
                               {a}
                            </button>
                         )
                      })}
                      {displayAssignees.length === 0 && <span className="text-[10px] text-slate-300 py-1">履歴なし</span>}
                   </div>

                   {!isAssigneeEditMode && (
                     <div className="flex gap-2">
                        <div className="flex-1 h-12 bg-slate-50 rounded-xl flex items-center px-3 border border-slate-100 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                           <Plus className="w-4 h-4 text-slate-300 mr-2 shrink-0" />
                           {/* ★修正1: 担当者入力時の localAssignees 追加処理 */}
                           <input 
                             type="text" 
                             value={newAssigneeInput} 
                             onChange={(e)=>setNewAssigneeInput(e.target.value)} 
                             onKeyDown={(e) => { 
                               if (e.key === 'Enter' && newAssigneeInput.trim()) { 
                                 const val = newAssigneeInput.trim();
                                 handleAssigneeClick(val); 
                                 setLocalAssignees(prev => [...prev, val]);
                                 setNewAssigneeInput(""); 
                               } 
                             }}
                             placeholder="担当者名 (例: 田中)" 
                             className="flex-1 bg-transparent text-sm font-bold outline-none placeholder:text-slate-300 min-w-0"
                           />
                        </div>
                        {/* ★修正1: ボタンクリック時の localAssignees 追加処理 */}
                        <button onClick={() => {
                           const val = newAssigneeInput.trim();
                           if(val){ 
                             handleAssigneeClick(val); 
                             setLocalAssignees(prev => [...prev, val]);
                             setNewAssigneeInput("") 
                           }
                        }} disabled={!newAssigneeInput.trim()} className="h-12 px-4 bg-indigo-500 text-white rounded-xl text-xs font-bold disabled:opacity-30 active:scale-95 transition-all shrink-0">追加</button>
                     </div>
                   )}
                </div>
             </div>
             
             {/* 3. オプション */}
             <div className="space-y-3">
                {materials.length > 0 && (
                  <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <button onClick={() => setIsMaterialsOpen(!isMaterialsOpen)} className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors">
                       <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                          <Paperclip className="w-4 h-4 text-[#00c2e8]" />
                          資料を紐付ける
                          {formData.materialIds.length > 0 && <span className="bg-[#00c2e8] text-white text-[10px] px-1.5 py-0.5 rounded-md ml-1">{formData.materialIds.length}</span>}
                       </div>
                       {isMaterialsOpen ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
                    </button>
                    {isMaterialsOpen && (
                       <div className="px-5 pb-5 pt-0 space-y-2 animate-in fade-in slide-in-from-top-2">
                          <div className="h-px bg-slate-50 mb-3"></div>
                          {materials.map(m => {
                             const isLinked = formData.materialIds.includes(String(m.id));
                             const { icon: Icon, color, bg } = getMaterialInfo(m.url);
                             return (
                                <button key={m.id} onClick={() => toggleMaterialLink(m.id)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isLinked ? "bg-cyan-50 border-cyan-200" : "bg-white border-slate-100"}`}>
                                   <div className="flex items-center gap-3 overflow-hidden">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
                                      <span className={`text-xs font-bold truncate ${isLinked ? "text-slate-800" : "text-slate-500"}`}>{m.title}</span>
                                   </div>
                                   {isLinked && <Check className="w-4 h-4 text-[#00c2e8]"/>}
                                </button>
                             )
                          })}
                       </div>
                    )}
                  </div>
                )}

                <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
                   <button onClick={() => setIsSortOpen(!isSortOpen)} className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors">
                       <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                          <Settings className="w-4 h-4 text-slate-400" />
                          高度な設定（並び順）
                       </div>
                       {isSortOpen ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
                   </button>
                   {isSortOpen && (
                      <div className="px-5 pb-5 pt-0 animate-in fade-in slide-in-from-top-2">
                         <div className="h-px bg-slate-50 mb-4"></div>
                         <div className="flex gap-3">
                            <button onClick={() => setFormData({...formData, sortOrder: -10})} className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${formData.sortOrder < 0 ? "bg-cyan-50 border-cyan-200 text-[#00c2e8]" : "bg-white border-slate-100 text-slate-400"}`}><ArrowUp className="w-4 h-4"/><span className="text-[10px] font-black">優先</span></button>
                            <button onClick={() => setFormData({...formData, sortOrder: 0})} className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${formData.sortOrder === 0 ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-400"}`}><Minus className="w-4 h-4"/><span className="text-[10px] font-black">標準</span></button>
                            <button onClick={() => setFormData({...formData, sortOrder: 10})} className={`flex-1 py-3 rounded-xl flex flex-col items-center gap-1 border transition-all ${formData.sortOrder > 0 ? "bg-orange-50 border-orange-200 text-orange-500" : "bg-white border-slate-100 text-slate-400"}`}><ArrowDown className="w-4 h-4"/><span className="text-[10px] font-black">後回し</span></button>
                         </div>
                      </div>
                   )}
                </div>
             </div>
          </div>

          {/* Sticky Footer */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100 z-10 rounded-b-[2rem]">
             <button 
               onClick={saveItem} 
               className="w-full h-14 bg-[#00c2e8] rounded-2xl font-black text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-200/50 hover:bg-cyan-400 hover:shadow-cyan-300/50"
             >
                {editingItem ? <><RefreshCw className="w-5 h-5"/> 変更を保存</> : <><Save className="w-5 h-5"/> リストに追加</>}
             </button>
          </div>

          {/* === アクションメニュー === */}
          {actionMenu && (
            <div className="absolute inset-0 z-50 flex items-end justify-center pointer-events-auto">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setActionMenu(null)}></div>
              <div className="relative w-full bg-white rounded-t-2xl p-6 pb-8 space-y-4 animate-in slide-in-from-bottom-10 duration-200 shadow-2xl">
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-slate-400"/>
                      {actionMenu.type === 'tag' ? "タグ" : "担当者"}の編集: <span className="text-[#00c2e8]">{actionMenu.name}</span>
                    </h3>
                    <button onClick={() => setActionMenu(null)} className="p-2 bg-slate-100 rounded-full text-slate-500"><X className="w-4 h-4"/></button>
                 </div>
                 <div className="p-4 bg-slate-50 rounded-xl text-xs text-slate-500 flex gap-2 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-orange-400" />
                    ここで変更・削除を行うと、過去のスケジュールも含めて、この項目を使用している全ての箇所に反映されます。
                 </div>
                 <div className="grid grid-cols-1 gap-3">
                    <button onClick={() => { const newName = prompt("新しい名前を入力してください", actionMenu.name); if(newName) executeRename(newName); }} className="h-14 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all active:scale-[0.98]">
                       <Pencil className="w-5 h-5 text-slate-400"/> 名前を変更する
                    </button>
                    <button onClick={executeDelete} className="h-14 bg-red-50 text-red-500 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-all active:scale-[0.98]">
                       <Trash2 className="w-5 h-5"/> この項目を全ての予定から削除
                    </button>
                 </div>
              </div>
            </div>
          )}
       </div>
    </div>
  );
}