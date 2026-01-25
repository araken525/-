export const dynamic = "force-dynamic";

import { Metadata } from "next";
import { supabase } from "@/lib/supabaseClient";
import EventHeader from "@/components/EventHeader";
import Link from "next/link";
import { RefreshCw, MapPin, Calendar, Clock, Filter } from "lucide-react";

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

// 所要時間を計算して "90分" や "2時間" の形式で返す
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

// 絵文字の自動推測（DBにない場合）
function detectEmoji(title: string) {
  const t = title.toLowerCase();
  if (t.includes("休憩") || t.includes("昼") || t.includes("ご飯") || t.includes("ランチ")) return "🍱";
  if (t.includes("リハ") || t.includes("練習") || t.includes("合わせ") || t.includes("gp")) return "🎻";
  if (t.includes("開場") || t.includes("受付")) return "🎫";
  if (t.includes("開演") || t.includes("本番") || t.includes("ステージ")) return "✨";
  if (t.includes("終演") || t.includes("片付け") || t.includes("撤収")) return "🧹";
  if (t.includes("集合")) return "🚩";
  if (t.includes("解散")) return "👋";
  if (t.includes("ミーティング") || t.includes("朝礼") || t.includes("会議")) return "🗣️";
  if (t.includes("移動")) return "🚶";
  if (t.includes("待機")) return "🪑";
  return "🎵";
}

// タグの色（視認性重視）
function getTargetColor(t: string) {
  if (!t || t === "all" || t === "全員") return "bg-slate-100 text-slate-600";
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

      {/* === Hero Background (Wolt Blue) === */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-[#00c2e8] rounded-b-[2.5rem] shadow-sm overflow-hidden">
        {/* パターン装飾 */}
        <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[0%] left-[-10%] w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
      </div>

      <div className="relative pt-24 px-4 max-w-lg mx-auto space-y-6">
        
        {/* === カード1: イベント情報 === */}
        <section className="bg-white rounded-[2rem] p-6 shadow-wolt text-center relative z-10">
          <div className="w-20 h-20 mx-auto -mt-16 mb-4 bg-white rounded-full p-1.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-slate-50 rounded-full flex items-center justify-center text-4xl">
               🥁
            </div>
          </div>

          <h1 className="text-2xl font-black text-slate-800 leading-tight mb-4">
            {event.title}
          </h1>

          <div className="flex justify-center items-center gap-4 text-sm font-bold text-slate-500">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{event.date}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full">
              <MapPin className="w-4 h-4 text-slate-400" />
              <span className="truncate max-w-[120px]">{event.venue_name ?? "未設定"}</span>
            </div>
          </div>
        </section>

        {/* === カード2: フィルター (独立) === */}
        <section className="bg-white rounded-[1.5rem] p-5 shadow-wolt relative z-10">
           <div className="flex items-center gap-2 mb-3 px-1">
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
                    flex-shrink-0 px-5 py-3 rounded-xl text-xs font-black transition-all active-bounce
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

        {/* === タイムライン === */}
        <section className="space-y-8 pt-2">
          {groups.map((group) => (
            <div key={group.time}>
              {/* 時間見出し (グループ化) */}
              <div className="flex items-center mb-3 pl-2">
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
                        relative bg-white rounded-[1.5rem] p-5 transition-all flex gap-4 items-stretch
                        ${now 
                          ? "shadow-xl ring-2 ring-[#00c2e8] scale-[1.02] z-10" 
                          : "shadow-wolt border border-transparent"}
                      `}
                    >
                      {/* NOW バッジ */}
                      {now && (
                        <div className="absolute -top-3 -right-2 bg-[#00c2e8] text-white px-3 py-1 rounded-full text-[10px] font-black shadow-md border-2 border-white">
                          NOW PLAYING
                        </div>
                      )}

                      {/* 左：巨大絵文字 */}
                      <div className="w-16 shrink-0 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl">
                        {emoji}
                      </div>

                      {/* 右：詳細情報 */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center py-1 relative">
                        {/* タグ (見やすく) */}
                        <div className="mb-1">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${badgeColor}`}>
                            {it.target || "全員"}
                          </span>
                        </div>

                        {/* 特大タイトル */}
                        <h3 className={`text-xl font-black leading-tight mb-1 ${now ? "text-[#00c2e8]" : "text-slate-900"}`}>
                          {it.title}
                        </h3>

                        {/* 時間 (Start - End) */}
                        <div className="flex items-center text-sm font-bold text-slate-500 mb-2">
                          <Clock className="w-3.5 h-3.5 mr-1.5 opacity-60" />
                          <span>{hhmm(it.start_time)}</span>
                          {it.end_time && (
                             <>
                               <span className="mx-1">-</span>
                               <span>{hhmm(it.end_time)}</span>
                             </>
                          )}
                        </div>

                        {/* メモ (シンプル) */}
                        {it.note && (
                          <div className="text-xs font-medium text-slate-500 leading-relaxed opacity-80">
                            {it.note}
                          </div>
                        )}
                        
                        {/* 場所 */}
                        {it.location && (
                          <div className="mt-2 flex items-center text-xs font-bold text-slate-400">
                             <MapPin className="w-3 h-3 mr-1" />
                             {it.location}
                          </div>
                        )}

                        {/* ★所要時間 (右下) */}
                        {duration && (
                           <div className="absolute bottom-0 right-0 text-[10px] font-black text-slate-300 bg-slate-50 px-2 py-1 rounded-lg">
                             ⏳ {duration}
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
             <div className="text-center py-12">
               <div className="text-5xl mb-4 opacity-30">😴</div>
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