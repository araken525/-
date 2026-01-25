"use client";

import { useState, use, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lock, Unlock, ArrowUpRight, LogOut, Save, Plus, RefreshCw, MapPin, AlignLeft, ChevronDown, Edit3, Trash2, Tag, Smile, X, Clock, Calendar } from "lucide-react";

/* ===== ヘルパー関数 (公開ページと共通) ===== */
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
  if (t.includes("休憩") || t.includes("昼") || t.includes("ランチ")) return "🍱";
  if (t.includes("リハ") || t.includes("練習")) return "🎻";
  if (t.includes("開場") || t.includes("受付")) return "🎫";
  if (t.includes("開演") || t.includes("本番")) return "✨";
  if (t.includes("撤収") || t.includes("片付け")) return "🧹";
  if (t.includes("移動")) return "🚶";
  return "🎵";
}
function getTargetColor(t: string) {
  if (!t || t === "all" || t === "全員") return "bg-slate-100 text-slate-500";
  return "bg-cyan-50 text-[#00c2e8]";
}

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
  const [recentTags, setRecentTags] = useState<string[]>(["全員"]);

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
      const tags = new Set<string>(["全員"]);
      data.forEach((it) => { if (it.target) tags.add(it.target); });
      setRecentTags(Array.from(tags));
    }
  }
  useEffect(() => { if (event?.id) loadItems(); }, [event?.id]);
  useEffect(() => { if (sessionStorage.getItem(`edit-ok:${slug}`)) setOk(true); }, [slug]);

  // 自動絵文字推測
  useEffect(() => {
    if (!editingId && formData.title && formData.emoji === "🎵") {
      setFormData(prev => ({ ...prev, emoji: detectEmoji(prev.title) }));
    }
  }, [formData.title, editingId, formData.emoji]);

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
      // 前回の入力値を一部引き継ぐと便利かも？一旦リセット
      setFormData({ ...formData, title: "", location: "", note: "", emoji: "🎵" }); 
    }
    setIsSheetOpen(true);
  }
  function closeSheet() { setIsSheetOpen(false); setTimeout(() => setEditingId(null), 300); }

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
        {/* イベント情報カード (簡易版) */}
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

        {/* リスト (公開ページ風デザイン + 編集アクション) */}
        <section className="space-y-4">
          {items.map((it) => {
             const badgeColor = getTargetColor(it.target);
             const emoji = it.emoji || detectEmoji(it.title);
             const duration = getDuration(it.start_time, it.end_time);
             return (
              <div key={it.id} className="group relative bg-white rounded-[1.5rem] p-5 flex gap-5 items-stretch shadow-sm border border-transparent transition-all hover:shadow-md">
                {/* 左：時間 & 絵文字 */}
                <div className="flex flex-col items-center shrink-0 space-y-2">
                   <div className="text-lg font-black text-slate-800 leading-none">{hhmm(it.start_time)}</div>
                   <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl">{emoji}</div>
                </div>
                {/* 右：情報 */}
                <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                  <div className="flex justify-between items-start mb-1">
                     <h3 className="text-lg font-black leading-tight text-slate-900">{it.title}</h3>
                     <span className={`ml-2 shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black ${badgeColor}`}>{it.target || "全員"}</span>
                  </div>
                  {it.end_time && <div className="flex items-center text-sm font-bold text-[#00c2e8] mb-1"><Clock className="w-3.5 h-3.5 mr-1"/>~{hhmm(it.end_time)} まで</div>}
                  {it.note && <div className="text-xs text-slate-600 leading-relaxed font-medium mb-2 line-clamp-2">{it.note}</div>}
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                     {it.location && <div className="flex items-center"><MapPin className="w-3 h-3 mr-1 text-slate-300"/>{it.location}</div>}
                     {duration && <div>⏳ {duration}</div>}
                  </div>
                </div>
                {/* 編集オーバーレイ (ホバーorタップで表示) */}
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

      {/* FAB (新規追加ボタン) */}
      <button onClick={() => openSheet()} className="fixed bottom-6 right-6 w-14 h-14 bg-[#00c2e8] rounded-full shadow-lg text-white flex items-center justify-center active:scale-90 transition-all z-30">
        <Plus className="w-8 h-8" />
      </button>

      {/* === ボトムシート (入力フォーム) === */}
      <div className={`fixed inset-0 z-50 flex items-end justify-center pointer-events-none ${isSheetOpen ? "visible" : "invisible"}`}>
         {/* 背景の暗転 */}
         <div className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${isSheetOpen ? "opacity-100 pointer-events-auto" : "opacity-0"}`} onClick={closeSheet}></div>
         
         {/* シート本体 */}
         <div ref={sheetRef} className={`relative w-full max-w-lg bg-white rounded-t-[2rem] shadow-2xl p-6 space-y-5 pointer-events-auto transition-transform duration-300 ease-out ${isSheetOpen ? "translate-y-0" : "translate-y-full"}`}>
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-2"></div> {/* ハンドル */}
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
               <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                  {editingId ? <><Edit3 className="w-5 h-5 text-blue-500"/> 編集</> : <><Plus className="w-5 h-5 text-[#00c2e8]"/> 新規追加</>}
               </h2>
               <button onClick={closeSheet} className="p-2 -mr-2 text-slate-400 bg-slate-50 rounded-full hover:bg-slate-100"><X className="w-5 h-5"/></button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[70vh] no-scrollbar pb-4">
               {/* 時間 */}
               <div className="flex gap-3">
                  <div className="flex-1 space-y-1"><label className="text-xs font-bold text-slate-400 ml-1">開始</label><input type="time" value={formData.startTime} onChange={(e)=>setFormData({...formData, startTime:e.target.value})} className="w-full h-12 bg-slate-50 rounded-2xl text-center font-bold text-lg outline-none focus:bg-white focus:ring-4 focus:ring-cyan-50 transition-all"/></div>
                  <div className="flex-1 space-y-1"><label className="text-xs font-bold text-slate-400 ml-1">終了(任意)</label><input type="time" value={formData.endTime} onChange={(e)=>setFormData({...formData, endTime:e.target.value})} className="w-full h-12 bg-slate-50 rounded-2xl text-center font-bold text-lg outline-none focus:bg-white focus:ring-4 focus:ring-cyan-50 transition-all"/></div>
               </div>
               {/* タイトル & 絵文字 */}
               <div className="flex gap-3">
                  <div className="w-[4.5rem] shrink-0 space-y-1"><label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1"><Smile className="w-3 h-3"/> Icon</label><input type="text" value={formData.emoji} onChange={(e)=>setFormData({...formData, emoji:e.target.value})} className="w-full h-12 bg-slate-50 rounded-2xl text-center text-2xl outline-none focus:bg-white focus:ring-4 focus:ring-cyan-50 transition-all" placeholder="🎵"/></div>
                  <div className="flex-1 space-y-1"><label className="text-xs font-bold text-slate-400 ml-1">タイトル</label><input type="text" value={formData.title} onChange={(e)=>setFormData({...formData, title:e.target.value})} placeholder="例: リハーサル" className="w-full h-12 px-4 bg-slate-50 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-cyan-50 transition-all placeholder:text-slate-300"/></div>
               </div>
               {/* ターゲット */}
               <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 ml-1">対象</label>
                  <div className="relative"><Tag className="absolute left-4 top-3.5 w-4 h-4 text-slate-400"/><input type="text" value={formData.target} onChange={(e)=>setFormData({...formData, target:e.target.value})} placeholder="全員" className="w-full h-11 pl-10 pr-4 bg-slate-50 rounded-xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-cyan-50 transition-all"/></div>
                  {recentTags.length > 0 && <div className="flex flex-wrap gap-2">{recentTags.map((t)=><button key={t} onClick={()=>setFormData({...formData, target:t})} className={`text-[10px] px-2.5 py-1.5 rounded-lg font-bold transition-all border ${formData.target===t?"bg-slate-800 text-white border-slate-800":"bg-white text-slate-500 border-slate-200"}`}>{t}</button>)}</div>}
               </div>
               {/* 場所・メモ */}
               <div className="space-y-3">
                  <input type="text" value={formData.location} onChange={(e)=>setFormData({...formData, location:e.target.value})} placeholder="場所 (任意)" className="w-full h-10 px-4 bg-slate-50 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-cyan-50"/>
                  <textarea value={formData.note} onChange={(e)=>setFormData({...formData, note:e.target.value})} placeholder="メモ (任意)" className="w-full h-20 px-4 py-3 bg-slate-50 rounded-xl text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-cyan-50 resize-none"></textarea>
               </div>
               {/* 詳細設定 */}
               <details className="group py-1"><summary className="text-xs font-bold text-slate-400 cursor-pointer list-none flex items-center gap-1"><ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform"/> 詳細設定</summary><div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 rounded-xl"><span className="text-sm text-slate-500 font-bold">並び順優先度:</span><input type="number" value={formData.sortOrder} onChange={(e)=>setFormData({...formData, sortOrder:parseInt(e.target.value||"0",10)})} className="w-20 h-10 px-2 bg-white rounded-lg text-sm text-center font-bold outline-none border border-slate-200 focus:border-cyan-300"/></div></details>
            </div>

            <button onClick={saveItem} className={`w-full h-14 rounded-2xl font-black text-white shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${editingId ? "bg-blue-600 shadow-blue-200" : "bg-[#00c2e8] shadow-cyan-200"}`}>
               {editingId ? <><RefreshCw className="w-5 h-5"/> 更新する</> : <><Save className="w-5 h-5"/> 追加する</>}
            </button>
         </div>
      </div>
    </main>
  );
}