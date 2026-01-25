export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import EventHeader from "@/components/EventHeader";
import Link from "next/link";
import { RefreshCw } from "lucide-react"; // UIアイコンは最低限に

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
   便利関数 & 絵文字判定ロジック
   ========================================== */
function hhmm(time: string) { return String(time).slice(0, 5); }

// ★ここが「推測」ロジックです！
function detectEmoji(title: string) {
  const t = title.toLowerCase();
  if (t.includes("休憩") || t.includes("昼") || t.includes("ご飯") || t.includes("ランチ")) return "🍱";
  if (t.includes("リハ") || t.includes("練習") || t.includes("合わせ") || t.includes("GP")) return "🎻";
  if (t.includes("開場") || t.includes("受付")) return "🎫";
  if (t.includes("開演") || t.includes("本番") || t.includes("ステージ")) return "✨";
  if (t.includes("終演") || t.includes("片付け") || t.includes("撤収")) return "🧹";
  if (t.includes("集合")) return "🚩";
  if (t.includes("解散")) return "👋";
  if (t.includes("ミーティング") || t.includes("朝礼") || t.includes("会議")) return "🗣️";
  if (t.includes("移動")) return "🚶";
  if (t.includes("待機")) return "🪑";
  return "🎵"; // デフォルト
}

// Wolt風バッジ色
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
   ページ本体 (Wolt Style + Emoji + Route)
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
          <h1 className="text-lg font-black text-slate-400 mb-4">イベントが見つかりません 😢</h1>
          <Link href="/" className="px-6 py-3 rounded-full bg-[#00c2e8] text-white font-black shadow-lg active-bounce">トップへ戻る</Link>
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
    <main className="min-h-screen pb-24 font-sans bg-[#f7f9fb]">
      
      <EventHeader title={event.title} slug={slug} />

      {/* === Hero Background (Bright Wolt Blue) === */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-[#00c2e8] rounded-b-[2.5rem] shadow-sm overflow-hidden">
        {/* 装飾パターン */}
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative pt-24 px-4 max-w-lg mx-auto space-y-8">
        
        {/* === コントロールパネル === */}
        <section className="bg-white rounded-[2rem] p-6 shadow-wolt text-center relative z-10">
          
          {/* アイコン装飾 */}
          <div className="w-20 h-20 mx-auto -mt-16 mb-4 bg-white rounded-full p-1.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center text-4xl">
               🥁
            </div>
          </div>

          <h1 className="text-2xl font-black text-slate-800 leading-tight mb-4">
            {event.title}
          </h1>

          <div className="flex justify-center items-center gap-4 mb-6 text-sm font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>📅</span>
              <span>{event.date}</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <div className="flex items-center gap-1.5">
              <span>📍</span>
              <span className="truncate max-w-[120px]">{event.venue_name ?? "未設定"}</span>
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
                      ? "bg-[#00c2e8] text-white shadow-md shadow-cyan-100" 
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"}
                  `}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </section>

        {/* === タイムライン (Route Style) === */}
        <section className="relative pl-4">
          
          {/* 左側の点線ルート (上から下まで貫通) */}
          <div className="absolute top-4 bottom-0 left-[27px] w-0.5 border-l-2 border-dashed border-slate-200"></div>

          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.time} className="relative">
                
                {/* 時間ヘッダー (ルート上のポイント) */}
                <div className="flex items-center mb-3 relative z-10">
                  <div className="w-2.5 h-2.5 bg-[#00c2e8] rounded-full ring-4 ring-[#f7f9fb] ml-[18px] mr-4"></div>
                  <span className="text-lg font-black text-slate-800 tracking-tight font-mono">
                    {group.time}
                  </span>
                </div>

                <div className="space-y-4 pl-8">
                  {group.items.map((it: any) => {
                    const now = isNow(it.start_time, it.end_time);
                    const badgeColor = getTargetColor(it.target);
                    // ★自動判定した絵文字
                    const emoji = detectEmoji(it.title);

                    return (
                      <div
                        key={it.id}
                        className={`
                          relative bg-white rounded-[1.2rem] p-4 transition-all flex gap-4 items-start
                          ${now 
                            ? "shadow-xl ring-2 ring-[#00c2e8] scale-[1.02] z-10" 
                            : "shadow-wolt border border-transparent"}
                        `}
                      >
                        {/* NOW バッジ (ルート上に表示) */}
                        {now && (
                           <div className="absolute top-1/2 -translate-y-1/2 -left-[42px] w-8 h-8 bg-[#00c2e8] rounded-full flex items-center justify-center text-white shadow-lg animate-pulse z-20">
                             📍
                           </div>
                        )}

                        {/* 左：巨大絵文字 (メニューサムネイル風) */}
                        <div className="w-14 h-14 shrink-0 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl">
                          {emoji}
                        </div>

                        {/* 右：詳細情報 */}
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="flex justify-between items-start mb-1">
                             <h3 className={`text-base font-black leading-snug ${now ? "text-[#00c2e8]" : "text-slate-800"}`}>
                               {it.title}
                             </h3>
                             <span className={`shrink-0 px-2 py-0.5 rounded-lg text-[10px] font-black ml-2 ${badgeColor}`}>
                               {it.target || "全員"}
                             </span>
                          </div>

                          {(it.end_time || it.location || it.note) && (
                            <div className="space-y-1 text-xs font-bold text-slate-500">
                              {it.end_time && (
                                <div className="flex items-center">
                                  <span>⏰</span>
                                  <span className="ml-1.5">{hhmm(it.end_time)} まで</span>
                                </div>
                              )}
                              {it.location && (
                                <div className="flex items-center">
                                  <span>📍</span>
                                  <span className="ml-1.5">{it.location}</span>
                                </div>
                              )}
                              {it.note && (
                                <div className="flex items-start mt-2 bg-slate-50 p-2 rounded-lg text-slate-600 font-medium leading-relaxed">
                                  <span className="mr-1.5">📝</span>
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
          </div>

          {groups.length === 0 && (
             <div className="text-center py-12 pl-0">
               <div className="text-4xl mb-2 opacity-50">😴</div>
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