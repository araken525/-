export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";
import ShareButtons from "@/components/ShareButtons";
import Link from "next/link";
import { Clock, MapPin, AlignLeft, RefreshCw, ChevronRight } from "lucide-react";

/* ===== 便利関数 (ロジックは完全維持) ===== */
function hhmm(time: string) {
  return String(time).slice(0, 5);
}

function targetConfig(t: string) {
  switch (t) {
    case "all":
      return { label: "全員", bg: "bg-slate-100", text: "text-slate-600" };
    case "woodwinds":
      return { label: "木管", bg: "bg-emerald-100", text: "text-emerald-700" };
    case "brass":
      return { label: "金管", bg: "bg-amber-100", text: "text-amber-800" };
    case "perc":
      return { label: "打楽器", bg: "bg-fuchsia-100", text: "text-fuchsia-700" };
    case "staff":
      return { label: "スタッフ", bg: "bg-rose-100", text: "text-rose-700" };
    default:
      return { label: t, bg: "bg-slate-100", text: "text-slate-600" };
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

function fmtJst(d: Date) {
  return d.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function relativeJa(d: Date) {
  const diffMs = Date.now() - d.getTime();
  const min = Math.floor(diffMs / 1000 / 60);
  if (min < 1) return "たった今";
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  return fmtJst(d);
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

  /* 1. イベント情報を取得 */
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 bg-slate-50">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-3xl">
            🤔
          </div>
          <h1 className="text-lg font-bold text-slate-500">
            イベントが見つかりませんでした
          </h1>
          <Link href="/" className="inline-block px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-sm">
            トップへ戻る
          </Link>
        </div>
      </main>
    );
  }

  /* 2. スケジュールを取得 */
  const { data: items } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("event_id", event.id)
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });

  /* 最終更新日時の計算 */
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

  /* フィルタリング */
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
    <main className="min-h-screen bg-[#F8FAFC] pb-24 font-sans">
      <div className="mx-auto max-w-md md:max-w-2xl">
        
        {/* ヘッダー部分：すりガラス効果でモダンに */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-[0_4px_20px_-12px_rgba(0,0,0,0.1)] transition-all">
          <div className="px-5 pt-5 pb-3">
            {/* タイトル & シェア */}
            <div className="flex justify-between items-start mb-3">
              <h1 className="text-[1.35rem] font-black text-slate-900 leading-tight tracking-tight drop-shadow-sm">
                {event.title}
              </h1>
              <div className="ml-3 shrink-0 transform translate-y-1">
                <ShareButtons slug={slug} currentKey={target} tabs={tabs} />
              </div>
            </div>

            {/* 日時・場所情報 */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[0.8rem] font-medium text-slate-500 mb-4 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
              <div className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <span className="tracking-wide">{event.date}</span>
              </div>
              <div className="w-px h-3 bg-slate-300 hidden sm:block"></div>
              <div className="flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                <span className="line-clamp-1">{event.venue_name ?? "未設定"}</span>
              </div>
            </div>

            {/* フィルタタブ：スクロールバーを隠してスタイリッシュに */}
            <div className="relative">
              <div className="flex overflow-x-auto no-scrollbar py-1 -mx-5 px-5 space-x-2 scroll-smooth">
                {tabs.map((t) => {
                  const isActive = target === t.key;
                  return (
                    <Link
                      key={t.key}
                      href={`/e/${slug}?t=${t.key}`}
                      scroll={false}
                      className={`whitespace-nowrap px-4 py-2.5 rounded-full text-[0.8rem] font-bold transition-all duration-300 select-none ${
                        isActive
                          ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 scale-[1.02]"
                          : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      {t.label}
                    </Link>
                  );
                })}
              </div>
              {/* 右側のフェードアウト効果（スクロール示唆） */}
              <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-white/80 to-transparent pointer-events-none"></div>
            </div>
          </div>

          {/* 最終更新バー */}
          {lastUpdated && (
            <div className="bg-slate-50/90 px-5 py-1.5 flex items-center justify-end text-[10px] font-medium text-slate-400 border-t border-slate-100">
              <RefreshCw className="w-2.5 h-2.5 mr-1" />
              最終更新：{relativeJa(lastUpdated)}
            </div>
          )}
        </div>

        {/* タイムライン表示部分 */}
        <section className="px-4 py-6 space-y-8 relative">
          {/* 縦のガイドライン */}
          <div className="absolute left-[3.8rem] top-6 bottom-6 w-[2px] bg-slate-200/50 rounded-full z-0"></div>

          {groups.map((group) => (
            <div key={group.time} className="relative z-10">
              <div className="flex gap-4">
                {/* 左側：時刻 */}
                <div className="w-12 pt-2 flex-shrink-0 text-right">
                  <div className="text-lg font-black text-slate-900 tracking-tight leading-none font-mono">
                    {group.time}
                  </div>
                </div>

                {/* 右側：予定カード群 */}
                <div className="flex-1 space-y-3 pt-0.5 min-w-0">
                  {group.items.map((it: any) => {
                    const now = isNow(it.start_time, it.end_time);
                    const tConf = targetConfig(it.target);

                    return (
                      <div
                        key={it.id}
                        className={`relative rounded-2xl overflow-hidden transition-all duration-300 group ${
                          now
                            ? "bg-blue-50/40 shadow-[0_8px_30px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/30 translate-x-1"
                            : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-slate-900/5"
                        }`}
                      >
                        {/* 左端のアクセントバー（NOWの場合） */}
                        {now && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500"></div>
                        )}

                        <div className={`p-4 ${now ? "pl-5" : ""}`}>
                          {/* タイトル & バッジ */}
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <h3
                              className={`text-[1.05rem] font-bold leading-snug break-words ${
                                now ? "text-blue-900" : "text-slate-800"
                              }`}
                            >
                              {it.title}
                            </h3>
                            <span
                              className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${tConf.bg} ${tConf.text}`}
                            >
                              {tConf.label}
                            </span>
                          </div>

                          {/* 詳細情報 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between min-h-[1.25rem]">
                              {it.end_time ? (
                                <div className="flex items-center text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md">
                                  <ChevronRight className="w-3 h-3 mr-0.5 opacity-50" />
                                  {hhmm(it.end_time)}
                                </div>
                              ) : (
                                <div></div>
                              )}
                              
                              {/* NOWバッジ */}
                              {now && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500 text-white shadow-sm shadow-blue-200">
                                  <span className="relative flex h-1.5 w-1.5 mr-1.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                  </span>
                                  NOW
                                </span>
                              )}
                            </div>

                            {(it.location || it.note) && (
                              <div
                                className={`pt-3 mt-3 border-t border-dashed ${
                                  now
                                    ? "border-blue-200"
                                    : "border-slate-100"
                                } text-[0.85rem] text-slate-600 space-y-2`}
                              >
                                {it.location && (
                                  <div className="flex items-start">
                                    <MapPin className="w-3.5 h-3.5 mr-2 shrink-0 mt-0.5 text-slate-400" />
                                    <span className="font-medium">
                                      {it.location}
                                    </span>
                                  </div>
                                )}
                                {it.note && (
                                  <div className="flex items-start">
                                    <AlignLeft className="w-3.5 h-3.5 mr-2 shrink-0 mt-0.5 text-slate-400" />
                                    <span className="whitespace-pre-wrap leading-relaxed opacity-90">
                                      {it.note}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}