export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import EventHeader from "@/components/EventHeader"; // ★作成したコンポーネント
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

function getTargetColor(t: string) {
  const colors = [
    "bg-red-50 text-red-600", "bg-orange-50 text-orange-700", "bg-amber-50 text-amber-700",
    "bg-yellow-50 text-yellow-700", "bg-lime-50 text-lime-700", "bg-green-50 text-green-700",
    "bg-emerald-50 text-emerald-700", "bg-teal-50 text-teal-700", "bg-cyan-50 text-cyan-700",
    "bg-sky-50 text-sky-700", "bg-blue-50 text-blue-700", "bg-indigo-50 text-indigo-700",
    "bg-violet-50 text-violet-700", "bg-purple-50 text-purple-700", "bg-fuchsia-50 text-fuchsia-700",
    "bg-pink-50 text-pink-700", "bg-rose-50 text-rose-700",
  ];
  if (!t || t === "all" || t === "全員") return "bg-slate-100 text-slate-500";
  let sum = 0;
  for (let i = 0; i < t.length; i++) sum += t.charCodeAt(i);
  return colors[sum % colors.length];
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
   ページ本体
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
      <main className="flex min-h-screen items-center justify-center p-6 bg-slate-50">
        <div className="text-center bg-white/50 backdrop-blur-xl p-8 rounded-3xl shadow-sm">
          <h1 className="text-lg font-bold mb-4">イベントが見つかりません</h1>
          <Link href="/" className="px-6 py-3 rounded-full bg-blue-500 text-white font-bold">トップへ戻る</Link>
        </div>
      </main>
    );
  }

  const { data: items } = await supabase.from("schedule_items").select("*").eq("event_id", event.id).order("start_time", { ascending: true }).order("sort_order", { ascending: true });
  const allItems = items ?? [];

  /* タブ生成 */
  const tagsSet = new Set<string>();
  allItems.forEach(item => {
    if (item.target && item.target !== "all" && item.target !== "全員") tagsSet.add(item.target);
  });
  const dynamicTabs = ["全員", ...Array.from(tagsSet).sort()];
  const tabs = dynamicTabs.map(t => ({ key: t, label: t }));

  /* フィルタ */
  const filtered = target === "全員" ? allItems : allItems.filter(it => it.target === target || it.target === "全員");
  const groups = groupByStartTime(filtered);

  /* 最終更新 */
  const candidates: Date[] = [];
  const evUpd = toDate((event as any).updated_at);
  if (evUpd) candidates.push(evUpd);
  for (const it of allItems) {
    const d = toDate((it as any).updated_at) || toDate((it as any).created_at);
    if (d) candidates.push(d);
  }
  const lastUpdated = candidates.length > 0 ? new Date(Math.max(...candidates.map((d) => d.getTime()))) : null;

  return (
    <main className="min-h-screen pb-24 font-sans aurora-bg">
      
      {/* 1. ヘッダー (Client Component) */}
      <EventHeader title={event.title} slug={slug} />

      {/* 2. メインコンテンツ (ヘッダーの高さ分下げる) */}
      <div className="pt-20 px-4 space-y-8">
        
        {/* === コントロールパネル (メインカード) === */}
        <section className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 shadow-sm border border-white/60">
          {/* イベントタイトル (大) */}
          <h1 className="text-2xl font-black text-slate-800 leading-tight tracking-tight mb-4">
            {event.title}
          </h1>

          {/* 日時・場所 */}
          <div className="flex flex-wrap gap-2 mb-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-700">{event.date}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-100 shadow-sm">
               <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-700">{event.venue_name ?? "場所未定"}</span>
            </div>
          </div>

          {/* フィルタタブ (横スクロール) */}
          <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
            {tabs.map((t) => {
              const isActive = target === t.key;
              return (
                <Link
                  key={t.key}
                  href={`/e/${slug}?t=${encodeURIComponent(t.key)}`}
                  scroll={false}
                  className={`
                    flex-shrink-0 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all duration-300 select-none
                    ${isActive 
                      ? "anka-gradient text-white shadow-lg shadow-blue-200 scale-105" 
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"}
                  `}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </section>

        {/* === タイムライン === */}
        <section className="space-y-8">
          {groups.map((group) => (
            <div key={group.time} className="relative pl-2">
              {/* 時間 (Anka風シンプル) */}
              <div className="flex items-center mb-3">
                <div className="text-xl font-black text-slate-800 font-mono tracking-tighter w-14">
                  {group.time}
                </div>
                <div className="h-0.5 w-8 bg-slate-200 rounded-full"></div>
              </div>

              {/* カード群 */}
              <div className="space-y-4">
                {group.items.map((it: any) => {
                  const now = isNow(it.start_time, it.end_time);
                  const badgeColor = getTargetColor(it.target);

                  return (
                    <div
                      key={it.id}
                      className={`
                        relative overflow-hidden rounded-3xl transition-all duration-300
                        ${now 
                          ? "bg-white shadow-xl shadow-blue-200/50 ring-2 ring-blue-400 transform scale-[1.01]" 
                          : "bg-white shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-white/50"}
                      `}
                    >
                      {/* NOWボーダー */}
                      {now && <div className="absolute top-0 left-0 right-0 h-1.5 anka-gradient"></div>}

                      <div className="p-5">
                        <div className="flex justify-between items-start mb-3">
                           <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold ${badgeColor}`}>
                            {it.target || "全員"}
                          </span>
                          {now && (
                             <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black animate-pulse">
                               <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                               NOW
                             </span>
                          )}
                        </div>
                       
                        <h3 className={`text-lg font-bold leading-snug tracking-tight mb-3 ${now ? "text-slate-900" : "text-slate-700"}`}>
                          {it.title}
                        </h3>

                        {(it.end_time || it.location || it.note) && (
                          <div className="pt-3 border-t border-slate-50 space-y-2.5">
                            {it.end_time && (
                              <div className="flex items-center text-xs font-bold text-slate-400">
                                <Clock className="w-3.5 h-3.5 mr-2 opacity-50" />
                                {hhmm(it.end_time)} <span className="text-[10px] font-normal ml-1">まで</span>
                              </div>
                            )}
                            
                            {it.location && (
                              <div className="flex items-start text-xs font-bold text-slate-500">
                                <MapPin className="w-3.5 h-3.5 mr-2 shrink-0 opacity-50 text-indigo-400" />
                                {it.location}
                              </div>
                            )}
                            
                            {it.note && (
                              <div className="flex items-start mt-1 bg-slate-50/80 p-3 rounded-2xl text-sm text-slate-600 leading-relaxed border border-slate-100/50">
                                <Info className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-slate-400" />
                                <span className="whitespace-pre-wrap">{it.note}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {groups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2">
              <Calendar className="w-10 h-10 opacity-20" />
              <p className="text-sm font-bold opacity-50">予定なし</p>
            </div>
          )}
        </section>
        
        <div className="h-10"></div>
      </div>

      {/* 最終更新 (右下にフロート) */}
      {lastUpdated && (
        <div className="fixed bottom-6 right-6 z-30 pointer-events-none">
          <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full flex items-center shadow-lg text-[10px] font-bold text-slate-500 border border-white/50">
             <RefreshCw className="w-3 h-3 mr-1.5" />
             {relativeJa(lastUpdated)} 更新
          </div>
        </div>
      )}
    </main>
  );
}