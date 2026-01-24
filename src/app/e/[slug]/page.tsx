export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";
import ShareButtons from "@/components/ShareButtons";

/* ===== 便利関数 ===== */
function hhmm(time: string) {
  return String(time).slice(0, 5);
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

function groupByStartTime(items: any[]) {
  const map = new Map<string, any[]>();
  for (const item of items) {
    const key = hhmm(item.start_time);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([time, items]) => ({
    time,
    items: items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
  }));
}

// ★ A：現在進行中かどうか
function isNow(start: string, end?: string | null) {
  const now = new Date();

  const [sh, sm] = start.slice(0, 5).split(":").map(Number);
  const s = new Date();
  s.setHours(sh, sm, 0, 0);

  if (!end) return false;

  const [eh, em] = end.slice(0, 5).split(":").map(Number);
  const e = new Date();
  e.setHours(eh, em, 0, 0);

  return now >= s && now <= e;
}

// ★ D：最終更新表示（日時処理）
function toDate(v: any) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtJst(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${day} ${hh}:${mm}`;
}

function relativeJa(d: Date) {
  const diffMs = Date.now() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}秒前`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  return `${day}日前`;
}

/* ===== ページ本体 ===== */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const target = sp?.t ?? "all";

  /* イベント取得 */
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) {
    return (
      <main style={{ padding: 24 }}>
        <h1>見つかりませんでした</h1>
      </main>
    );
  }

  /* スケジュール取得 */
  const { data: items } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("event_id", event.id)
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });

  // ★ D：最終更新（events.updated_at / schedule_items.updated_at or created_at の最大）
  const candidates: Date[] = [];

  const evUpd = toDate((event as any).updated_at);
  if (evUpd) candidates.push(evUpd);

  for (const it of items ?? []) {
    const d = toDate((it as any).updated_at) || toDate((it as any).created_at);
    if (d) candidates.push(d);
  }

  const lastUpdated =
    candidates.length > 0
      ? new Date(Math.max(...candidates.map((d) => d.getTime())))
      : null;

  const filtered =
    target === "all"
      ? items ?? []
      : (items ?? []).filter(
          (it) => it.target === target || it.target === "all"
        );

  const groups = groupByStartTime(filtered);

  const tabs = [
    { key: "all", label: "全員" },
    { key: "woodwinds", label: "木管" },
    { key: "brass", label: "金管" },
    { key: "perc", label: "打楽器" },
    { key: "staff", label: "スタッフ" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "#f6f7f9", padding: 20 }}>
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        {/* ヘッダー */}
        <header
          style={{
            background: "#fff",
            borderRadius: 16,
            padding: 20,
            marginBottom: 12,
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>{event.title}</h1>
          <div style={{ marginTop: 6, opacity: 0.8 }}>
            {event.date} / {event.venue_name ?? "会場未設定"}
          </div>

          {/* ★ D：最終更新 */}
          {lastUpdated && (
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
              最終更新：{fmtJst(lastUpdated)}（{relativeJa(lastUpdated)}）
            </div>
          )}
        </header>

        {/* 共有（フィルタ状態のURLコピー） */}
        <ShareButtons slug={slug} currentKey={target} tabs={tabs} />

        {/* フィルタボタン */}
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          {tabs.map((t) => (
            <a
              key={t.key}
              href={`/e/${slug}?t=${t.key}`}
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                fontWeight: 800,
                textDecoration: "none",
                background: target === t.key ? "#111827" : "#ffffff",
                color: target === t.key ? "#ffffff" : "#111827",
                border: "1px solid rgba(0,0,0,0.15)",
              }}
            >
              {t.label}
            </a>
          ))}
        </div>

        {/* タイムライン */}
        <section style={{ display: "grid", gap: 20 }}>
          {groups.map((group) => (
            <div key={group.time}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>
                {group.time}
                {group.items.length > 1 && `（同時に${group.items.length}件）`}
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {group.items.map((it: any) => {
                  const now = isNow(it.start_time, it.end_time);

                  return (
                    <div
                      key={it.id}
                      style={{
                        background: now ? "#eef6ff" : "#fff",
                        borderRadius: 14,
                        padding: 14,
                        boxShadow: now
                          ? "0 0 0 2px #3b82f6 inset"
                          : undefined,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <div style={{ fontWeight: 800, minWidth: 70 }}>
                          {hhmm(it.start_time)}
                          {it.end_time ? `–${hhmm(it.end_time)}` : ""}
                        </div>

                        <div style={{ fontWeight: 800 }}>
                          {it.title}
                          {now && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: 12,
                                fontWeight: 800,
                                color: "#2563eb",
                              }}
                            >
                              進行中
                            </span>
                          )}
                        </div>

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
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 13,
                            opacity: 0.85,
                          }}
                        >
                          {it.location && <div>📍 {it.location}</div>}
                          {it.note && <div style={{ marginTop: 4 }}>{it.note}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}