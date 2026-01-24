export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";
import ShareButtons from "@/components/ShareButtons";
import Link from "next/link";
import { Clock, MapPin, AlignLeft, RefreshCw, Info } from "lucide-react";

/* ==========================================
   ロジック部（一切変更なし）
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
   コンポーネント本体（UIフルリニューアル）
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

  // データ取得
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

  // 更新日時計算
  const candidates: Date[] = [];
  const evUpd = toDate((event as any).updated_at);
  if (evUpd) candidates.push(evUpd);
  for (const it of items ?? []) {
    const d = toDate((it as any).updated_at) || toDate((it as any).created_at);
    if (d) candidates.push(d);
  }
  const lastUpdated = candidates.length > 0 ? new Date(Math.max(...candidates.map((d) => d.getTime()))) : null;

  // フィルタリング & グループ化
  const filtered = target === "all" ? items ?? [] : (items ?? []).filter((it) => it.target === target || it.target === "all");
  const groups = groupByStartTime(filtered);

  // タブ設定
  const tabs = [
    { key: "all", label: "全員" },
    { key: "woodwinds", label: "木管" },
    { key: "brass", label: "金管" },
    { key: "perc", label: "打楽器" },
    { key: "staff", label: "スタッフ" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 pb-safe">
      {/* Header Area 
        スクロールしても「タイトル」と「タブ」だけは常に上部に残す 
      */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        {/* Top Bar: Title & Share */}
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-black text-slate-900 truncate pr-2">
            {event.title}
          </h1>
          <ShareButtons slug={slug} currentKey={target} tabs={tabs} />
        </div>

        {/* Filter Tabs: Horizontal Scroll */}
        <div className="px-4 pb-2">
          <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
            {tabs.map((t) => {
              const isActive = target === t.key;
              return (
                <Link
                  key={t.key}
                  href={`/e/${slug}?t=${t.key}`}
                  scroll={false}
                  className={`
                    flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all
                    ${isActive 
                      ? "bg-slate-900 text-white shadow-md" 
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"}
                  `}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Info Card 
        固定せず、スクロールと一緒に流す
      */}
      <div className="mx-4 mt-4 mb-8 bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="space-y-3 text-sm">
          <div className="flex items-center text-slate-700">
            <Clock className="w-4 h-4 mr-3 text-slate-400" />
            <span className="font-bold">{event.date}</span>
          </div>
          <div className="flex items-center text-slate-700">
            <MapPin className="w-4 h-4 mr-3 text-slate-400" />
            <span className="font-medium">{event.venue_name ?? "未設定"}</span>
          </div>
          {lastUpdated && (
            <div className="flex items-center text-xs text-slate-400 pt-2 border-t border-slate-50">
              <RefreshCw className="w-3 h-3 mr-2" />
              最終更新: {relativeJa(lastUpdated)}
            </div>
          )}
        </div>
      </div>

      {/* Timeline List 
        時間を「上」に、カードを「全幅」にするレイアウト
      */}
      <div className="px-4 space-y-8 pb-20">
        {groups.map((group) => (
          <div key={group.time} className="relative">
            {/* 時間ヘッダー */}
            <div className="sticky top-[110px] z-10 flex items-center mb-3">
              <div className="bg-slate-900 text-white text-sm font-bold px-3 py-1 rounded-full shadow-sm font-mono">
                {group.time}
              </div>
              <div className="h-px bg-slate-200 flex-1 ml-3"></div>
            </div>

            {/* カード群 */}
            <div className="space-y-3 pl-2">
              <div className="absolute left-[1.1rem] top-8 bottom-0 w-0.5 bg-slate-200 -z-10"></div>
              
              {group.items.map((it: any) => {
                const now = isNow(it.start_time, it.end_time);
                const tConf = targetConfig(it.target);

                return (
                  <div
                    key={it.id}
                    className={`
                      relative rounded-2xl p-4 border transition-all
                      ${now 
                        ? "bg-white border-blue-500 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500 z-10" 
                        : "bg-white border-slate-100 shadow-sm"}
                    `}
                  >
                    {/* NOW Badge */}
                    {now && (
                      <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                        </span>
                        NOW
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Header: Badge & Title */}
                      <div className="flex flex-col gap-1.5">
                        <span className={`self-start inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${tConf.bg} ${tConf.text}`}>
                          {tConf.label}
                        </span>
                        <h3 className={`text-lg font-bold leading-snug ${now ? "text-slate-900" : "text-slate-700"}`}>
                          {it.title}
                        </h3>
                      </div>

                      {/* Details: End Time, Loc, Note */}
                      {(it.end_time || it.location || it.note) && (
                        <div className="pt-3 border-t border-slate-50 space-y-2 text-sm text-slate-500">
                          {it.end_time && (
                            <div className="flex items-center font-mono text-slate-400 text-xs">
                              <span className="mr-2">終了予定</span>
                              <span className="font-bold text-slate-600">{hhmm(it.end_time)}</span>
                            </div>
                          )}
                          
                          {it.location && (
                            <div className="flex items-start">
                              <MapPin className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-slate-400" />
                              <span>{it.location}</span>
                            </div>
                          )}
                          
                          {it.note && (
                            <div className="flex items-start bg-slate-50 p-2.5 rounded-lg">
                              <Info className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-slate-400" />
                              <span className="whitespace-pre-wrap leading-relaxed text-slate-600">
                                {it.note}
                              </span>
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
        
        {/* Footer Space */}
        <div className="h-12 flex items-center justify-center text-slate-300 text-xs font-bold tracking-widest uppercase">
          Takt
        </div>
      </div>
    </main>
  );
}