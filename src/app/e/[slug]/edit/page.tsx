"use client";

import { useState, use, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lock, Unlock, ArrowUpRight, LogOut, Save, Plus, RefreshCw, MapPin, AlignLeft, ChevronDown, Edit3, Trash2, Tag } from "lucide-react";

/* ===== ヘルパー関数 ===== */
function hhmm(t: string) {
  return String(t).slice(0, 5);
}

// ターゲット名から色を自動生成する関数（ハッシュ化）
// 毎回同じ文字には同じ色が割り当てられます
function getTargetColor(t: string) {
  const colors = [
    "bg-red-100 text-red-700",
    "bg-orange-100 text-orange-800",
    "bg-amber-100 text-amber-800",
    "bg-yellow-100 text-yellow-800",
    "bg-lime-100 text-lime-800",
    "bg-green-100 text-green-700",
    "bg-emerald-100 text-emerald-700",
    "bg-teal-100 text-teal-800",
    "bg-cyan-100 text-cyan-800",
    "bg-sky-100 text-sky-800",
    "bg-blue-100 text-blue-800",
    "bg-indigo-100 text-indigo-700",
    "bg-violet-100 text-violet-700",
    "bg-purple-100 text-purple-800",
    "bg-fuchsia-100 text-fuchsia-800",
    "bg-pink-100 text-pink-800",
    "bg-rose-100 text-rose-800",
  ];
  if (t === "all" || t === "全員") return "bg-slate-100 text-slate-600";
  
  // 文字列の合計値を計算して色を決める
  let sum = 0;
  for (let i = 0; i < t.length; i++) {
    sum += t.charCodeAt(i);
  }
  return colors[sum % colors.length];
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
  
  // ★変更点：targetは自由入力なので初期値は空文字か'全員'
  const [target, setTarget] = useState("全員");
  const [sortOrder, setSortOrder] = useState(0);

  // 既に使用されているタグのリスト（サジェスト用）
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

    // ★使われているタグを収集してリスト化
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

  // 認証処理
  async function checkPassword() {
    setStatus("確認中...");
    const { data } = await supabase
      .from("events")
      .select("edit_password")
      .eq("slug", slug)
      .maybeSingle();

    if (!data?.edit_password) {
      setStatus("編集パスワードが未設定です");
      return;
    }

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
    setOk(false);
    setPassword("");
    setStatus("編集権限を解除しました");
    setEditing(null);
  }

  // 保存処理
  async function saveItem() {
    if (!eventId) return setStatus("イベントが見つかりません");
    if (!title.trim()) return setStatus("タイトル必須です");

    // ★ターゲットが空なら"全員"にする
    const finalTarget = target.trim() || "全員";

    const payload = {
      event_id: eventId,
      start_time: startTime + ":00",
      end_time: endTime ? endTime + ":00" : null,
      title: title.trim(),
      location: location.trim() || null,
      note: note.trim() || null,
      target: finalTarget,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    setStatus(editing ? "更新中..." : "追加中...");

    const res = editing
      ? await supabase
          .from("schedule_items")
          .update(payload)
          .eq("id", editing.id)
      : await supabase.from("schedule_items").insert(payload);

    if (res.error) return setStatus("エラー: " + res.error.message);

    setStatus(editing ? "更新しました" : "追加しました");
    
    if (!res.error) {
      setEditing(null);
      setTitle("");
      setLocation("");
      setNote("");
      // 時間とターゲットは連続入力のために維持する
      loadItems();
      setTimeout(() => setStatus(""), 3000);
    }
  }

  async function removeItem(id: string) {
    if (!confirm("本当に削除しますか？")) return;
    const { error } = await supabase.from("schedule_items").delete().eq("id", id);
    if (error) return setStatus("エラー: " + error.message);
    setStatus("削除しました");
    loadItems();
    setTimeout(() => setStatus(""), 3000);
  }

  function startEdit(it: any) {
    setEditing(it);
    setStartTime(hhmm(it.start_time));
    setEndTime(it.end_time ? hhmm(it.end_time) : "");
    setTitle(it.title ?? "");
    setLocation(it.location ?? "");
    setNote(it.note ?? "");
    setTarget(it.target ?? "全員");
    setSortOrder(it.sort_order ?? 0);
    setStatus("編集モード: " + it.title);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditing(null);
    setTitle("");
    setLocation("");
    setNote("");
    setStatus("");
  }

  // ==========================================
  // 1. ログイン前画面
  // ==========================================
  if (!ok) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-black text-slate-900">編集モード</h1>
            <p className="text-sm text-slate-500">パスワードを入力してください</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワード"
              className="w-full h-14 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-center text-lg font-bold focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition-all"
            />
            <button
              onClick={checkPassword}
              className="w-full h-14 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-5 h-5" />
              認証する
            </button>
          </div>
          {status && (
            <div className="text-sm font-bold text-red-500 bg-red-50 py-2 rounded-lg animate-pulse">
              {status}
            </div>
          )}
          <a href={`/e/${slug}`} className="block text-xs text-slate-400 hover:text-slate-600 underline decoration-slate-300 underline-offset-4 mt-8">
            公開ページに戻る
          </a>
        </div>
      </main>
    );
  }

  // ==========================================
  // 2. 編集画面メイン
  // ==========================================
  return (
    <main className="min-h-screen bg-slate-50 pb-24 font-sans">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600">
              <Edit3 className="w-4 h-4" />
            </div>
            <div className="font-bold text-slate-900 text-sm truncate max-w-[140px]">
              {eventTitle || slug}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/e/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-colors"
              title="公開ページを確認"
            >
              <ArrowUpRight className="w-5 h-5" />
            </a>
            <button
              onClick={resetLock}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              title="ログアウト"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto p-4 space-y-6">
        {status && (
          <div className={`
            fixed bottom-6 left-4 right-4 z-50 p-4 rounded-xl shadow-2xl text-center font-bold text-white text-sm
            ${status.includes("エラー") ? "bg-red-500" : "bg-slate-900"}
            animate-in slide-in-from-bottom-5 fade-in duration-300
          `}>
            {status}
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className={`px-4 py-3 border-b border-slate-100 flex items-center justify-between ${editing ? "bg-blue-50" : "bg-slate-50"}`}>
            <h2 className={`font-bold text-sm flex items-center gap-2 ${editing ? "text-blue-700" : "text-slate-700"}`}>
              {editing ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editing ? "予定を編集" : "新しい予定を追加"}
            </h2>
            {editing && (
              <button onClick={cancelEdit} className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-md border border-slate-200">
                キャンセル
              </button>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* 時間 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">開始</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-12 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-center font-bold text-lg outline-none transition-all"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">終了 (任意)</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-12 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-center font-bold text-lg outline-none transition-all"
                />
              </div>
            </div>

            {/* タイトル */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 ml-1">タイトル</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: リハーサル"
                className="w-full h-12 px-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 font-bold outline-none transition-all placeholder:font-normal placeholder:text-slate-300"
              />
            </div>

            {/* ★自由入力になったターゲット設定 */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 ml-1">対象（誰の予定？）</label>
              <div className="relative">
                <Tag className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="例: 全員, 木管, スタッフ, 1年生"
                  className="w-full h-12 pl-10 pr-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 font-bold text-sm outline-none transition-all placeholder:font-normal"
                  list="target-suggestions"
                />
                {/* ブラウザ標準のサジェスト機能 */}
                <datalist id="target-suggestions">
                  <option value="全員" />
                  <option value="木管" />
                  <option value="金管" />
                  <option value="打楽器" />
                  <option value="弦楽器" />
                  <option value="スタッフ" />
                </datalist>
              </div>

              {/* よく使うタグ（クリックで入力） */}
              {recentTags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {recentTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTarget(t)}
                      className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all border
                        ${target === t 
                          ? "bg-slate-800 text-white border-slate-800" 
                          : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}
                      `}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 場所・メモ */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 ml-1">場所 (任意)</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例: ホール、リハ室A"
                className="w-full h-12 px-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-sm font-bold outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 ml-1">メモ (任意)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例: 譜面台持参"
                className="w-full h-12 px-4 bg-slate-50 rounded-xl border-transparent focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 text-sm font-medium outline-none transition-all"
              />
            </div>

            {/* 詳細設定 */}
            <div className="pt-2 border-t border-slate-100">
               <details className="group">
                  <summary className="text-xs font-bold text-slate-400 cursor-pointer list-none flex items-center gap-1">
                    <ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
                    詳細設定（並び順）
                  </summary>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-slate-400">優先度:</span>
                    <input
                      type="number"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(parseInt(e.target.value || "0", 10))}
                      className="w-20 h-8 px-2 bg-slate-50 rounded-lg text-sm text-center border-none"
                    />
                  </div>
               </details>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              <button
                onClick={saveItem}
                className={`w-full h-12 rounded-xl font-bold text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2
                  ${editing ? "bg-blue-600 hover:bg-blue-500 shadow-blue-200" : "bg-slate-900 hover:bg-slate-800 shadow-slate-200"}
                `}
              >
                {editing ? <RefreshCw className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {editing ? "更新する" : "追加する"}
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-3 pb-10">
          {items.map((it) => (
            <div
              key={it.id}
              className={`
                relative bg-white p-4 rounded-xl border transition-all group
                ${editing?.id === it.id ? "border-blue-500 ring-2 ring-blue-100 shadow-md" : "border-slate-100 shadow-sm hover:border-slate-200"}
              `}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 shrink-0 text-right space-y-0.5">
                  <div className="font-black text-slate-900 leading-none">{hhmm(it.start_time)}</div>
                  {it.end_time && (
                    <div className="text-xs font-bold text-slate-400 leading-none">{hhmm(it.end_time)}</div>
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${getTargetColor(it.target)}`}>
                      {it.target || "全員"}
                    </span>
                    <h4 className="font-bold text-slate-900 leading-tight break-words">
                      {it.title}
                    </h4>
                  </div>
                  {(it.location || it.note) && (
                    <div className="text-xs text-slate-500 space-y-0.5">
                      {it.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 opacity-50" />
                          {it.location}
                        </div>
                      )}
                      {it.note && (
                        <div className="flex items-center gap-1 opacity-80">
                          <AlignLeft className="w-3 h-3 opacity-50" />
                          <span className="truncate">{it.note}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(it)}
                    className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeItem(it.id)}
                    className="w-8 h-8 flex items-center justify-center bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="text-center py-10 text-slate-300 font-bold text-sm bg-white rounded-xl border border-dashed border-slate-200">
              まだ予定がありません
            </div>
          )}
        </div>
      </div>
    </main>
  );
}