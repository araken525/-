export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";
import ShareButtons from "@/components/ShareButtons";
import Link from "next/link"; // ★ Linkコンポーネントの導入（UX向上）
import { Clock, MapPin, AlignLeft, RefreshCw } from "lucide-react"; // ★ アイコンの導入（視認性向上）

/* ===== 便利関数（ロジックはそのまま） ===== */
function hhmm(time: string) {
  return String(time).slice(0, 5);
}

// ★ ターゲットに応じた色分けとラベル
function targetConfig(t: string) {
  switch (t) {
    case "all":
      return { label: "全員", bg: "bg-gray-100", text: "text-gray-600" };
    case "woodwinds":
      return { label: "木管", bg: "bg-green-100", text: "text-green-700" };
    case "brass":
      return { label: "金管", bg: "bg-yellow-100", text: "text-yellow-800" };
    case "perc":
      return { label: "打楽器", bg: "bg-purple-100", text: "text-purple-700" };
    case "staff":
      return { label: "スタッフ", bg: "bg-red-100", text: "text-red-700" };
    default:
      return { label: t, bg: "bg-gray-100", text: "text-gray-600" };
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

  /* データ取得ロジック（そのまま） */
  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center p-4 bg-gray-50">
        <h1 className="text-xl font-bold text-gray-500">イベントが見つかりませんでした</h1>
      </main>
    );
  }

  const { data: items } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("event_id", event.id)
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });

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
    // ★ Tailwind CSS を前提としたスマホ特化UI
    <main className="min-h-screen bg-slate-50 pb-12 sm:pb-16">
      <div className="mx-auto max-w-md md:max-w-2xl">
        {/* ヘッダー & コントロール */}
        <div className="bg-white sticky top-0 z-10 shadow-sm border-b border-slate-200">
          <div className="px-4 pt-4 pb-3">
            <div className="flex justify-between items-start mb-2">
              <h1 className="text-2xl font-extrabold text-slate-900 leading-tight tracking-tight">
                {event.title}
              </h1>
              {/* 共有ボタンをヘッダー内に配置 */}
              <div className="ml-2 shrink-0">
                 <ShareButtons slug={slug} currentKey={target} tabs={tabs} />
              </div>
            </div>

            <div className="flex items-center text-sm text-slate-600 mb-3">
              <Clock className="w-4 h-4 mr-1 inline opacity-70" />
              <span className="mr-3">{event.date}</span>
              <MapPin className="w-4 h-4 mr-1 inline opacity-70" />
              <span>{event.venue_name ?? "未設定"}</span>
            </div>

            {/* フィルタタブ（横スクロール対応・押しやすいUI） */}
            <div className="flex overflow-x-auto no-scrollbar py-1 -mx-4 px-4 space-x-2">
              {tabs.map((t) => {
                const isActive = target === t.key;
                return (
                  <Link
                    key={t.key}
                    href={`/e/${slug}?t=${t.key}`}
                    scroll={false} // ★ スクロール維持でサクサク切り替え
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold transition-colors duration-200 ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 active:bg-slate-300"
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* 最終更新（控えめに） */}
          {lastUpdated && (
            <div className="bg-slate-50 px-4 py-1.5 flex items-center justify-end text-xs text-slate-500 border-t border-slate-100">
              <RefreshCw className="w-3 h-3 mr-1" />
              最終更新：{relativeJa(lastUpdated)}
            </div>
          )}
        </div>

        {/* タイムラインリスト */}
        <section className="px-3 py-4 space-y-6">
          {groups.map((group) => (
            <div key={group.time} className="relative">
              <div className="flex gap-3">
                {/* 時刻カラム（左側固定） */}
                <div className="w-14 pt-1 flex-shrink-0 text-right">
                  <div className="text-xl font-black text-slate-900 leading-none">
                    {group.time}
                  </div>
                </div>

                {/* 予定カードのリスト */}
                <div className="flex-1 space-y-3 pt-0.5">
                  {group.items.map((it: any) => {
                    const now = isNow(it.start_time, it.end_time);
                    const tConf = targetConfig(it.target);

                    return (
                      <div
                        key={it.id}
                        className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
                          now
                            ? "bg-blue-50 ring-2 ring-blue-500 shadow-lg scale-[1.01]"
                            : "bg-white border border-slate-200 shadow-sm"
                        }`}
                      >
                        {/* 進行中バー（左端） */}
                        {now && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 animate-pulse"></div>
                        )}

                        <div className={`p-3 pl-4 ${now ? "pl-5" : ""}`}>
                          <div className="flex justify-between items-start mb-1.5">
                             {/* タイトル */}
                            <h3 className={`text-lg font-bold leading-snug ${now ? 'text-blue-900' : 'text-slate-900'}`}>
                              {it.title}
                            </h3>
                             {/* ターゲットバッジ */}
                            <span className={`ml-2 shrink-0 inline-block px-2 py-0.5 rounded-md text-xs font-bold ${tConf.bg} ${tConf.text}`}>
                              {tConf.label}
                            </span>
                          </div>

                          {/* サブ情報（時間・進行中・場所・メモ） */}
                          <div className="space-y-1">
                             <div className="flex items-center justify-between">
                                {/* 終了時刻があれば表示 */}
                                {it.end_time && (
                                  <div className="text-sm font-semibold text-slate-500">
                                    → {hhmm(it.end_time)} まで
                                  </div>
                                )}
                                {/* 進行中ラベル */}
                                {now && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-blue-500 text-white">
                                    <span className="relative flex h-2 w-2 mr-1">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                                    </span>
                                    NOW
                                  </span>
                                )}
                             </div>


                            {(it.location || it.note) && (
                              <div className={`mt-2 pt-2 border-t ${now ? 'border-blue-200/50' : 'border-slate-100'} text-sm text-slate-600 space-y-1`}>
                                {it.location && (
                                  <div className="flex items-start">
                                    <MapPin className="w-4 h-4 mr-1.5 shrink-0 mt-0.5 opacity-60" />
                                    <span className="font-medium">{it.location}</span>
                                  </div>
                                )}
                                {it.note && (
                                  <div className="flex items-start">
                                    <AlignLeft className="w-4 h-4 mr-1.5 shrink-0 mt-0.5 opacity-60" />
                                    <span className="whitespace-pre-wrap">{it.note}</span>
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
      {/* スクロールバーを隠すためのスタイル（App.css等に移動推奨） */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </main>
  );
}