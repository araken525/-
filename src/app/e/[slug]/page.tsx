export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";
import ShareButtons from "@/components/ShareButtons";
import Link from "next/link";
import { Clock, MapPin, AlignLeft, RefreshCw, Info, Tag } from "lucide-react";

/* ==========================================
   便利関数 (ハッシュで色分け)
   ========================================== */
function hhmm(time: string) {
  return String(time).slice(0, 5);
}

// ターゲット名から色を自動生成（編集画面と同じロジック）
function getTargetColor(t: string) {
  const colors = [
    "bg-red-100 text-red-700",
    "bg-orange-100 text-orange-800",
    "bg-amber-100 text-amber-800",
    "bg-yellow-100 text-yellow-800",
    "bg-lime-100 text-lime-800",
    "bg-green-100 text-green-700",
    "bg-emerald-100 text-emerald-700",
    "bg-teal-100 text-teal-800",
    "bg-cyan-100 text-cyan-800",
    "bg-sky-100 text-sky-800",
    "bg-blue-100 text-blue-800",
    "bg-indigo-100 text-indigo-700",
    "bg-violet-100 text-violet-700",
    "bg-purple-100 text-purple-800",
    "bg-fuchsia-100 text-fuchsia-800",
    "bg-pink-100 text-pink-800",
    "bg-rose-100 text-rose-800",
  ];
  
  if (!t || t === "all" || t === "全員") return "bg-slate-100 text-slate-600";
  
  let sum = 0;
  for (let i = 0; i < t.length; i++) {
    sum += t.charCodeAt(i);
  }
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
   ページ本体（タグ自動生成対応版）
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
  
  // URLパラメータ（t=全員 など）を取得。デフォルトは "全員"
  // ※古いURL(woodwindsなど)が来ても壊れないようデコード
  const rawTarget = sp?.t ? decodeURIComponent(sp.t) : "全員";
  // "all" という文字列が来たら "全員" とみなす
  const target = rawTarget === "all" ? "全員" : rawTarget;

  /* 1. イベント情報 */
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

  /* 2. スケジュール取得 */
  const { data: items } = await supabase
    .from("schedule_items")
    .select("*")
    .eq("event_id", event.id)
    .order("start_time", { ascending: true })
    .order("sort_order", { ascending: true });

  const allItems = items ?? [];

  /* ★ここが重要：登録されているタグを集計してタブを作る */
  const tagsSet = new Set<string>();
  allItems.forEach(item => {
    // 空文字やnullは除外、"all"も除外
    if (item.target && item.target !== "all" && item.target !== "全員") {
      tagsSet.add(item.target);
    }
  });

  // タブのリスト作成： [全員, ...見つかったタグ]
  // Array.from(tagsSet).sort() であいうえお順などに整列
  const dynamicTabs = ["全員", ...Array.from(tagsSet).sort()];

  const tabs = dynamicTabs.map(t => ({
    key: t, // URLパラメータ用
    label: t // 表示用
  }));

  /* フィルタリング */
  const filtered = target === "全員"
    ? allItems
    : allItems.filter(it => it.target === target || it.target === "全員");

  const groups = groupByStartTime(filtered);

  /* 更新日時 */
  const candidates: Date[] = [];
  const evUpd = toDate((event as any).updated_at);
  if (evUpd) candidates.push(evUpd);
  for (const it of allItems) {
    const d = toDate((it as any).updated_at) || toDate((it as any).created_at);
    if (d) candidates.push(d);
  }
  const lastUpdated = candidates.length > 0 ? new Date(Math.max(...candidates.map((d) => d.getTime()))) : null;

  return (
    <main className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* 1. 情報エリア */}
      <div className="bg-white px-5 pt-8 pb-6 border-b border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-black text-slate-900 leading-tight tracking-tight pr-4">
            {event.title}
          </h1>
          <div className="shrink-0 pt-1">
            <ShareButtons slug={slug} currentKey={target} tabs={tabs} />
          </div>
        </div>

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
        
        {lastUpdated && (
          <div className="flex items-center text-[10px] text-slate-400 font-medium">
            <RefreshCw className="w-3 h-3 mr-1.5" />
            最終更新: {relativeJa(lastUpdated)}
          </div>
        )}
      </div>

      {/* 2. 操作エリア (自動生成タブ) */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="flex space-x-2 overflow-x-auto no-scrollbar px-4 py-3">
          {tabs.map((t) => {
            const isActive = target === t.key;
            return (
              <Link
                key={t.key}
                // 日本語URLでも大丈夫なようにNext.jsが処理してくれますが、念のため
                href={`/e/${slug}?t=${encodeURIComponent(t.key)}`}
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
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white/90 to-transparent pointer-events-none"></div>
      </div>

      {/* 3. タイムライン */}
      <div className="px-4 py-6 space-y-8">
        {groups.map((group) => (
          <div key={group.time} className="relative">
            <div className="flex items-center mb-3 pl-1">
              <span className="text-xl font-black text-slate-900 font-mono tracking-tight mr-3">
                {group.time}
              </span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            <div className="space-y-3">
              {group.items.map((it: any) => {
                const now = isNow(it.start_time, it.end_time);
                // ★自動色分け関数を使用
                const badgeColor = getTargetColor(it.target);

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
                    {now && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-black px-2 py-1 rounded-bl-xl shadow-sm">
                        NOW
                      </div>
                    )}

                    <div className="p-4">
                      <div className="mb-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1.5 ${badgeColor}`}>
                          {it.target || "全員"}
                        </span>
                        <h3 className={`text-lg font-bold leading-snug ${now ? "text-slate-900" : "text-slate-800"}`}>
                          {it.title}
                        </h3>
                      </div>

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
        {groups.length === 0 && (
          <div className="text-center py-10 text-slate-400 text-sm">
             予定が見つかりません
          </div>
        )}
      </div>
    </main>
  );
}