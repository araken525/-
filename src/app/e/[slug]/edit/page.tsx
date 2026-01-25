"use client";

import { useState, use, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lock, Unlock, ArrowUpRight, LogOut, Save, Plus, RefreshCw, MapPin, AlignLeft, Edit3, Trash2, X, Clock, Calendar, ArrowUp, ArrowDown, Minus, Check } from "lucide-react";

/* ===== ヘルパー関数 & 定数 ===== */
function hhmm(t: string) { return String(t).slice(0, 5); }
function getDuration(start: string, end?: string | null) {
  if (!end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diffMin = (eh * 60 + em) - (sh * 60 + sm);
  if (diffMin <= 0) return null;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}
function detectEmoji(title: string) {
  const t = title.toLowerCase();
  if (t.includes("休憩") || t.includes("昼") || t.includes("ランチ") || t.includes("ご飯")) return "🍱";
  if (t.includes("リハ") || t.includes("練習") || t.includes("合わせ") || t.includes("gp")) return "🎻";
  if (t.includes("開場") || t.includes("受付")) return "🎫";
  if (t.includes("開演") || t.includes("本番") || t.includes("ステージ")) return "✨";
  if (t.includes("終演") || t.includes("片付け") || t.includes("撤収")) return "🧹";
  if (t.includes("移動")) return "🚌";
  if (t.includes("トイレ")) return "🚽";
  if (t.includes("喫煙") || t.includes("タバコ")) return "🚬";
  if (t.includes("乾杯") || t.includes("打ち上げ") || t.includes("飲み")) return "🍻";
  if (t.includes("ホテル") || t.includes("宿")) return "🏨";
  return "🎵";
}
function getTargetColor(t: string) {
  if (!t || t === "all" || t === "全員") return "bg-slate-100 text-slate-500";
  return "bg-cyan-50 text-[#00c2e8]";
}

// アイコンパレット
const EMOJI_PRESETS = ["🎵", "🎻", "🍱", "🎤", "🚌", "🚽", "🚬", "☕", "🍻", "🏨", "🎫", "✨", "🧹", "🚩"];

/* ===== メインコンポーネント ===== */
export default function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  // 認証・イベント状態
  const [ok, setOk] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [event, setEvent] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  
  // 編集シート状態
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  // フォーム状態
  const [formData, setFormData] = useState({
    startTime: "10:00", endTime: "", title: "", location: "", note: "", target: "全員", emoji: "🎵", sortOrder: 0
  });
  
  // タグ関連ステート
  const [recentTags, setRecentTags] = useState<string[]>(["全員"]); 
  const [newTagInput, setNewTagInput] = useState("");

  // 初期データロード
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
      if (data) setEvent(data);
    })();
  }, [slug]);

  async function loadItems() {
    if (!event?.id) return;
    const { data } = await supabase.from("schedule_items").select("*").eq("event_id", event.id).order("start_time", { ascending: true }).order("sort_order", { ascending: true });
    setItems(data ?? []);
    if (data) {
      const tags = new Set<string>(recentTags);
      data.forEach((it) => { 
         if (it.target && it.target !== "all") {
            it.target.split(",").forEach((t: string) => tags.add(t.trim()));
         }
      });
      tags.delete("全員");
      setRecentTags(["全員", ...Array.from(tags)]);
    }
  }
  useEffect(() => { if (event?.id) loadItems(); }, [event?.id]);
  useEffect(() => { if (sessionStorage.getItem(`edit-ok:${slug}`)) setOk(true); }, [slug]);

  // 自動絵文字推測
  useEffect(() => {
    if (!editingId && formData.title) {
      const detected = detectEmoji(formData.title);
      if (formData.emoji === "🎵" || EMOJI_PRESETS.includes(formData.emoji)) {
         if (detected !== "🎵") setFormData(prev => ({ ...prev, emoji: detected }));
      }
    }
  }, [formData.title]);

  // シート外クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) closeSheet();
    }
    if (isSheetOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSheetOpen]);


  // --- アクション ---
  async function checkPassword() {
    setStatus("確認中...");
    const { data } = await supabase.from("events").select("edit_password").eq("slug", slug).maybeSingle();
    if (!data?.edit_password) return setStatus("PW未設定");
    if (data.edit_password === password) {
      sessionStorage.setItem(`edit-ok:${slug}`, "true");
      setOk(true); setStatus(""); loadItems();
    } else { setStatus("パスワードが違います"); }
  }
  function resetLock() {
    sessionStorage.removeItem(`edit-ok:${slug}`); setOk(false); setPassword(""); setStatus("ログアウトしました"); closeSheet();
  }

  function openSheet(item?: any) {
    if (item) {
      setEditingId(item.id);
      setFormData({
        startTime: hhmm(item.start_time), endTime: item.end_time ? hhmm(item.end_time) : "",
        title: item.title ?? "", location: item.location ?? "", note: item.note ?? "",
        target: item.target ?? "全員", emoji: item.emoji || detectEmoji(item.title || ""), sortOrder: item.sort_order ?? 0
      });
    } else {
      setEditingId(null);
      setFormData({ ...formData, title: "", location: "", note: "", emoji: "🎵", sortOrder: 0 }); 
    }
    setNewTagInput("");
    setIsSheetOpen(true);
  }
  function closeSheet() { setIsSheetOpen(false); setTimeout(() => setEditingId(null), 300); }

  // タグの複数選択ロジック
  function toggleTag(tag: string) {
    if (tag === "全員") {
      setFormData({ ...formData, target: "全員" });
      return;
    }

    let currentTags = formData.target 
      ? formData.target.split(",").map(t => t.trim()).filter(Boolean) 
      : [];

    if (currentTags.includes("全員")) currentTags = [];

    if (currentTags.includes(tag)) {
      currentTags = currentTags.filter(t => t !== tag);
    } else {
      currentTags.push(tag);
    }

    const newTarget = currentTags.length === 0 ? "全員" : currentTags.join(",");
    setFormData({ ...formData, target: newTarget });
  }

  // 新規タグ追加ロジック
  function addNewTag() {
    const t = newTagInput.trim();
    if (!t) return;
    
    if (!recentTags.includes(t)) {
      setRecentTags([...recentTags, t]);
    }
    
    let currentTags = formData.target ? formData.target.split(",").map(x => x.trim()).filter(Boolean) : [];
    if (currentTags.includes("全員")) currentTags = [];
    if (!currentTags.includes(t)) currentTags.push(t);
    
    setFormData({ ...formData, target: currentTags.join(",") });
    setNewTagInput("");
  }

  async function saveItem() {
    if (!event?.id) return setStatus("イベント不明");
    if (!formData.title.trim()) return setStatus("タイトル必須");
    const payload = {
      event_id: event.id, start_time: formData.startTime + ":00", end_time: formData.endTime ? formData.endTime + ":00" : null,
      title: formData.title.trim(), location: formData.location.trim() || null, note: formData.note.trim() || null,
      target: formData.target.trim() || "全員", emoji: formData.emoji || "🎵", sort_order: formData.sortOrder,
    };
    setStatus(editingId ? "更新中..." : "追加中...");
    const res = editingId
      ? await supabase.from("schedule_items").update(payload).eq("id", editingId)
      : await supabase.from("schedule_items").insert(payload);
    if (res.error) return setStatus("エラー: " + res.error.message);
    setStatus(editingId ? "更新しました" : "追加しました");
    closeSheet(); loadItems(); setTimeout(() => setStatus(""), 2000);
  }

  async function removeItem(id: string) {
    if (!confirm("本当に削除しますか？")) return;
    const { error } = await supabase.from("schedule_items").delete().eq("id", id);
    if (error) return setStatus("エラー: " + error.message);
    loadItems(); setStatus("削除しました"); setTimeout(() => setStatus(""), 2000);
  }

  // --- 描画 ---
  if (!ok) {
    return (
      <main className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4"><Lock className="w-8 h-8" /></div>
          <h1 className="text-xl font-black text-slate-800">編集モード 🔐</h1>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full h-14 px-4 bg-slate-50 rounded-2xl text-center text-lg font-black outline-none focus:ring-4 focus:ring-cyan-50 transition-all"/>
          <button onClick={checkPassword} className="w-full h-14 bg-[#00c2e8] text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Unlock className="w-5 h-5" /> 認証する</button>
          {status && <div className="text-sm font-bold text-red-500 animate-pulse">{status}</div>}
          <a href={`/e/${slug}`} className="block text-xs font-bold text-slate-400 hover:text-[#00c2e8] mt-4">公開ページに戻る</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb] pb-32 font-sans selection:bg-[#00c2e8] selection:text-white relative">
      {/* ヘッダー */}
      <header className="fixed top-0 inset-x-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-2 font-black text-slate-800 truncate">
            <Edit3 className="w-4 h-4 text-[#00c2e8]" />
            <span className="truncate">{event?.title || slug} の編集</span>
         </div>
         <div className="flex gap-2 shrink-0">
            <a href={`/e/${slug}`} target="_blank" className="w-9 h-9 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-[#00c2e8] transition-all"><ArrowUpRight className="w-4 h-4"/></a>
            <button onClick={resetLock} className="w-9 h-9 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-all"><LogOut className="w-4 h-4"/></button>
         </div>
      </header>

      {/*ステータス通知*/}
      {status && <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg bg-slate-800 text-white text-xs font-bold animate-bounce whitespace-nowrap">{status}</div>}

      <div className="pt-20 px-4 max-w-lg mx-auto space-y-6">
        {/* イベント情報カード */}
        {event && (
          <section className="bg-white rounded-[1.5rem] p-4 shadow-sm flex items-center justify-between">
             <div>
               <h1 className="text-lg font-black text-slate-800 leading-tight">{event.title}</h1>
               <div className="flex items-center gap-3 text-xs font-bold text-slate-500 mt-1">
                  <div className="flex items-center"><Calendar className="w-3 h-3 mr-1 text-slate-400"/>{event.date}</div>
                  <div className="flex items-center"><MapPin className="w-3 h-3 mr-1 text-slate-400"/>{event.venue_name}</div>
               </div>
             </div>
          </section>
        )}

        {/* リスト */}
        <section className="space-y-4">
          {items.map((it) => {
             const badgeColor = getTargetColor(it.target);
             const emoji = it.emoji || detectEmoji(it.title);
             const duration = getDuration(it.start_time, it.end_time);
             const displayTarget = it.target && it.target !== "all" ? it.target.replace(/,/g, "・") : "全員";
             
             return (
              <div key={it.id} className="group relative bg-white rounded-[1.5rem] p-5 flex gap-5 items-stretch shadow-sm border border-transparent transition-all hover:shadow-md">
                <div className="flex flex-col items-center shrink-0 space-y-2">
                   <div className="text-lg font-black text-slate-800 leading-none">{hhmm(it.start_time)}</div>
                   <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl">{emoji}</div>
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                  <div className="flex justify-between items-start mb-1">
                     <h3 className="text-lg font-black leading-tight text-slate-900">{it.title}</h3>
                     <span className={`ml-2 shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black ${badgeColor}`}>{displayTarget}</span>
                  </div>
                  {it.end_time && <div className="flex items-center text-sm font-bold text-[#00c2e8] mb-1"><Clock className="w-3.5 h-3.5 mr-1"/>~{hhmm(it.end_time)} まで</div>}
                  {it.note && <div className="text-xs text-slate-600 leading-relaxed font-medium mb-2 line-clamp-2">{it.note}</div>}
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                     {it.location && <div className="flex items-center"><MapPin className="w-3 h-3 mr-1 text-slate-300"/>{it.location}</div>}
                     {duration && <div>⏳ {duration}</div>}
                  </div>
                </div>
                <div className="absolute inset-0 bg-slate-900/5 backdrop-blur-[1px] rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end p-4 gap-2">
                   <button onClick={() => openSheet(it)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-blue-500 hover:bg-blue-50 active:scale-95 transition-all"><Edit3 className="w-5 h-5"/></button>
                   <button onClick={() => removeItem(it.id)} className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-red-500 hover:bg-red-50 active:scale-95 transition-all"><Trash2 className="w-5 h-5"/></button>
                </div>
              </div>
             );
          })}
          {items.length === 0 && <div className="text-center py-12 text-slate-400 font-bold text-sm">予定がありません。「＋」ボタンで追加しましょう！</div>}
        </section>
      </div>

      {/* FAB */}
      <button onClick={() => openSheet()} className="fixed bottom-6 right-6 w-14 h-14 bg-[#00c2e8] rounded-full shadow-lg text-white flex items-center justify-center active:scale-90 transition-all z-30">
        <Plus className="w-8 h-8" />
      </button>

      {/* === 入力フォーム (構造を刷新して途切れを防止) === */}
      <div className={`fixed inset-0 z-50 flex items-end justify-center pointer-events-none ${isSheetOpen ? "visible" : "invisible"}`}>
         <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isSheetOpen ? "opacity-100 pointer-events-auto" : "opacity-0"}`} onClick={closeSheet}></div>
         
         {/* シート本体: Flex Layoutに変更 */}
         <div ref={sheetRef} className={`relative w-full max-w-lg bg-white rounded-t-[2.5rem] shadow-2xl pointer-events-auto transition-transform duration-300 ease-out flex flex-col max-h-[95vh] ${isSheetOpen ? "translate-y-0" : "translate-y-full"}`}>
            
            {/* 1. ヘッダー (固定・スクロールしない) */}
            <div className="shrink-0 relative h-14 flex items-center justify-center">
               <div className="w-12 h-1.5 bg-slate-200 rounded-full absolute top-4"></div>
               <button onClick={closeSheet} className="absolute right-6 top-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-all z-10">
                  <X className="w-5 h-5" />
               </button>
            </div>
            
            {/* 2. コンテンツ (スクロールする) */}
            <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6 no-scrollbar">
               
               {/* タイトル & アイコン */}
               <div className="space-y-4">
                  <div className="flex items-center gap-4">
                     <div className="w-16 h-16 shrink-0 bg-slate-50 rounded-2xl flex items-center justify-center relative shadow-inner">
                        <input type="text" value={formData.emoji} onChange={(e)=>setFormData({...formData, emoji:e.target.value})} className="w-full h-full bg-transparent text-center text-4xl outline-none" placeholder="🎵"/>
                     </div>
                     <div className="flex-1">
                        <input type="text" value={formData.title} onChange={(e)=>setFormData({...formData, title:e.target.value})} placeholder="何をする？" className="w-full h-16 bg-transparent text-2xl font-black placeholder:text-slate-300 outline-none border-b-2 border-slate-100 focus:border-[#00c2e8] transition-colors"/>
                     </div>
                  </div>
                  <div>
                     <p className="text-xs font-bold text-slate-400 mb-2 pl-1">アイコンをえらぶ</p>
                     <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                        {EMOJI_PRESETS.map((emoji) => (
                           <button key={emoji} onClick={() => setFormData({...formData, emoji})} className={`shrink-0 w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${formData.emoji === emoji ? "bg-cyan-50 text-[#00c2e8] scale-110" : "bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
                              {emoji}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               {/* 時間設定 */}
               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-2xl p-3">
                     <label className="text-[10px] font-bold text-slate-400 block mb-1">開始</label>
                     <input type="time" value={formData.startTime} onChange={(e)=>setFormData({...formData, startTime:e.target.value})} className="w-full bg-transparent text-xl font-black text-center outline-none"/>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3">
                     <label className="text-[10px] font-bold text-slate-400 block mb-1">終了 (任意)</label>
                     <input type="time" value={formData.endTime} onChange={(e)=>setFormData({...formData, endTime:e.target.value})} className="w-full bg-transparent text-xl font-black text-center outline-none text-slate-600 placeholder:text-slate-300"/>
                  </div>
               </div>

               {/* 対象タグ */}
               <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-400 block -mb-2 pl-1">対象パート</label>
                  <button onClick={() => toggleTag("全員")} className={`w-full h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${(formData.target === "全員" || !formData.target) ? "bg-[#00c2e8] text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                     {(formData.target === "全員" || !formData.target) && <Check className="w-4 h-4"/>}全員
                  </button>
                  {recentTags.filter(t => t !== "全員").length > 0 && (
                     <div className="grid grid-cols-3 gap-2">
                        {recentTags.filter(t => t !== "全員").map((t) => {
                           const currentList = formData.target ? formData.target.split(",").map(x => x.trim()) : [];
                           const isActive = currentList.includes(t);
                           return (
                              <button key={t} onClick={() => toggleTag(t)} className={`h-10 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 ${isActive ? "bg-cyan-50 text-[#00c2e8] border border-cyan-100" : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-transparent"}`}>
                                 {isActive && <Check className="w-3 h-3"/>}<span className="truncate">{t}</span>
                              </button>
                           );
                        })}
                     </div>
                  )}
                  <div className="flex gap-2">
                     <input type="text" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addNewTag())} placeholder="新しいタグを追加..." className="flex-1 h-10 bg-slate-50 rounded-xl px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-cyan-100 transition-all"/>
                     <button onClick={addNewTag} disabled={!newTagInput.trim()} className="h-10 px-4 bg-slate-800 text-white rounded-xl font-bold text-sm disabled:opacity-30 transition-all">追加</button>
                  </div>
                  <div className="space-y-3 pt-2">
                     <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 h-12">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0"/>
                        <input type="text" value={formData.location} onChange={(e)=>setFormData({...formData, location:e.target.value})} placeholder="場所を追加" className="flex-1 bg-transparent text-sm font-bold outline-none"/>
                     </div>
                     <div className="flex items-start gap-3 bg-slate-50 rounded-xl px-4 py-3 min-h-[5rem]">
                        <AlignLeft className="w-4 h-4 text-slate-400 shrink-0 mt-1"/>
                        <textarea value={formData.note} onChange={(e)=>setFormData({...formData, note:e.target.value})} placeholder="メモを追加" className="flex-1 bg-transparent text-sm font-medium outline-none resize-none h-full"></textarea>
                     </div>
                  </div>
               </div>

               {/* 並び順 */}
               <div className="bg-slate-50 rounded-2xl p-1 flex">
                  <button onClick={() => setFormData({...formData, sortOrder: -10})} className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all ${formData.sortOrder < 0 ? "bg-white text-blue-500 shadow-sm" : "text-slate-400"}`}><ArrowUp className="w-3.5 h-3.5"/> 先頭</button>
                  <button onClick={() => setFormData({...formData, sortOrder: 0})} className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all ${formData.sortOrder === 0 ? "bg-white text-slate-700 shadow-sm" : "text-slate-400"}`}><Minus className="w-3.5 h-3.5"/> 標準</button>
                  <button onClick={() => setFormData({...formData, sortOrder: 10})} className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all ${formData.sortOrder > 0 ? "bg-white text-orange-500 shadow-sm" : "text-slate-400"}`}><ArrowDown className="w-3.5 h-3.5"/> 末尾</button>
               </div>
            </div>

            {/* 3. フッター (保存ボタン・固定) */}
            {/* ★変更: シアン統一 & シャドウ削除 */}
            <div className="shrink-0 p-6 pt-0 bg-white">
               <button onClick={saveItem} className="w-full h-14 bg-[#00c2e8] rounded-[1.2rem] font-black text-white active:scale-95 transition-all flex items-center justify-center gap-2">
                  {editingId ? <><RefreshCw className="w-5 h-5"/> 更新する</> : <><Save className="w-5 h-5"/> リストに追加</>}
               </button>
            </div>
         </div>
      </div>
    </main>
  );
}