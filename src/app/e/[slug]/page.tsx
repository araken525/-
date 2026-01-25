export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import EventHeader from "@/components/EventHeader";
import Link from "next/link";
import { Clock, MapPin, RefreshCw, Info, Calendar } from "lucide-react";

/* ==========================================
   メタデータ (OGP)
   ========================================== */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data: event } = await supabase.from("events").select("title, date, venue_name").eq("slug", slug).maybeSingle();
  if (!event) return { title: "イベントが見つかりません | Takt" };

  const desc = `${event.date} @${event.venue_name ?? "未設定"} | リアルタイム進行共有`;
  return {
    title: `${event.title} | Takt`,
    description: desc,
    openGraph: { title: event.title, description: desc, siteName: "Takt", locale: "ja_JP", type: "website" },
  };
}

/* ==========================================
   便利関数
   ========================================== */
function hhmm(time: string) { return String(time).slice(0, 5); }

// note風: シンプルなグレー背景＋文字色、重要なものだけ色付け
function getTargetColor(t: string) {
  if (!t || t === "all" || t === "全員") return "bg-gray-100 text-gray-600 border-gray-200";
  // その他は淡いグリーン系で統一するか、シンプルに
  return "bg-[#2cb696]/10 text-[#2cb696] border-[#2cb696]/20";
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

function toDate(v: any) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function relativeJa(d: Date) {
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 1000 / 60);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  return d.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ==========================================
   ページ本体 (note Style)
   ========================================== */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const rawTarget = sp?.t ? decodeURIComponent(sp.t) : "全員";
  const target = rawTarget === "all" ? "全員" : rawTarget;

  /* データ取得 */
  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 bg-white">
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-400 mb-4">イベントが見つかりません</h1>
          <Link href="/" className="px-6 py-3 rounded-lg bg-[#2cb696] text-white font-bold">トップへ戻る</Link>
        </div>
      </main>
    );
  }

  const { data: items } = await supabase.from("schedule_items").select("*").eq("event_id", event.id).order("start_time", { ascending: true }).order("sort_order", { ascending: true });
  const allItems = items ?? [];

  const tagsSet = new Set<string>();
  allItems.forEach(item => {
    if (item.target && item.target !== "all" && item.target !== "全員") tagsSet.add(item.target);
  });
  const dynamicTabs = ["全員", ...Array.from(tagsSet).sort()];
  const tabs = dynamicTabs.map(t => ({ key: t, label: t }));

  const filtered = target === "全員" ? allItems : allItems.filter(it => it.target === target || it.target === "全員");
  const groups = groupByStartTime(filtered);

  const candidates: Date[] = [];
  const evUpd = toDate((event as any).updated_at);
  if (evUpd) candidates.push(evUpd);
  for (const it of allItems) {
    const d = toDate((it as any).updated_at) || toDate((it as any).created_at);
    if (d) candidates.push(d);
  }
  const lastUpdated = candidates.length > 0 ? new Date(Math.max(...candidates.map((d) => d.getTime()))) : null;

  return (
    <main className="min-h-screen pb-24 font-sans bg-[#F9F9F9]"> {/* noteっぽい薄いグレー背景 */}
      
      <EventHeader title={event.title} slug={slug} />

      <div className="pt-20 px-4 max-w-2xl mx-auto space-y-6">
        
        {/* === コントロールパネル === */}
        <section className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          {/* タイトル：明朝体ではなくゴシックで読みやすく */}
          <h1 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight mb-4">
            {event.title}
          </h1>

          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{event.date}</span>
            </div>
            <div className="w-px h-4 bg-gray-300 self-center mx-1"></div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>{event.venue_name ?? "場所未定"}</span>
            </div>
          </div>

          {/* フィルタタブ：noteのタグ風 */}
          <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
            {tabs.map((t) => {
              const isActive = target === t.key;
              return (
                <Link
                  key={t.key}
                  href={`/e/${slug}?t=${encodeURIComponent(t.key)}`}
                  scroll={false}
                  className={`
                    flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all border
                    ${isActive 
                      ? "bg-[#2cb696] text-white border-[#2cb696]" 
                      : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300"}
                  `}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </section>

        {/* === タイムライン === */}
        <section className="space-y-6">
          {groups.map((group) => (
            <div key={group.time} className="relative">
              {/* 時間ヘッダー */}
              <div className="flex items-center mb-3 sticky top-14 z-10 bg-[#F9F9F9] py-2">
                <span className="text-lg font-bold text-gray-900 w-14 font-mono">
                  {group.time}
                </span>
                <div className="h-px bg-gray-200 flex-1"></div>
              </div>

              <div className="space-y-3 pl-2">
                {group.items.map((it: any) => {
                  const now = isNow(it.start_time, it.end_time);
                  const badgeColor = getTargetColor(it.target);

                  return (
                    <div
                      key={it.id}
                      className={`
                        relative rounded-xl border p-5 transition-all
                        ${now 
                          ? "bg-white border-[#2cb696] shadow-md ring-1 ring-[#2cb696]/20" 
                          : "bg-white border-gray-200 shadow-sm"}
                      `}
                    >
                      {/* NOWバッジ */}
                      {now && (
                        <div className="absolute top-0 right-0 px-3 py-1 bg-[#2cb696] text-white text-[10px] font-bold rounded-bl-xl rounded-tr-xl">
                          NOW
                        </div>
                      )}

                      <div className="mb-2">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
                          {it.target || "全員"}
                        </span>
                      </div>
                       
                      <h3 className={`text-lg font-bold leading-snug mb-3 ${now ? "text-gray-900" : "text-gray-800"}`}>
                        {it.title}
                      </h3>

                      {(it.end_time || it.location || it.note) && (
                        <div className="pt-3 border-t border-gray-100 space-y-2 text-sm text-gray-600">
                          {it.end_time && (
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-gray-400" />
                              <span className="font-bold text-gray-500">{hhmm(it.end_time)}</span>
                              <span className="text-xs ml-1">まで</span>
                            </div>
                          )}
                          {it.location && (
                            <div className="flex items-center font-bold">
                              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                              {it.location}
                            </div>
                          )}
                          {it.note && (
                            <div className="flex items-start mt-2 bg-gray-50 p-3 rounded-lg border border-gray-100 text-gray-700 leading-relaxed">
                              <Info className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-gray-400" />
                              <span className="whitespace-pre-wrap">{it.note}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {groups.length === 0 && (
             <div className="text-center py-10 text-gray-400 text-sm">予定が見つかりません</div>
          )}
        </section>
      </div>

      {/* 最終更新 */}
      {lastUpdated && (
        <div className="fixed bottom-6 right-6 z-30 pointer-events-none">
          <div className="bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-lg text-[10px] font-bold text-gray-500 flex items-center">
             <RefreshCw className="w-3 h-3 mr-1.5" />
             {relativeJa(lastUpdated)} 更新
          </div>
        </div>
      )}
    </main>
  );
}