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
  
  // URLから選択されたタグを取得
  const rawT = sp?.t ? decodeURIComponent(sp.t) : "";
  const selectedTags = rawT ? rawT.split(",") : [];

  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!event) return <main className="min-h-screen flex items-center justify-center"><div className="text-slate-400 font-bold">イベントが見つかりません</div></main>;

  const { data: items } = await supabase.from("schedule_items").select("*").eq("event_id", event.id).order("start_time", { ascending: true }).order("sort_order", { ascending: true });
  const allItems = items ?? [];

  const tagsSet = new Set<string>();
  allItems.forEach(item => {
    if (item.target && item.target !== "all" && item.target !== "全員") {
      item.target.split(",").forEach((t: string) => tagsSet.add(t.trim()));
    }
  });
  const dynamicTabs = Array.from(tagsSet).sort();

  const filtered = allItems.filter(it => {
    if (!it.target || it.target === "all" || it.target === "全員") return true;
    if (selectedTags.length === 0) return true;
    const itemTags = it.target.split(",").map((t: string) => t.trim());
    return itemTags.some((tag: string) => selectedTags.includes(tag));
  });

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
    <main className="min-h-screen bg-[#f7f9fb] font-sans selection:bg-[#00c2e8] selection:text-white pb-20">
      <EventHeader title={event.title} slug={slug} />

      {/* コンテナ全体: 最大幅を広く取る */}
      <div className="pt-24 px-4 w-full max-w-lg md:max-w-7xl mx-auto space-y-10">
        
        {/* === 上部エリア: 情報 & フィルター === 
            スマホ: 縦積み (grid-cols-1)
            iPad/PC: 横並び (grid-cols-2) でバランスよく配置
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* カード1: イベント基本情報 */}
          <section className="relative rounded-[2rem] p-8 overflow-hidden group shadow-wolt transition-transform hover:scale-[1.01] h-full min-h-[200px]">
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

          {/* カード2: フィルター (高さを揃える) */}
          <section className="bg-white rounded-[1.5rem] p-6 shadow-wolt h-full flex flex-col">
             <div className="flex items-center justify-between mb-4 px-1 shrink-0">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#00c2e8]" />
                  <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">担当パートで絞り込み</h2>
                </div>
                
                <div className={`transition-all duration-200 ${selectedTags.length > 0 ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>
                  <Link href={`/e/${slug}`} scroll={false} className="text-[10px] font-bold text-slate-400 hover:text-red-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                     条件をクリア
                  </Link>
                </div>
             </div>
             
             {/* フィルタータグ一覧: 伸縮してスペースを埋める */}
             <div className="flex flex-wrap gap-2 content-start flex-1">
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
                      relative inline-flex items-center justify-center 
                      px-4 py-3 rounded-2xl text-xs font-black transition-all duration-200 select-none active:scale-95
                      border 
                      ${isActive 
                        ? "bg-[#00c2e8] border-[#00c2e8] text-white" 
                        : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100"}
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
            <div className="mt-3 flex justify-end shrink-0">
               <span className="text-[10px] font-bold text-slate-300">※ 複数選択できます</span>
            </div>
          </section>
        </div>


        {/* === 下部エリア: タイムライン (横幅いっぱい) === */}
        <div className="space-y-10 w-full">
          <div className="pl-2 flex items-center gap-2 border-b border-slate-100 pb-4">
             <Clock className="w-6 h-6 text-[#00c2e8]" />
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">タイムスケジュール</h2>
          </div>

          {groups.map((group) => (
            <div key={group.time}>
              {/* 時間ヘッダー */}
              <div className="flex items-center mb-6 pl-2">
                <span className="text-3xl font-black text-slate-800 tracking-tight font-sans">
                  {group.time}
                </span>
                <div className="h-1.5 w-1.5 bg-slate-300 rounded-full mx-4"></div>
                <div className="h-px bg-slate-200 flex-1 rounded-full"></div>
              </div>

              {/* ★グリッドレイアウト: 画面幅に応じて最大4列まで展開
                 スマホ: 1列
                 タブレット: 2列
                 PC: 3列
                 大型PC: 4列 (xl:grid-cols-4)
              */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {group.items.map((it: any) => {
                  const now = isNow(it.start_time, it.end_time);
                  const emoji = it.emoji || detectEmoji(it.title);
                  const duration = getDuration(it.start_time, it.end_time);
                  
                  const primaryTag = it.target ? it.target.split(",")[0] : "全員";
                  const badgeColor = getTargetColor(primaryTag);

                  return (
                    <div
                      key={it.id}
                      className={`
                        relative bg-white rounded-[1.5rem] p-6 flex gap-4 items-start overflow-hidden transition-all hover:shadow-xl h-full flex-col
                        ${now 
                          ? "shadow-2xl ring-4 ring-[#00c2e8]/20 border-2 border-[#00c2e8] scale-[1.02] z-10" 
                          : "shadow-wolt border border-transparent"}
                      `}
                    >
                      {now && (
                        <div className="absolute -top-3 -left-2 bg-[#00c2e8] text-white px-3 py-1 rounded-full text-[10px] font-black shadow-md border-2 border-white z-20">
                          NOW
                        </div>
                      )}

                      {/* 背景時間はさらに薄く */}
                      <div className="absolute -bottom-4 -right-2 text-[5rem] font-black text-slate-50/80 select-none watermark-text leading-none z-0 pointer-events-none">
                        {hhmm(it.start_time)}
                      </div>

                      <div className="relative z-10 flex items-start gap-4 w-full">
                         {/* アイコン */}
                         <div className="shrink-0 text-[3rem] leading-none drop-shadow-sm filter grayscale-[0.1]">
                            {emoji}
                         </div>

                         {/* コンテンツ */}
                         <div className="flex-1 min-w-0 flex flex-col h-full">
                            <div className="mb-2">
                               <div className="flex flex-wrap items-start gap-2 mb-1">
                                  <h3 className={`text-xl font-black leading-tight tracking-tight ${now ? "text-[#00c2e8]" : "text-slate-900"}`}>
                                    {it.title}
                                  </h3>
                               </div>
                               <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${badgeColor}`}>
                                  {it.target && it.target !== "all" ? it.target.replace(/,/g, "・") : "全員"}
                               </span>
                            </div>

                            {it.end_time && (
                               <div className="flex items-center text-sm font-bold text-[#00c2e8] mb-3">
                                 <Clock className="w-4 h-4 mr-1.5" />
                                 <span>~{hhmm(it.end_time)} まで</span>
                               </div>
                            )}

                            {it.note && (
                              <div className="text-sm text-slate-600 leading-relaxed font-medium mb-4 line-clamp-3">
                                {it.note}
                              </div>
                            )}

                            {/* フッター情報 (最下部へ押し下げ) */}
                            <div className="flex items-center gap-3 pt-3 border-t border-slate-50 mt-auto">
                               {it.location ? (
                                  <div className="flex items-center text-xs font-bold text-slate-500 truncate max-w-[70%]">
                                     <MapPin className="w-3.5 h-3.5 mr-1 text-slate-300 shrink-0" />
                                     <span className="truncate">{it.location}</span>
                                  </div>
                               ) : <div className="flex-1"></div>}
                               
                               {it.location && <div className="w-px h-3 bg-slate-200 shrink-0"></div>}

                               {duration && (
                                 <div className="text-xs font-bold text-slate-400 shrink-0">
                                   ⏳ {duration}
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {groups.length === 0 && (
             <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
               <div className="text-6xl mb-4 opacity-20">📭</div>
               <div className="text-slate-400 font-bold text-lg">予定がまだ登録されていません</div>
               <p className="text-xs text-slate-300 mt-2">編集画面からスケジュールを追加してください</p>
             </div>
          )}
        </div>
      </div>

      {lastUpdated && (
        <div className="fixed bottom-6 right-6 z-30 pointer-events-none">
          <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-slate-100 text-xs font-black text-slate-500 flex items-center">
             <RefreshCw className="w-3.5 h-3.5 mr-2" />
             {relativeJa(lastUpdated)} 更新
          </div>
        </div>
      )}
    </main>
  );
}