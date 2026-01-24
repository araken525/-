export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";
import ShareButtons from "@/components/ShareButtons";
import Link from "next/link";
import { Clock, MapPin, AlignLeft, RefreshCw, Info, ChevronRight } from "lucide-react";

/* ==========================================
   ロジック部（変更なし）
   ========================================== */
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

/* ==========================================
   UI部（ヘッダー分離・Twitterスタイル）
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
  const target = sp?.t ?? "all";

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6 bg-slate-50">
        <div className="text-center">
          <h1 className="text-lg font-bold text-slate-400">イベントが見つかりません</h1>
          <Link href="/" className="mt-4 inline-block text-sm text-slate-900 underline">トップへ戻る</Link>
        </div>
      </main>
    );
  }

  const { data: items } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("event_id", event.id)
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });

  // 更新日時
  const candidates: Date[] = [];
  const evUpd = toDate((event as any).updated_at);
  if (evUpd) candidates.push(evUpd);
  for (const it of items ?? []) {
    const d = toDate((it as any).updated_at) || toDate((it as any).created_at);
    if (d) candidates.push(d);
  }
  const lastUpdated = candidates.length > 0 ? new Date(Math.max(...candidates.map((d) => d.getTime()))) : null;

  // フィルタ & グループ化
  const filtered = target === "all" ? items ?? [] : (items ?? []).filter((it) => it.target === target || it.target === "all");
  const groups = groupByStartTime(filtered);

  const tabs = [
    { key: "all", label: "全員" },
    { key: "woodwinds", label: "木管" },
    { key: "brass", label: "金管" },
    { key: "perc", label: "打楽器" },
    { key: "staff", label: "スタッフ" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* 1. 情報エリア (スクロールで消える) */}
      <div className="bg-white px-5 pt-8 pb-6 border-b border-slate-100">
        {/* タイトル & シェアボタン */}
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight pr-4">
            {event.title}
          </h1>
          <div className="shrink-0 pt-1">
            <ShareButtons slug={slug} currentKey={target} tabs={tabs} />
          </div>
        </div>

        {/* 日時・場所 */}
        <div className="space-y-2 text-sm text-slate-600 mb-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2 text-slate-400" />
            <span className="font-bold">{event.date}</span>
          </div>
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-2 text-slate-400" />
            <span className="font-medium">{event.venue_name ?? "未設定"}</span>
          </div>
        </div>
        
        {/* 最終更新 */}
        {lastUpdated && (
          <div className="flex items-center text-[10px] text-slate-400 font-medium">
            <RefreshCw className="w-3 h-3 mr-1.5" />
            最終更新: {relativeJa(lastUpdated)}
          </div>
        )}
      </div>

      {/* 2. 操作エリア (画面上部に張り付く) */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar px-4 py-3">
          {tabs.map((t) => {
            const isActive = target === t.key;
            return (
              <Link
                key={t.key}
                href={`/e/${slug}?t=${t.key}`}
                scroll={false}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all select-none
                  ${isActive 
                    ? "bg-slate-900 text-white shadow-md scale-105" 
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"}
                `}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
        {/* 右端のフェード効果 */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/90 to-transparent pointer-events-none"></div>
      </div>

      {/* 3. タイムラインエリア (横幅いっぱい) */}
      <div className="px-4 py-6 space-y-8">
        {groups.map((group) => (
          <div key={group.time} className="relative">
            {/* 時間ヘッダー */}
            <div className="flex items-center mb-3 pl-1">
              <span className="text-xl font-black text-slate-900 font-mono tracking-tight mr-3">
                {group.time}
              </span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            {/* カードリスト */}
            <div className="space-y-3">
              {group.items.map((it: any) => {
                const now = isNow(it.start_time, it.end_time);
                const tConf = targetConfig(it.target);

                return (
                  <div
                    key={it.id}
                    className={`
                      relative overflow-hidden rounded-2xl transition-all
                      ${now 
                        ? "bg-white shadow-[0_8px_30px_rgba(59,130,246,0.15)] ring-2 ring-blue-500 z-10" 
                        : "bg-white border border-slate-100 shadow-sm"}
                    `}
                  >
                    {/* NOWインジケーター */}
                    {now && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-black px-2 py-1 rounded-bl-xl shadow-sm">
                        NOW
                      </div>
                    )}

                    <div className="p-4">
                      {/* ラベル & タイトル */}
                      <div className="mb-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1.5 ${tConf.bg} ${tConf.text}`}>
                          {tConf.label}
                        </span>
                        <h3 className={`text-lg font-bold leading-snug ${now ? "text-slate-900" : "text-slate-800"}`}>
                          {it.title}
                        </h3>
                      </div>

                      {/* 詳細情報 */}
                      {(it.end_time || it.location || it.note) && (
                        <div className="pt-3 border-t border-slate-50 space-y-2">
                          {it.end_time && (
                            <div className="flex items-center text-xs font-bold text-slate-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-2"></span>
                              {hhmm(it.end_time)} 終了予定
                            </div>
                          )}
                          
                          {it.location && (
                            <div className="flex items-start text-xs font-medium text-slate-500">
                              <MapPin className="w-3.5 h-3.5 mr-2 shrink-0 text-slate-400" />
                              {it.location}
                            </div>
                          )}
                          
                          {it.note && (
                            <div className="flex items-start mt-2 bg-slate-50 p-2.5 rounded-lg text-sm text-slate-600 leading-relaxed">
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

        <div className="h-10 text-center flex items-center justify-center">
          <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
          <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
          <span className="w-1 h-1 bg-slate-300 rounded-full mx-1"></span>
        </div>
      </div>
    </main>
  );
}