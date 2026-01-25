export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";
import EventHeader from "@/components/EventHeader";
import Link from "next/link";
import { RefreshCw, MapPin, Calendar, Clock, Filter } from "lucide-react";

/* === ヘルパー関数 === */
function hhmm(time: string) { return String(time).slice(0, 5); }

function getDayNumber(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split(/[-/]/);
  return parts.length === 3 ? parts[2] : "";
}

function getJaDate(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split(/[-/]/);
  if (parts.length !== 3) return dateStr;
  return `${Number(parts[1])}月${Number(parts[2])}日`;
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

/* === URL生成ロジック (複数選択対応) === */
function toggleTag(currentTags: string[], tag: string): string {
  const newTags = currentTags.includes(tag)
    ? currentTags.filter((t) => t !== tag) // 既にあったら消す
    : [...currentTags, tag]; // なかったら追加する
  
  if (newTags.length === 0) return "";
  return newTags.join(",");
}

/* === メインコンポーネント === */
export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  
  // URLから選択されたタグを取得 (カンマ区切りを配列に)
  const rawT = sp?.t ? decodeURIComponent(sp.t) : "";
  const selectedTags = rawT ? rawT.split(",") : [];

  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!event) return <main className="min-h-screen flex items-center justify-center"><div className="text-slate-400 font-bold">イベントが見つかりません</div></main>;

  const { data: items } = await supabase.from("schedule_items").select("*").eq("event_id", event.id).order("start_time", { ascending: true }).order("sort_order", { ascending: true });
  const allItems = items ?? [];

  // 全てのタグを収集 (重複排除)
  const tagsSet = new Set<string>();
  allItems.forEach(item => {
    // 将来的に item.target が "A,B" のようにカンマ区切りで保存されても対応できるように split する
    if (item.target && item.target !== "all" && item.target !== "全員") {
      item.target.split(",").forEach((t: string) => tagsSet.add(t.trim()));
    }
  });
  const dynamicTabs = Array.from(tagsSet).sort();

  // ★フィルタリングロジック (ここを変更)
  const filtered = allItems.filter(it => {
    // 1. "全員"タグは常に表示
    if (!it.target || it.target === "all" || it.target === "全員") return true;
    
    // 2. 何も選択されていない場合は全員表示 (初期状態)
    if (selectedTags.length === 0) return true;

    // 3. 選択されたタグのいずれかが含まれていれば表示 (部分一致・複数対応)
    // 将来的に "woodwinds,brass" のようなデータがきてもヒットするようにチェック
    const itemTags = it.target.split(",").map((t: string) => t.trim());
    return itemTags.some((tag: string) => selectedTags.includes(tag));
  });

  const groups = groupByStartTime(filtered);

  // 最終更新日時
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
        
        {/* === カード1: イベント基本情報 (メッシュグラデーション・日本表記・落ち着いた影) === */}
        <section className="relative rounded-[2rem] p-8 overflow-hidden group shadow-wolt">
           <div className="absolute inset-0 bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-cyan-200 via-blue-100 to-[#00c2e8] opacity-80"></div>
           <div className="absolute inset-0 bg-[radial-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent mix-blend-soft-light"></div>
           <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/40 rounded-full blur-3xl mix-blend-overlay animate-pulse-slow"></div>

           <div className="absolute -bottom-12 -right-4 text-[160px] font-black text-white/40 select-none leading-none z-0 tracking-tighter -rotate-6 mix-blend-overlay">
              {getDayNumber(event.date)}
           </div>

           <div className="relative z-10 text-left">
             <div className="inline-flex items-center gap-1.5 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-cyan-700 mb-4 shadow-sm">
                <Calendar className="w-3.5 h-3.5" />
                {getJaDate(event.date)}
             </div>
             <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight mb-6 tracking-tight drop-shadow-sm pr-8">
               {event.title}
             </h1>
             <div className="flex items-center text-sm font-bold text-slate-700 bg-white/50 backdrop-blur-md py-2 px-4 rounded-2xl w-fit border border-white/40">
                <MapPin className="w-4 h-4 mr-2 text-cyan-600"/>
                {event.venue_name ?? "場所未定"}
             </div>
           </div>
        </section>

        {/* === カード2: フィルター (スマホ最適化: タイル配置 & 完全フラット) === */}
        <section className="bg-white rounded-[1.5rem] p-6 shadow-wolt">
           <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#00c2e8]" />
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">担当パートで絞り込み</h2>
              </div>
              
              {/* リセットボタン: 選択中のみ表示 */}
              <div className={`transition-all duration-200 ${selectedTags.length > 0 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
                <Link href={`/e/${slug}`} scroll={false} className="text-[10px] font-bold text-slate-400 hover:text-red-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                   条件をクリア
                </Link>
              </div>
           </div>
           
           {/* ★ここがポイント: 横スクロールをやめて「タイル一覧」に。
               指でタップしやすいよう、パディングを広めにし、完全にフラットなデザインにしました。 */}
           <div className="flex flex-wrap gap-2">
            {dynamicTabs.map((tag) => {
              const isActive = selectedTags.includes(tag);
              const nextUrl = toggleTag(selectedTags, tag);
              const href = nextUrl ? `/e/${slug}?t=${encodeURIComponent(nextUrl)}` : `/e/${slug}`;

              return (
                <Link
                  key={tag}
                  href={href}
                  scroll={false}
                  className={`
                    /* スマホでは押しやすく少し大きく、PCでは適度なサイズ */
                    relative inline-flex items-center justify-center 
                    px-4 py-3 rounded-2xl text-xs font-black transition-all duration-200 select-none active:scale-95
                    border 
                    ${isActive 
                      ? "bg-[#00c2e8] border-[#00c2e8] text-white" // ON: フラットな青・影なし
                      : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"} // OFF: フラットなグレー・影なし
                  `}
                >
                  {tag}
                </Link>
              );
            })}

            {dynamicTabs.length === 0 && (
               <div className="w-full text-center py-4 text-xs font-bold text-slate-300 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                 タグの設定がありません
               </div>
            )}
          </div>
          
          <div className="mt-3 flex justify-end">
             <span className="text-[10px] font-bold text-slate-300">※ 複数選択できます</span>
          </div>
        </section>

        {/* === タイムライン === */}
        <section className="space-y-8">
          {/* タイトル */}
          <div className="pl-2 flex items-center gap-2">
             <Clock className="w-5 h-5 text-slate-300" />
             <h2 className="text-lg font-black text-slate-800 tracking-tight">タイムスケジュール</h2>
          </div>

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
                  const emoji = it.emoji || detectEmoji(it.title);
                  const duration = getDuration(it.start_time, it.end_time);
                  
                  // バッジの色（複数タグ対応: 最初のタグに基づいて色付け or 共通色）
                  const primaryTag = it.target ? it.target.split(",")[0] : "全員";
                  const badgeColor = getTargetColor(primaryTag);

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

                      <div className="absolute -bottom-5 -right-2 text-[5rem] font-black text-slate-100/50 select-none watermark-text leading-none z-0">
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
                             {/* タグ表示 */}
                             <span className={`ml-3 shrink-0 px-2 py-0.5 rounded-md text-[10px] font-black ${badgeColor}`}>
                               {it.target && it.target !== "all" ? it.target.replace(/,/g, "・") : "全員"}
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