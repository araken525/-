"use client";

import { useState, use, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

function hhmm(t: string) {
  return String(t).slice(0, 5);
}
function targetLabel(t: string) {
  switch (t) {
    case "all":
      return "全員";
    case "woodwinds":
      return "木管";
    case "brass":
      return "金管";
    case "perc":
      return "打楽器";
    case "staff":
      return "スタッフ";
    default:
      return t;
  }
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

  // form
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [target, setTarget] = useState("all");
  const [sortOrder, setSortOrder] = useState(0);

  // イベント取得（id + title）
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
  }

  useEffect(() => {
    if (eventId) loadItems();
  }, [eventId]);

  // 既に通過済みなら復元
  useEffect(() => {
    if (sessionStorage.getItem(`edit-ok:${slug}`)) setOk(true);
  }, [slug]);

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

  async function saveItem() {
    if (!eventId) return setStatus("イベントが見つかりません");
    if (!title.trim()) return setStatus("タイトル必須です");

    const payload = {
      event_id: eventId,
      start_time: startTime + ":00",
      end_time: endTime ? endTime + ":00" : null,
      title: title.trim(),
      location: location.trim() || null,
      note: note.trim() || null,
      target,
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
    setEditing(null);
    setTitle("");
    setLocation("");
    setNote("");
    loadItems();
  }

  async function removeItem(id: string) {
    if (!confirm("削除しますか？")) return;
    const { error } = await supabase.from("schedule_items").delete().eq("id", id);
    if (error) return setStatus("エラー: " + error.message);
    setStatus("削除しました");
    loadItems();
  }

  function startEdit(it: any) {
    setEditing(it);
    setStartTime(hhmm(it.start_time));
    setEndTime(it.end_time ? hhmm(it.end_time) : "");
    setTitle(it.title ?? "");
    setLocation(it.location ?? "");
    setNote(it.note ?? "");
    setTarget(it.target ?? "all");
    setSortOrder(it.sort_order ?? 0);
    setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditing(null);
    setTitle("");
    setLocation("");
    setNote("");
    setStatus("");
  }

  // ===== ログイン前（パスワード） =====
  if (!ok) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#f6f7f9",
          display: "grid",
          placeItems: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            width: 360,
            background: "#fff",
            borderRadius: 16,
            padding: 20,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            公開ページ：
            <a
              href={`/e/${slug}`}
              style={{ marginLeft: 6, textDecoration: "underline" }}
            >
              /e/{slug}
            </a>
          </div>

          <h1 style={{ marginTop: 10, fontSize: 18, fontWeight: 800 }}>
            編集用パスワード
          </h1>

          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
            合言葉を知っている人だけ編集できます（ログイン不要）
          </div>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            style={{
              width: "100%",
              padding: 10,
              marginTop: 12,
              borderRadius: 10,
              border: "1px solid rgba(0,0,0,0.15)",
            }}
          />

          <button
            onClick={checkPassword}
            style={{
              width: "100%",
              marginTop: 12,
              padding: 10,
              borderRadius: 10,
              border: "none",
              background: "#111827",
              color: "#fff",
              fontWeight: 800,
              cursor: "pointer",
            }}
          >
            編集する
          </button>

          {status && (
            <div style={{ marginTop: 10, fontSize: 13, color: "#dc2626" }}>
              {status}
            </div>
          )}
        </div>
      </main>
    );
  }

  // ===== 編集モード =====
  return (
    <main style={{ minHeight: "100vh", background: "#f6f7f9", padding: 20 }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* 上部バー */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: 999,
                background: "#eef6ff",
              }}
            >
              編集モード
            </div>

            <div style={{ fontWeight: 800 }}>
              {eventTitle ? eventTitle : slug}
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <a
                href={`/e/${slug}`}
                style={{
                  padding: "8px 10px",
                  borderRadius: 12,
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.15)",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                公開ページを見る
              </a>
              <button
                onClick={resetLock}
                style={{
                  padding: "8px 10px",
                  borderRadius: 12,
                  background: "#fff",
                  border: "1px solid rgba(0,0,0,0.15)",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                編集権限を解除
              </button>
            </div>
          </div>

          <div style={{ marginTop: 10, fontSize: 13, opacity: 0.75 }}>
            ※ 合言葉が漏れたら編集されます。運営メンバーだけに共有してください。
          </div>
        </div>

        {/* 追加/編集フォーム */}
        <div
          style={{
            marginTop: 14,
            background: "#fff",
            borderRadius: 16,
            padding: 16,
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ fontWeight: 800 }}>
            {editing ? "予定を編集" : "予定を追加"}
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ fontSize: 13 }}>
                開始
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  style={{ width: "100%", padding: 10, marginTop: 6, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
                />
              </label>
              <label style={{ fontSize: 13 }}>
                終了（任意）
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  style={{ width: "100%", padding: 10, marginTop: 6, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
                />
              </label>
            </div>

            <label style={{ fontSize: 13 }}>
              タイトル
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例：集合 / 全体リハ / 本番"
                style={{ width: "100%", padding: 10, marginTop: 6, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
              />
            </label>

            <label style={{ fontSize: 13 }}>
              場所（任意）
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="例：ホワイエ / リハ室A"
                style={{ width: "100%", padding: 10, marginTop: 6, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
              />
            </label>

            <label style={{ fontSize: 13 }}>
              メモ（任意）
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例：名札配布 / 搬入導線注意"
                style={{ width: "100%", padding: 10, marginTop: 6, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
              />
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ fontSize: 13 }}>
                対象
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  style={{ width: "100%", padding: 10, marginTop: 6, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
                >
                  <option value="all">全員</option>
                  <option value="woodwinds">木管</option>
                  <option value="brass">金管</option>
                  <option value="perc">打楽器</option>
                  <option value="staff">スタッフ</option>
                </select>
              </label>

              <label style={{ fontSize: 13 }}>
                並び順（小さいほど上）
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value || "0", 10))}
                  style={{ width: "100%", padding: 10, marginTop: 6, borderRadius: 10, border: "1px solid rgba(0,0,0,0.15)" }}
                />
              </label>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={saveItem}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "none",
                  background: "#111827",
                  color: "#fff",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                {editing ? "更新" : "追加"}
              </button>

              {editing && (
                <button
                  onClick={cancelEdit}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.15)",
                    background: "#fff",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  キャンセル
                </button>
              )}

              <button
                onClick={loadItems}
                style={{
                  marginLeft: "auto",
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.15)",
                  background: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                再読み込み
              </button>
            </div>

            {status && (
              <div style={{ fontSize: 13, opacity: 0.8, whiteSpace: "pre-wrap" }}>
                {status}
              </div>
            )}
          </div>
        </div>

        {/* 一覧 */}
        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 8 }}>
            既存予定（{items.length}件）
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {items.map((it) => (
              <div
                key={it.id}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ fontWeight: 800, minWidth: 70 }}>
                    {hhmm(it.start_time)}
                    {it.end_time ? `–${hhmm(it.end_time)}` : ""}
                  </div>
                  <div style={{ fontWeight: 800 }}>{it.title}</div>
                  <div
                    style={{
                      marginLeft: "auto",
                      fontSize: 12,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background: "#eef1f6",
                    }}
                  >
                    {targetLabel(it.target)}
                  </div>
                </div>

                {(it.location || it.note) && (
                  <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                    {it.location && <div>📍 {it.location}</div>}
                    {it.note && <div style={{ marginTop: 4 }}>{it.note}</div>}
                  </div>
                )}

                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button
                    onClick={() => startEdit(it)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.15)",
                      background: "#fff",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => removeItem(it.id)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.15)",
                      background: "#fff",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 18, fontSize: 12, opacity: 0.65 }}>
          TIP：編集URL（/edit）は運営だけ。参加者には公開URL（/e/...）を送るのが安全です。
        </div>
      </div>
    </main>
  );
}