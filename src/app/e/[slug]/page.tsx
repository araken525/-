export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";
import EventHeader from "@/components/EventHeader";
import ScheduleItemCard from "@/components/ScheduleItemCard";
import RefreshBadge from "@/components/RefreshBadge";
import Link from "next/link";
// ▼ Sparkles, ArrowRight を追加 (フッターの装飾用)
import { MapPin, Calendar, Clock, Filter, X, Link2, FileText, Youtube, Video, Image as ImageIcon, Sparkles, ArrowRight } from "lucide-react";

/* === ヘルパー関数 (ロジック変更なし) === */
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

// ★修正: アイコンは変えるが、色は全て「青」にする
function getMaterialInfo(url: string) {
  const u = url.toLowerCase();
  
  // 共通の青色スタイル
  const style = { 
    color: "text-[#00c2e8]", 
    bg: "bg-cyan-50 hover:bg-[#00c2e8] hover:text-white" 
  };

  if (u.includes("youtube") || u.includes("youtu.be")) {
    return { icon: Youtube, ...style, label: "YouTube" };
  }
  if (u.endsWith(".mp4") || u.endsWith(".mov") || u.includes("vimeo")) {
    return { icon: Video, ...style, label: "Video" };
  }
  if (u.endsWith(".pdf")) {
    return { icon: FileText, ...style, label: "PDF" };
  }
  if (u.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return { icon: ImageIcon, ...style, label: "Image" };
  }
  return { icon: Link2, ...style, label: "Link" };
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

function toggleTag(currentTags: string[], tag: string): string {
  const newTags = currentTags.includes(tag)
    ? currentTags.filter((t) => t !== tag) 
    : [...currentTags, tag]; 
  
  if (newTags.length === 0) return "";
  return newTags.join(",");
}

/* === メインコンポーネント === */
export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  
  const rawT = sp?.t ? decodeURIComponent(sp.t) : "";
  const selectedTags = rawT ? rawT.split(",") : [];

  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!event) return <main className="min-h-screen flex items-center justify-center"><div className="text-slate-400 font-bold">イベントが見つかりません</div></main>;

  const { data: items } = await supabase.from("schedule_items").select("*").eq("event_id", event.id).order("start_time", { ascending: true }).order("sort_order", { ascending: true });
  const allItems = items ?? [];

  const { data: materials } = await supabase.from("event_materials").select("*").eq("event_id", event.id).order("sort_order", { ascending: true });
  const hasMaterials = materials && materials.length > 0;

  const tagsSet = new Set<string>();
  allItems.forEach(item => {
    if (!item.target || item.target === "all" || item.target === "全員") {
      tagsSet.add("全員");
    } else {
      item.target.split(",").forEach((t: string) => {
        const tag = t.trim();
        if (tag === "all" || tag === "全員") tagsSet.add("全員");
        else if (tag !== "") tagsSet.add(tag);
      });
    }
  });
  
  const otherTabs = Array.from(tagsSet).filter(t => t !== "全員").sort();
  const dynamicTabs = tagsSet.has("全員") ? ["全員", ...otherTabs] : otherTabs;

  const filtered = allItems.filter(it => {
    if (selectedTags.length === 0) return true;
    const itTargets = (!it.target || it.target === "all" || it.target === "全員") 
      ? ["全員"] 
      : it.target.split(",").map((t: string) => {
          const trimmed = t.trim();
          return (trimmed === "all") ? "全員" : trimmed;
        });
    if (itTargets.includes("全員")) return true;
    return itTargets.some((tag: string) => selectedTags.includes(tag));
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

      <div className="pt-24 px-4 md:px-8 w-full max-w-lg md:max-w-7xl mx-auto space-y-8">
        
        {/* イベント情報カード */}
        <section className="relative bg-white rounded-[2rem] p-8 overflow-hidden shadow-sm h-full min-h-[160px]">
           <div className="absolute inset-0 bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-cyan-200 via-blue-100 to-[#00c2e8] opacity-80"></div>
           <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/40 rounded-full blur-3xl mix-blend-overlay"></div>
           <div className="absolute -bottom-10 -right-4 text-[120px] font-black text-white/40 select-none leading-none z-0 tracking-tighter -rotate-6 mix-blend-overlay">
              {getDayNumber(event.date)}
           </div>
           <div className="relative z-10 text-left">
             <div className="inline-flex items-center gap-1.5 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black text-cyan-700 mb-3 shadow-sm">
                <Calendar className="w-3.5 h-3.5" />
                {getJaDate(event.date)}
             </div>
             <h1 className="text-3xl font-black text-slate-900 leading-tight mb-4 tracking-tight drop-shadow-sm pr-8">
               {event.title}
             </h1>
             <div className="flex items-center text-sm font-bold text-slate-700 bg-white/50 backdrop-blur-md py-2 px-4 rounded-2xl w-fit border border-white/40">
                <MapPin className="w-4 h-4 mr-2 text-cyan-600"/>
                {event.venue_name ?? "場所未定"}
             </div>
           </div>
        </section>

        {/* フィルターバー */}
        <section className="bg-white rounded-[1.5rem] p-3 shadow-sm sticky top-16 z-20 transition-all flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1">
            <div className="pl-1 pr-2 flex items-center shrink-0">
              <Filter className="w-4 h-4 text-slate-300 mr-1" />
              <span className="text-xs font-black text-slate-300">表示切替</span>
            </div>
            <Link
              href={`/e/${slug}`}
              scroll={false}
              className={`
                shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-colors select-none
                ${selectedTags.length === 0 ? "bg-[#00c2e8] text-white" : "bg-slate-50 text-slate-500"}
              `}
            >
              すべて
            </Link>
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
                    shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-colors select-none
                    ${isActive ? "bg-[#00c2e8] text-white" : "bg-slate-50 text-slate-500"}
                  `}
                >
                  {tag}
                </Link>
              );
            })}
            {selectedTags.length > 0 && (
              <div className="pl-2 border-l border-slate-100 shrink-0">
                <Link href={`/e/${slug}`} scroll={false} className="flex items-center text-xs font-bold text-slate-400 bg-slate-50 px-3 py-2 rounded-xl">
                   <X className="w-3.5 h-3.5 mr-1" /> クリア
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* 資料リンク集エリア */}
        {hasMaterials && (
          <section className="space-y-3">
             <div className="pl-2 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-slate-300" />
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-wider">配布資料・リンク</h2>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
               {materials.map((m) => {
                 const { icon: Icon, color, bg, label } = getMaterialInfo(m.url);
                 return (
                   <a 
                     key={m.id} 
                     href={m.url} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-cyan-100 hover:shadow-md transition-all group"
                   >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${bg}`}>
                         <Icon className={`w-5 h-5 transition-colors ${color} group-hover:text-white`} />
                      </div>
                      <div className="min-w-0">
                         <div className="text-xs font-bold text-slate-400 mb-0.5">{label}</div>
                         <div className="text-sm font-black text-slate-800 truncate leading-tight group-hover:text-[#00c2e8] transition-colors">
                           {m.title}
                         </div>
                      </div>
                   </a>
                 );
               })}
             </div>
          </section>
        )}

        {/* タイムライン */}
        <div className="space-y-10 w-full pt-4">
          <div className="pl-2 flex items-center gap-2 border-b border-slate-100 pb-4">
             <Clock className="w-6 h-6 text-[#00c2e8]" />
             <h2 className="text-2xl font-black text-slate-800 tracking-tight">タイムスケジュール</h2>
          </div>

          {groups.map((group) => {
             const itemCount = group.items.length;
             let gridClass = "";
             if (itemCount === 1) gridClass = "grid-cols-1 max-w-3xl"; 
             else if (itemCount === 2) gridClass = "grid-cols-1 md:grid-cols-2 max-w-5xl";
             else if (itemCount === 3) gridClass = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
             else gridClass = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

             return (
              <div key={group.time}>
                <div className="flex items-center mb-6 pl-2">
                  <span className="text-3xl font-black text-slate-800 tracking-tight font-sans">
                    {group.time}
                  </span>
                  <div className="h-1.5 w-1.5 bg-slate-300 rounded-full mx-4"></div>
                  <div className="h-px bg-slate-200 flex-1 rounded-full"></div>
                </div>

                <div className={`grid gap-4 md:gap-6 ${gridClass}`}>
                  {group.items.map((it: any) => {
                    const now = isNow(it.start_time, it.end_time);
                    const emoji = it.emoji || detectEmoji(it.title);
                    const duration = getDuration(it.start_time, it.end_time);
                    const primaryTag = it.target ? it.target.split(",")[0] : "全員";
                    const badgeColor = getTargetColor(primaryTag);
                    const startHhmm = hhmm(it.start_time);
                    const endHhmm = it.end_time ? hhmm(it.end_time) : null;

                    return (
                      <ScheduleItemCard
                        key={it.id}
                        it={it}
                        now={now}
                        emoji={emoji}
                        duration={duration}
                        badgeColor={badgeColor}
                        startHhmm={startHhmm}
                        endHhmm={endHhmm}
                        materials={materials ?? []}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {groups.length === 0 && (
             <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
               <div className="text-6xl mb-4 opacity-20">📭</div>
               <div className="text-slate-400 font-bold text-lg">予定がまだ登録されていません</div>
               <p className="text-xs text-slate-300 mt-2">編集画面からスケジュールを追加してください</p>
             </div>
          )}
        </div>
      </div>

      {lastUpdated && <RefreshBadge dateText={relativeJa(lastUpdated)} />}

      {/* ★追加: 戦略的フッターエリア (ユーザー獲得CTA + ブランディング) */}
      <footer className="mt-32 pb-12 px-4">
        {/* CTA Card: アプリ利用促進 */}
        <div className="max-w-xl mx-auto bg-gradient-to-br from-[#00c2e8] to-blue-600 rounded-[2rem] p-8 text-center text-white shadow-xl shadow-cyan-200/50 mb-12 relative overflow-hidden group">
          {/* 装飾 */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black mb-4 border border-white/20 shadow-sm">
               <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
               <span>完全無料・Beta版公開中</span>
            </div>
            <h3 className="text-2xl font-black mb-3 leading-tight tracking-tight drop-shadow-sm">
              あなたの団体でも、<br/>
              <span className="text-cyan-100">TaiSuke</span> を使いませんか？
            </h3>
            <p className="text-sm font-bold text-cyan-50 mb-8 leading-relaxed opacity-90">
              練習日程、本番のタイムテーブル、資料共有。<br/>
              面倒な連絡を、これひとつでスマートに完結。
            </p>
            <Link href="/" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white text-[#00c2e8] rounded-2xl font-black text-sm hover:bg-cyan-50 transition-all active:scale-95 shadow-lg">
              無料でイベントを作る <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Branding Footer */}
        <div className="max-w-xl mx-auto text-center space-y-8">
           {/* リンク集 */}
           <div className="flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-400">
              <Link href="/" className="hover:text-[#00c2e8] transition-colors">トップページ</Link>
              <span className="text-slate-300">|</span>
              <a href="https://x.com/araken525_toho" target="_blank" rel="noopener noreferrer" className="hover:text-[#00c2e8] transition-colors">開発者 (X)</a>
              <span className="text-slate-300">|</span>
              <a href="https://kawasakiebase.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#00c2e8] transition-colors">運営元</a>
           </div>

           {/* ロゴ & コピーライト */}
           <div className="space-y-2">
              <div className="text-2xl font-black text-slate-300 tracking-tighter">TaiSuke</div>
              <div className="text-[10px] text-slate-400 font-bold">
                 © 2026 Time Schedule Sharing App
              </div>
           </div>

           {/* Ensemble Labs Badge */}
           <div className="pt-8 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-300 tracking-[0.2em] mb-3">PRODUCED BY</p>
              <a 
                href="https://kawasakiebase.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group"
              >
                 <span className="w-2.5 h-2.5 rounded-full bg-[#00c2e8] group-hover:scale-125 transition-transform shadow-sm shadow-cyan-200"></span>
                 <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 tracking-wide">ENSEMBLE LABS</span>
              </a>
           </div>
        </div>
      </footer>
    </main>
  );
}