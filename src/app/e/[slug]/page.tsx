export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import EventHeader from "@/components/EventHeader";
import Link from "next/link";
import { Clock, MapPin, RefreshCw, Info, Calendar, Music } from "lucide-react";

/* ==========================================
   メタデータ
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

// Wolt風バッジ色: パステル背景 + 濃い文字
function getTargetColor(t: string) {
  if (!t || t === "all" || t === "全員") return "bg-slate-100 text-slate-600";
  // デフォルトは水色系で統一、またはランダム
  return "bg-cyan-50 text-cyan-700";
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
   ページ本体 (Wolt Style)
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
        <div className="text-center">
          <h1 className="text-lg font-black text-slate-400 mb-4">イベントが見つかりません</h1>
          <Link href="/" className="px-6 py-3 rounded-full bg-[#009de0] text-white font-black shadow-lg shadow-cyan-200 active-bounce">トップへ戻る</Link>
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
    <main className="min-h-screen pb-24 font-sans bg-[#f3f4f6]">
      
      <EventHeader title={event.title} slug={slug} />

      {/* === Hero Background (Wolt Blue) === */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-[#009de0] rounded-b-[2.5rem]">
        {/* 装飾用の薄いパターン */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
      </div>

      <div className="relative pt-24 px-4 max-w-lg mx-auto space-y-8">
        
        {/* === コントロールパネル (浮いている白いカード) === */}
        <section className="bg-white rounded-[2rem] p-6 shadow-wolt text-center">
          
          {/* アイコン装飾 */}
          <div className="w-16 h-16 mx-auto -mt-14 mb-4 bg-white rounded-full p-1 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-[#009de0]">
               <Music className="w-7 h-7 fill-current" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-slate-900 leading-tight mb-4">
            {event.title}
          </h1>

          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 mb-1">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-500">{event.date}</span>
            </div>
            <div className="w-px h-8 bg-slate-100"></div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 mb-1">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-500 truncate max-w-[100px]">{event.venue_name ?? "未設定"}</span>
            </div>
          </div>

          {/* フィルタタブ：丸いピル型ボタン */}
          <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1 justify-start sm:justify-center">
            {tabs.map((t) => {
              const isActive = target === t.key;
              return (
                <Link
                  key={t.key}
                  href={`/e/${slug}?t=${encodeURIComponent(t.key)}`}
                  scroll={false}
                  className={`
                    flex-shrink-0 px-5 py-2.5 rounded-full text-xs font-black transition-all active-bounce
                    ${isActive 
                      ? "bg-[#009de0] text-white shadow-md shadow-cyan-100" 
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"}
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
              <div className="flex items-center mb-3 pl-2">
                <span className="text-xl font-black text-slate-800 tracking-tight font-mono w-16">
                  {group.time}
                </span>
                <div className="h-1 w-1 bg-slate-300 rounded-full mr-1"></div>
                <div className="h-1 w-1 bg-slate-300 rounded-full mr-1"></div>
                <div className="h-1 w-1 bg-slate-300 rounded-full"></div>
              </div>

              <div className="space-y-3">
                {group.items.map((it: any) => {
                  const now = isNow(it.start_time, it.end_time);
                  const badgeColor = getTargetColor(it.target);

                  return (
                    <div
                      key={it.id}
                      className={`
                        relative bg-white rounded-2xl p-5 transition-all
                        ${now 
                          ? "shadow-xl ring-4 ring-[#009de0]/10 scale-[1.02] z-10" 
                          : "shadow-sm border border-slate-100"}
                      `}
                    >
                      {/* NOW バッジ */}
                      {now && (
                        <div className="absolute -top-3 -right-2 bg-[#009de0] text-white px-3 py-1 rounded-full text-[10px] font-black shadow-md border-2 border-white">
                          NOW PLAYING
                        </div>
                      )}

                      <div className="mb-2">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-black ${badgeColor}`}>
                          {it.target || "全員"}
                        </span>
                      </div>
                       
                      <h3 className={`text-lg font-black leading-snug mb-3 ${now ? "text-[#009de0]" : "text-slate-800"}`}>
                        {it.title}
                      </h3>

                      {(it.end_time || it.location || it.note) && (
                        <div className="pt-3 border-t border-slate-50 space-y-2 text-sm text-slate-600">
                          {it.end_time && (
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-slate-300" />
                              <span className="font-bold text-slate-600">{hhmm(it.end_time)}</span>
                              <span className="text-xs ml-1 opacity-60">まで</span>
                            </div>
                          )}
                          {it.location && (
                            <div className="flex items-center font-bold">
                              <MapPin className="w-4 h-4 mr-2 text-slate-300" />
                              {it.location}
                            </div>
                          )}
                          {it.note && (
                            <div className="flex items-start mt-2 bg-slate-50 p-3 rounded-xl text-slate-600 leading-relaxed font-medium">
                              <Info className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-slate-300" />
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
             <div className="text-center py-12">
               <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-3 flex items-center justify-center text-slate-400">
                 <Calendar className="w-8 h-8 opacity-50" />
               </div>
               <div className="text-slate-400 font-bold text-sm">予定はありません</div>
             </div>
          )}
        </section>
      </div>

      {/* 最終更新 (右下にフロート) */}
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