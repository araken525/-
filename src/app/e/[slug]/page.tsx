export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import EventHeader from "@/components/EventHeader";
import Link from "next/link";
import { RefreshCw, MapPin, Calendar, Clock } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { data: event } = await supabase.from("events").select("title, date, venue_name").eq("slug", slug).maybeSingle();
  if (!event) return { title: "イベントが見つかりません | Takt" };
  const desc = `${event.date} @${event.venue_name ?? "未設定"} | リアルタイム進行共有`;
  return { title: `${event.title} | Takt`, description: desc, openGraph: { title: event.title, description: desc, siteName: "Takt", locale: "ja_JP", type: "website" } };
}

/* === ロジック系 === */
function hhmm(time: string) { return String(time).slice(0, 5); }

// 所要時間の計算
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
  // Wolt風: タグは目立ちすぎず、でも識別できるように
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
    <main className="min-h-screen bg-[#f7f9fb] font-sans selection:bg-[#00c2e8] selection:text-white">
      <EventHeader title={event.title} slug={slug} />

      {/* 1. イマーシブ・ヒーローエリア (青背景に直書き) */}
      <div className="relative bg-[#00c2e8] pt-28 pb-16 px-6 text-center">
        {/* 背景装飾 */}
        <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-[#00b0d2] to-transparent opacity-30 pointer-events-none"></div>

        <div className="relative z-10 text-white space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-2 shadow-lg ring-1 ring-white/30">
            <span className="text-4xl">🥁</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-tight drop-shadow-md">
            {event.title}
          </h1>
          <div className="flex justify-center flex-wrap gap-2 text-sm font-bold opacity-95">
             <div className="flex items-center bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full ring-1 ring-white/30">
               <Calendar className="w-4 h-4 mr-1.5" />
               {event.date}
             </div>
             <div className="flex items-center bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full ring-1 ring-white/30">
               <MapPin className="w-4 h-4 mr-1.5" />
               {event.venue_name ?? "場所未定"}
             </div>
          </div>
        </div>
      </div>

      {/* 2. ボトムシートエリア (せり上がり) */}
      <div className="relative z-20 -mt-6 bg-[#f7f9fb] rounded-t-[2.5rem] min-h-[calc(100vh-300px)] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        
        {/* === 吸着フィルターナビ === */}
        <div className="sticky top-[56px] z-30 pt-6 pb-2 bg-[#f7f9fb]/95 backdrop-blur-xl border-b border-slate-100/50 rounded-t-[2.5rem]">
           <div className="flex space-x-2 overflow-x-auto no-scrollbar px-6 pb-2">
            {tabs.map((t) => {
              const isActive = target === t.key;
              return (
                <Link
                  key={t.key}
                  href={`/e/${slug}?t=${encodeURIComponent(t.key)}`}
                  scroll={false}
                  className={`
                    flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-black transition-all duration-200 active-bounce
                    ${isActive 
                      ? "bg-[#00c2e8] text-white shadow-lg shadow-cyan-100 ring-2 ring-[#00c2e8] ring-offset-2 ring-offset-[#f7f9fb]" 
                      : "bg-white text-slate-500 shadow-sm border border-slate-100 hover:bg-slate-50"}
                  `}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* === メインリスト === */}
        <div className="px-4 py-6 space-y-8 max-w-lg mx-auto">
          {groups.map((group) => (
            <div key={group.time}>
              {/* 時間ヘッダー */}
              <div className="flex items-center mb-4 pl-2 sticky top-[120px] z-10">
                <span className="text-2xl font-black text-slate-800 tracking-tight font-sans drop-shadow-sm">
                  {group.time}
                </span>
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
                        relative bg-white rounded-[1.8rem] p-5 transition-all
                        ${now 
                          ? "shadow-xl ring-2 ring-[#00c2e8] z-10 scale-[1.02]" 
                          : "shadow-card border border-transparent"}
                      `}
                    >
                      {/* NOW バッジ */}
                      {now && (
                        <div className="absolute -top-2.5 right-4 bg-[#00c2e8] text-white px-3 py-1 rounded-full text-[10px] font-black shadow-md border-2 border-white">
                          NOW PLAYING
                        </div>
                      )}

                      <div className="flex items-stretch gap-4">
                        {/* 左：時間情報 (Menu Price風) */}
                        <div className="w-[4.5rem] shrink-0 flex flex-col justify-center border-r border-slate-50 pr-4 my-1">
                          <div className="text-lg font-black text-slate-800 leading-none">{hhmm(it.start_time)}</div>
                          {it.end_time && (
                             <div className="mt-1.5 text-[10px] font-bold text-slate-400 leading-tight">
                               <span className="block opacity-70">~{hhmm(it.end_time)}</span>
                               {duration && <span className="block text-[#00c2e8]">{duration}</span>}
                             </div>
                          )}
                        </div>

                        {/* 中：アイコン */}
                        <div className="shrink-0 flex items-center">
                          <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl">
                            {emoji}
                          </div>
                        </div>

                        {/* 右：メイン情報 */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                          <div className="flex justify-between items-start">
                             <h3 className={`text-lg font-black leading-tight mb-1 ${now ? "text-[#00c2e8]" : "text-slate-900"}`}>
                               {it.title}
                             </h3>
                             {/* タグは右上に小さく */}
                             <span className={`ml-2 shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black ${badgeColor}`}>
                               {it.target || "全員"}
                             </span>
                          </div>

                          {it.note ? (
                            <div className="text-xs font-medium text-slate-500 leading-relaxed line-clamp-2">
                              {it.note}
                            </div>
                          ) : it.location ? (
                            <div className="flex items-center text-xs font-bold text-slate-400 mt-1">
                              <MapPin className="w-3 h-3 mr-1" />
                              {it.location}
                            </div>
                          ) : null}
                        </div>
                      </div>
                      
                      {/* NoteとLocationが両方ある場合の補足行 */}
                      {(it.note && it.location) && (
                         <div className="mt-3 pt-3 border-t border-slate-50 flex items-center text-xs font-bold text-slate-400">
                            <MapPin className="w-3 h-3 mr-1.5 text-slate-300" />
                            {it.location}
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {groups.length === 0 && (
             <div className="text-center py-20 opacity-50">
               <div className="text-6xl mb-4 grayscale">🍽️</div>
               <div className="text-slate-400 font-bold text-sm">予定（メニュー）はありません</div>
             </div>
          )}
          
          <div className="h-20"></div> {/* Bottom Spacer */}
        </div>
      </div>

      {/* 最終更新 */}
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