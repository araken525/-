export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import EventHeader from "@/components/EventHeader";
import Link from "next/link";
import { RefreshCw, MapPin, Calendar, Clock, Filter } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: event } = await supabase.from("events").select("title, date, venue_name").eq("slug", slug).maybeSingle();
  if (!event) return { title: "イベントが見つかりません | Takt" };
  const desc = `${event.date} @${event.venue_name ?? "未設定"} | リアルタイム進行共有`;
  return { title: `${event.title} | Takt`, description: desc, openGraph: { title: event.title, description: desc, siteName: "Takt", locale: "ja_JP", type: "website" } };
}

/* === ロジック系 === */
function hhmm(time: string) { return String(time).slice(0, 5); }

function getDayNumber(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split(/[-/]/);
  return parts.length === 3 ? parts[2] : "";
}

function getDuration(start: string, end?: string | null) {
  if (!end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diffMin = (eh * 60 + em) - (sh * 60 + sm);
  if (diffMin <= 0) return null;
  if (diffMin < 60) return `${diffMin}分`;
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

function groupByStartTime(items: any[]) {
  const map = new Map<string, any[]>();
  for (const item of items) {
    const key = hhmm(item.start_time);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([time, items]) => ({ time, items: items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) }));
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
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  return d.toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* === メインコンポーネント === */
export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const target = (sp?.t ? decodeURIComponent(sp.t) : "全員") === "all" ? "全員" : (sp?.t ? decodeURIComponent(sp.t) : "全員");

  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!event) return <main className="min-h-screen flex items-center justify-center"><div className="text-slate-400 font-bold">イベントが見つかりません</div></main>;

  const { data: items } = await supabase.from("schedule_items").select("*").eq("event_id", event.id).order("start_time", { ascending: true }).order("sort_order", { ascending: true });
  const allItems = items ?? [];

  const tagsSet = new Set<string>();
  allItems.forEach(item => { if (item.target && item.target !== "all" && item.target !== "全員") tagsSet.add(item.target); });
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
    <main className="min-h-screen bg-[#f7f9fb] font-sans selection:bg-[#00c2e8] selection:text-white pb-20">
      <EventHeader title={event.title} slug={slug} />

      <div className="pt-20 px-4 max-w-lg mx-auto space-y-6">
        
        {/* === カード1: イベント基本情報 === */}
        <section className="relative bg-white rounded-[2rem] p-6 shadow-wolt overflow-hidden">
           {/* 透かし: 濃く(slate-100), サイズ調整(text-8xl) */}
           <div className="absolute -bottom-6 -right-2 text-8xl font-black text-slate-100 select-none watermark-text leading-none pointer-events-none">
              {getDayNumber(event.date)}
           </div>
           
           <div className="relative z-10 text-center">
             <h1 className="text-2xl font-black text-slate-800 leading-tight mb-4 tracking-tight">
               {event.title}
             </h1>
             <div className="flex justify-center flex-wrap gap-2 text-sm font-bold text-slate-500">
                <div className="flex items-center bg-slate-50/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <Calendar className="w-4 h-4 mr-1.5 text-slate-400"/>
                  {event.date}
                </div>
                <div className="flex items-center bg-slate-50/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <MapPin className="w-4 h-4 mr-1.5 text-slate-400"/>
                  {event.venue_name ?? "場所未定"}
                </div>
             </div>
           </div>
        </section>

        {/* === カード2: フィルター === */}
        <section className="bg-white rounded-[1.5rem] p-4 shadow-wolt">
           <div className="flex items-center gap-2 mb-3 px-2">
              <Filter className="w-4 h-4 text-[#00c2e8]" />
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">役割を選択</h2>
           </div>
           <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
            {tabs.map((t) => {
              const isActive = target === t.key;
              return (
                <Link
                  key={t.key}
                  href={`/e/${slug}?t=${encodeURIComponent(t.key)}`}
                  scroll={false}
                  className={`
                    flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-black transition-all
                    ${isActive 
                      ? "bg-[#00c2e8] text-white" 
                      : "bg-transparent text-slate-400 border border-slate-100 hover:bg-slate-50 hover:text-slate-500"}
                  `}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </section>

        {/* === タイムライン見出し === */}
        <div className="pt-4 pb-1 pl-2 flex items-center gap-2">
           <Clock className="w-5 h-5 text-slate-300" />
           <h2 className="text-lg font-black text-slate-800 tracking-tight">タイムスケジュール</h2>
        </div>

        {/* === タイムライン === */}
        <section className="space-y-8">
          {groups.map((group) => (
            <div key={group.time}>
              <div className="flex items-center mb-4 pl-2">
                <span className="text-2xl font-black text-slate-800 tracking-tight font-sans">
                  {group.time}
                </span>
                <div className="h-px bg-slate-200 flex-1 ml-4 rounded-full"></div>
              </div>

              <div className="space-y-4">
                {group.items.map((it: any) => {
                  const now = isNow(it.start_time, it.end_time);
                  const badgeColor = getTargetColor(it.target);
                  const emoji = it.emoji || detectEmoji(it.title);
                  const duration = getDuration(it.start_time, it.end_time);

                  return (
                    <div
                      key={it.id}
                      className={`
                        relative bg-white rounded-[1.5rem] p-5 flex gap-5 items-stretch overflow-hidden
                        ${now 
                          ? "shadow-xl ring-2 ring-[#00c2e8] scale-[1.02] z-10" 
                          : "shadow-wolt border border-transparent"}
                      `}
                    >
                      {now && (
                        <div className="absolute -top-3 -left-2 bg-[#00c2e8] text-white px-3 py-1 rounded-full text-[10px] font-black shadow-md border-2 border-white z-20">
                          NOW
                        </div>
                      )}

                      {/* 透かし: 濃く(slate-100), サイズ調整(text-7xl) */}
                      <div className="absolute -bottom-4 -right-2 text-7xl font-black text-slate-100 select-none watermark-text leading-none pointer-events-none z-0">
                        {hhmm(it.start_time)}
                      </div>

                      <div className="relative z-10 w-14 shrink-0 flex items-start pt-1 justify-center">
                        <div className="text-[2.5rem] leading-none drop-shadow-sm filter grayscale-[0.2]">
                          {emoji}
                        </div>
                      </div>

                      <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                             <h3 className={`text-xl font-black leading-tight tracking-tight ${now ? "text-[#00c2e8]" : "text-slate-900"}`}>
                               {it.title}
                             </h3>
                             <span className={`ml-3 shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black ${badgeColor}`}>
                               {it.target || "全員"}
                             </span>
                          </div>

                          {it.end_time && (
                             <div className="flex items-center text-sm font-bold text-[#00c2e8] mb-2">
                               <Clock className="w-3.5 h-3.5 mr-1" />
                               <span>~{hhmm(it.end_time)} まで</span>
                             </div>
                          )}

                          {it.note && (
                            <div className="text-sm text-slate-600 leading-relaxed font-medium mb-3">
                              {it.note}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-3 border-t border-slate-50 mt-1">
                           {it.location ? (
                              <div className="flex items-center text-xs font-bold text-slate-500">
                                 <MapPin className="w-3.5 h-3.5 mr-1 text-slate-300" />
                                 {it.location}
                              </div>
                           ) : <div className="flex-1"></div>}
                           
                           {it.location && <div className="w-px h-3 bg-slate-200"></div>}

                           {duration && (
                             <div className="text-xs font-bold text-slate-400">
                               ⏳ {duration}
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {groups.length === 0 && (
             <div className="text-center py-12">
               <div className="text-5xl mb-3 opacity-30">😴</div>
               <div className="text-slate-400 font-bold text-sm">予定はありません</div>
             </div>
          )}
        </section>
      </div>

      {lastUpdated && (
        <div className="fixed bottom-6 right-6 z-30 pointer-events-none">
          <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-lg border border-slate-100 text-[10px] font-black text-slate-400 flex items-center">
             <RefreshCw className="w-3 h-3 mr-1.5" />
             {relativeJa(lastUpdated)} 更新
          </div>
        </div>
      )}
    </main>
  );
}