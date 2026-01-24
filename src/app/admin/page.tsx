"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type EventRow = {
  id: string;
  title: string;
  slug: string;
};

export default function AdminPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [eventId, setEventId] = useState<string>("");

  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [target, setTarget] = useState("all");
  const [sortOrder, setSortOrder] = useState(0);

  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id,title,slug")
        .order("updated_at", { ascending: false });

      if (error) {
        setStatus(error.message);
        return;
      }
      setEvents(data ?? []);
      if ((data ?? []).length > 0) setEventId((data ?? [])[0].id);
    })();
  }, []);

  const selected = useMemo(
    () => events.find((e) => e.id === eventId),
    [events, eventId]
  );

  async function addItem() {
    setStatus("保存中...");

    if (!eventId) {
      setStatus("イベントを選んでください");
      return;
    }
    if (!title.trim()) {
      setStatus("タイトルが空です");
      return;
    }

    const payload: any = {
      event_id: eventId,
      start_time: startTime + ":00",
      end_time: endTime ? endTime + ":00" : null,
      title: title.trim(),
      location: location.trim() || null,
      note: note.trim() || null,
      target,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    const { error } = await supabase.from("schedule_items").insert(payload);

    if (error) {
      setStatus("エラー: " + error.message);
      return;
    }

    setStatus("保存しました。公開ページを更新して確認してください。");
    // 入力だけ少しリセット
    setTitle("");
    setLocation("");
    setNote("");
  }

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 700 }}>管理：タイムライン追加</h1>

      <div style={{ marginTop: 14, opacity: 0.8 }}>
        公開ページ：{" "}
        <a
          href={selected ? `/e/${selected.slug}` : "#"}
          style={{ textDecoration: "underline" }}
        >
          {selected ? `/e/${selected.slug}` : "（イベント未選択）"}
        </a>
      </div>

      <div
        style={{
          marginTop: 18,
          display: "grid",
          gap: 12,
          background: "#fff",
          padding: 16,
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.08)",
        }}
      >
        <label>
          イベント
          <select
            value={eventId}
            onChange={(e) => setEventId(e.target.value)}
            style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
          >
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.title}（{e.slug}）
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            開始
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
            />
          </label>

          <label>
            終了（任意）
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
            />
          </label>
        </div>

        <label>
          タイトル
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例：集合 / 全体リハ / 本番"
            style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          場所（任意）
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="例：ホワイエ / リハ室A"
            style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <label>
          メモ（任意）
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例：名札配布 / 搬入導線注意"
            style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            対象
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
            >
              <option value="all">全員</option>
              <option value="woodwinds">木管</option>
              <option value="brass">金管</option>
              <option value="perc">打楽器</option>
              <option value="staff">スタッフ</option>
            </select>
          </label>

          <label>
            並び順（小さいほど上）
            <input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value || "0", 10))}
              style={{ display: "block", width: "100%", padding: 10, marginTop: 6 }}
            />
          </label>
        </div>

        <button
          onClick={addItem}
          style={{
            padding: 12,
            borderRadius: 12,
            border: "none",
            fontWeight: 700,
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          追加する
        </button>

        {status && (
          <div style={{ fontSize: 13, opacity: 0.8, whiteSpace: "pre-wrap" }}>
            {status}
          </div>
        )}
      </div>
    </main>
  );
}