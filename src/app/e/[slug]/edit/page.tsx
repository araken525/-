"use client";

import { useState, use, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lock, Unlock, ArrowUpRight, LogOut, Save, Plus, RefreshCw, MapPin, AlignLeft, ChevronDown, Edit3, Trash2, Tag, Smile } from "lucide-react";

/* ===== ヘルパー関数 ===== */
function hhmm(t: string) {
  return String(t).slice(0, 5);
}

// 推測ロジック（編集画面でも使用）
function detectEmoji(title: string) {
  const t = title.toLowerCase();
  if (t.includes("休憩") || t.includes("昼") || t.includes("ご飯") || t.includes("ランチ")) return "🍱";
  if (t.includes("リハ") || t.includes("練習") || t.includes("合わせ") || t.includes("GP")) return "🎻";
  if (t.includes("開場") || t.includes("受付")) return "🎫";
  if (t.includes("開演") || t.includes("本番") || t.includes("ステージ")) return "✨";
  if (t.includes("終演") || t.includes("片付け") || t.includes("撤収")) return "🧹";
  if (t.includes("集合")) return "🚩";
  if (t.includes("解散")) return "👋";
  if (t.includes("ミーティング") || t.includes("朝礼") || t.includes("会議")) return "🗣️";
  if (t.includes("移動")) return "🚶";
  if (t.includes("待機")) return "🪑";
  return "🎵";
}

// ターゲット名から色を自動生成
function getTargetColor(t: string) {
  // Wolt風に合わせて少し彩度を調整
  if (!t || t === "all" || t === "全員") return "bg-slate-100 text-slate-500";
  return "bg-cyan-50 text-[#00c2e8]";
}

