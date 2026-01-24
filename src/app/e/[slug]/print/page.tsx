export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";

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

// ★ D：最終更新（印刷用：簡易）
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

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const target = sp?.t ?? "all";

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

  return (
    <main className="page">
      <style>{`
        /* 画面上の見た目 */
        .page { padding: 20px; background: #fff; color: #111; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; }
        .header { display: flex; justify-content: space-between; gap: 12px; align-items: flex-end; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 12px; }
        .title { font-size: 18px; font-weight: 800; line-height: 1.2; }
        .meta { font-size: 12px; opacity: 0.8; margin-top: 6px; }
        .badge { font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 999px; border: 1px solid #e5e7eb; }
        .grid { display: grid; gap: 10px; }
        .timeRow { margin-top: 10px; }
        .timeLabel { font-size: 13px; font-weight: 800; margin: 10px 0 6px; }
        .card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 10px; }
        .row { display: flex; gap: 10px; align-items: baseline; }
        .t { font-weight: 800; min-width: 78px; }
        .name { font-weight: 800; }
        .tag { margin-left: auto; font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid #e5e7eb; opacity: 0.9; }
        .sub { margin-top: 6px; font-size: 12px; opacity: 0.85; }
        .sub div { margin-top: 2px; }

        /* 印刷用 */
        @media print {
          .page { padding: 0; }
          .header { margin-bottom: 8px; }
          .card { break-inside: avoid; }
          a { color: inherit; text-decoration: none; }
        }
      `}</style>

      <header className="header">
        <div>
          <div className="title">{event.title}</div>
          <div className="meta">
            {event.date} / {event.venue_name ?? "会場未設定"}
          </div>

          {/* ★ D：最終更新（印刷用） */}
          {lastUpdated && (
            <div className="meta">最終更新：{fmtJst(lastUpdated)}</div>
          )}
        </div>

        <div className="badge">印刷用：{targetLabel(target)}</div>
      </header>

      <section className="grid">
        {groups.map((g) => (
          <div className="timeRow" key={g.time}>
            <div className="timeLabel">
              {g.time}
              {g.items.length > 1 ? `（同時に${g.items.length}件）` : ""}
            </div>

            <div className="grid">
              {g.items.map((it: any) => (
                <div className="card" key={it.id}>
                  <div className="row">
                    <div className="t">
                      {hhmm(it.start_time)}
                      {it.end_time ? `–${hhmm(it.end_time)}` : ""}
                    </div>
                    <div className="name">{it.title}</div>
                    <div className="tag">{targetLabel(it.target)}</div>
                  </div>

                  {(it.location || it.note) && (
                    <div className="sub">
                      {it.location && <div>📍 {it.location}</div>}
                      {it.note && <div>{it.note}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}