export default function EditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  const [ok, setOk] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  const [eventId, setEventId] = useState<string>("");
  const [eventTitle, setEventTitle] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);

  // form state
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [target, setTarget] = useState("全員");
  const [emoji, setEmoji] = useState("🎵"); // ★追加：絵文字
  const [sortOrder, setSortOrder] = useState(0);

  // 既に使用されているタグのリスト
  const [recentTags, setRecentTags] = useState<string[]>(["全員"]);

  // 初期ロード
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("events")
        .select("id,title")
        .eq("slug", slug)
        .maybeSingle();
      if (data?.id) setEventId(data.id);
      if (data?.title) setEventTitle(data.title);
    })();
  }, [slug]);

  async function loadItems() {
    if (!eventId) return;
    const { data } = await supabase
      .from("schedule_items")
      .select("*")
      .eq("event_id", eventId)
      .order("start_time", { ascending: true })
      .order("sort_order", { ascending: true });
    setItems(data ?? []);

    if (data) {
      const tags = new Set<string>(["全員"]);
      data.forEach((it) => {
        if (it.target) tags.add(it.target);
      });
      setRecentTags(Array.from(tags));
    }
  }

  useEffect(() => {
    if (eventId) loadItems();
  }, [eventId]);

  useEffect(() => {
    if (sessionStorage.getItem(`edit-ok:${slug}`)) setOk(true);
  }, [slug]);

  // ★タイトル入力時に絵文字を自動提案（新規作成時、または意図的に変えていない場合）
  useEffect(() => {
    if (!editing && title) {
      setEmoji(detectEmoji(title));
    }
  }, [title, editing]);

  // 認証処理
  async function checkPassword() {
    setStatus("確認中...");
    const { data } = await supabase.from("events").select("edit_password").eq("slug", slug).maybeSingle();

    if (!data?.edit_password) return setStatus("PW未設定");

    if (data.edit_password === password) {
      sessionStorage.setItem(`edit-ok:${slug}`, "true");
      setOk(true);
      setStatus("");
      loadItems();
    } else {
      setStatus("パスワードが違います");
    }
  }

  function resetLock() {
    sessionStorage.removeItem(`edit-ok:${slug}`);
    setOk(false); setPassword(""); setStatus("ログアウトしました"); setEditing(null);
  }

  // 保存処理
  async function saveItem() {
    if (!eventId) return setStatus("イベント不明");
    if (!title.trim()) return setStatus("タイトル必須");

    const finalTarget = target.trim() || "全員";

    const payload = {
      event_id: eventId,
      start_time: startTime + ":00",
      end_time: endTime ? endTime + ":00" : null,
      title: title.trim(),
      location: location.trim() || null,
      note: note.trim() || null,
      target: finalTarget,
      emoji: emoji || "🎵", // ★保存
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    setStatus(editing ? "更新中..." : "追加中...");

    const res = editing
      ? await supabase.from("schedule_items").update(payload).eq("id", editing.id)
      : await supabase.from("schedule_items").insert(payload);

    if (res.error) return setStatus("エラー: " + res.error.message);

    setStatus(editing ? "更新しました" : "追加しました");
    
    if (!res.error) {
      setEditing(null); setTitle(""); setLocation(""); setNote("");
      // 時間とターゲットは維持
      loadItems();
      setTimeout(() => setStatus(""), 2000);
    }
  }

  async function removeItem(id: string) {
    if (!confirm("削除しますか？")) return;
    const { error } = await supabase.from("schedule_items").delete().eq("id", id);
    if (error) return setStatus("エラー: " + error.message);
    loadItems();
  }

  function startEdit(it: any) {
    setEditing(it);
    setStartTime(hhmm(it.start_time));
    setEndTime(it.end_time ? hhmm(it.end_time) : "");
    setTitle(it.title ?? "");
    setLocation(it.location ?? "");
    setNote(it.note ?? "");
    setTarget(it.target ?? "全員");
    setEmoji(it.emoji || detectEmoji(it.title || "")); // ★保存された絵文字を呼び出し
    setSortOrder(it.sort_order ?? 0);
    setStatus("編集: " + it.title);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditing(null); setTitle(""); setLocation(""); setNote(""); setStatus("");
  }

  // ==========================================
  // 1. ログイン前 (Wolt Style)
  // ==========================================
  if (!ok) {
    return (
      <main className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-800">編集モード 🔐</h1>
            <p className="text-sm font-bold text-slate-400">パスワードを入力してください</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-14 px-4 bg-slate-50 rounded-2xl text-center text-lg font-black focus:ring-4 focus:ring-cyan-50 focus:bg-white outline-none transition-all placeholder:text-slate-300"
            />
            <button
              onClick={checkPassword}
              className="w-full h-14 bg-[#00c2e8] text-white font-black rounded-2xl shadow-lg shadow-cyan-100 hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-5 h-5" />
              認証する
            </button>
          </div>
          {status && <div className="text-sm font-bold text-red-500 bg-red-50 py-2 rounded-xl animate-pulse">{status}</div>}
          <a href={`/e/${slug}`} className="block text-xs font-bold text-slate-400 hover:text-[#00c2e8] mt-8">
            公開ページに戻る
          </a>
        </div>
      </main>
    );
  }

  // ==========================================
  // 2. 編集画面メイン (Wolt Style)
  // ==========================================
  return (
    <main className="min-h-screen bg-[#f7f9fb] pb-24 font-sans">
      
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-100 px-4 py-3 shadow-sm flex items-center justify-between">
         <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-[#00c2e8]">
              <Edit3 className="w-4 h-4" />
            </div>
            <div className="font-black text-slate-800 text-sm truncate">{eventTitle || slug}</div>
         </div>
         <div className="flex gap-2">
            <a href={`/e/${slug}`} target="_blank" className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-[#00c2e8] hover:bg-cyan-50 transition-all"><ArrowUpRight className="w-5 h-5"/></a>
            <button onClick={resetLock} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><LogOut className="w-5 h-5"/></button>
         </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-6">
        {/* Status Toast */}
        {status && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl bg-slate-800 text-white text-xs font-bold animate-bounce whitespace-nowrap">
            {status}
          </div>
        )}

        {/* === 入力フォーム (Wolt Card) === */}
        <div className="bg-white rounded-[2rem] shadow-[0_4px_12px_rgba(0,0,0,0.05)] overflow-hidden">
          <div className={`px-5 py-4 border-b border-slate-50 flex items-center justify-between ${editing ? "bg-blue-50/50" : "bg-white"}`}>
            <h2 className={`font-black text-sm flex items-center gap-2 ${editing ? "text-blue-600" : "text-slate-700"}`}>
              {editing ? "編集モード 📝" : "新しい予定を追加 ✨"}
            </h2>
            {editing && <button onClick={cancelEdit} className="text-[10px] font-bold text-slate-400 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm">キャンセル</button>}
          </div>

          <div className="p-5 space-y-5">
            {/* 時間 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-1">開始</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full h-12 bg-slate-50 rounded-2xl text-center font-bold text-lg outline-none focus:bg-white focus:ring-4 focus:ring-cyan-50 transition-all"/>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 ml-1">終了</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full h-12 bg-slate-50 rounded-2xl text-center font-bold text-lg outline-none focus:bg-white focus:ring-4 focus:ring-cyan-50 transition-all"/>
              </div>
            </div>

            {/* ★アイコンとタイトル */}
            <div className="flex gap-3">
               <div className="space-y-1 w-[4.5rem] shrink-0">
                  <label className="text-[10px] font-bold text-slate-400 ml-1 flex items-center gap-1"><Smile className="w-3 h-3"/> Icon</label>
                  <input type="text" value={emoji} onChange={(e)=>setEmoji(e.target.value)} className="w-full h-12 bg-slate-50 rounded-2xl text-center text-2xl outline-none focus:bg-white focus:ring-4 focus:ring-cyan-50 transition-all" placeholder="🎵" />
               </div>
               <div className="space-y-1 flex-1">
                  <label className="text-[10px] font-bold text-slate-400 ml-1">タイトル</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: リハーサル" className="w-full h-12 px-4 bg-slate-50 rounded-2xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-cyan-50 transition-all placeholder:text-slate-300"/>
               </div>
            </div>

            {/* ターゲット */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 ml-1">対象 (木管, スタッフ...)</label>
              <div className="relative">
                <Tag className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                <input type="text" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="全員" className="w-full h-12 pl-10 pr-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:bg-white focus:ring-4 focus:ring-cyan-50 transition-all" list="target-suggestions"/>
                <datalist id="target-suggestions"><option value="全員"/><option value="木管"/><option value="金管"/><option value="打楽器"/><option value="弦楽器"/><option value="スタッフ"/></datalist>
              </div>
              {recentTags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {recentTags.map((t) => (
                    <button key={t} onClick={() => setTarget(t)} className={`text-[10px] px-2 py-1 rounded-lg font-bold transition-all border ${target === t ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-500 border-slate-200"}`}>{t}</button>
                  ))}
                </div>
              )}
            </div>

            {/* 場所・メモ */}
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="場所" className="h-10 px-4 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-cyan-50"/>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="メモ" className="h-10 px-4 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:bg-white focus:ring-2 focus:ring-cyan-50"/>
            </div>

            {/* 詳細設定 */}
            <div className="pt-1">
               <details className="group">
                  <summary className="text-[10px] font-bold text-slate-400 cursor-pointer list-none flex items-center gap-1"><ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" /> 詳細設定</summary>
                  <div className="mt-2 flex items-center gap-2"><span className="text-xs text-slate-400 font-bold">並び順優先度:</span><input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value || "0", 10))} className="w-16 h-8 px-2 bg-slate-50 rounded-lg text-sm text-center font-bold outline-none"/></div>
               </details>
            </div>

            {/* Submit */}
            <button onClick={saveItem} className={`w-full h-14 rounded-2xl font-black text-white shadow-lg shadow-cyan-100 active:scale-95 transition-all flex items-center justify-center gap-2 ${editing ? "bg-blue-600" : "bg-[#00c2e8]"}`}>
              {editing ? <RefreshCw className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {editing ? "更新する" : "追加する"}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3 pb-10">
          {items.map((it) => (
            <div key={it.id} className="bg-white p-4 rounded-[1.2rem] shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center gap-4 transition-all">
              <div className="w-12 shrink-0 text-right space-y-0.5">
                <div className="font-black text-slate-800 text-sm">{hhmm(it.start_time)}</div>
                {it.end_time && <div className="text-[10px] font-bold text-slate-400">{hhmm(it.end_time)}</div>}
              </div>
              
              {/* アイコン表示 */}
              <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-2xl shrink-0">
                {it.emoji || "🎵"}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-black text-slate-800 text-sm truncate">{it.title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                   <span className={`text-[10px] px-1.5 py-0.5 rounded font-black ${getTargetColor(it.target)}`}>{it.target || "全員"}</span>
                   {it.location && <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5"><MapPin className="w-3 h-3"/>{it.location}</span>}
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => startEdit(it)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"><Edit3 className="w-4 h-4" /></button>
                <button onClick={() => removeItem(it.id)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-center py-10 text-slate-300 font-bold text-sm bg-white rounded-[2rem] border border-dashed border-slate-200">まだ予定がありません</div>}
        </div>
      </div>
    </main>
  );
}