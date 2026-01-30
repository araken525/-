export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseClient";
import EventHeader from "@/components/EventHeader";
import ScheduleItemCard from "@/components/ScheduleItemCard";
import RealtimeListener from "@/components/RealtimeListener";
import AutoRefresh from "@/components/AutoRefresh";

import FloatingFilter from "@/components/FloatingFilter";
import FloatingMaterials from "@/components/FloatingMaterials";
import FloatingActionMenu from "@/components/FloatingActionMenu";

import EventAnnouncement from "@/components/EventAnnouncement";

import Link from "next/link";
import { MapPin, Calendar, Clock, Sparkles, ArrowRight } from "lucide-react";

/* === ヘルパー関数 (省略なし) === */
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
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  
  if (h === 0) return `${m}分`;
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

function groupByStartTime(items: any[]) {
  const map = new Map<string, any[]>();
  for (const item of items) {
    const key = hhmm(item.start_time);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return Array.from(map.entries()).map(([time, items]) => ({ time, items: items.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) }));
}

function isNow(start: string, end: string | null, eventDate: string) {
  if (!end || !eventDate) return false;

  const now = new Date();
  const jstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
  
  const y = jstNow.getFullYear();
  const m = String(jstNow.getMonth() + 1).padStart(2, "0");
  const d = String(jstNow.getDate()).padStart(2, "0");
  const todayYMD = `${y}-${m}-${d}`;

  if (todayYMD !== eventDate) return false;

  const currentMinutes = jstNow.getHours() * 60 + jstNow.getMinutes();
  const [sh, sm] = start.slice(0, 5).split(":").map(Number);
  const startMinutes = sh * 60 + sm;
  const [eh, em] = end.slice(0, 5).split(":").map(Number);
  const endMinutes = eh * 60 + em;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
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
  
  const emergencyContacts = event.emergency_contacts || [];

  const tagsSet = new Set<string>();
  const assigneesSet = new Set<string>();

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
    if (item.assignee) {
      item.assignee.split(",").forEach((a: string) => assigneesSet.add(a.trim()));
    }
  });
  
  const otherTabs = Array.from(tagsSet).filter(t => t !== "全員").sort();
  const dynamicTabs = tagsSet.has("全員") ? ["全員", ...otherTabs] : otherTabs;
  
  const dynamicAssignees = Array.from(assigneesSet).sort();

  const filtered = allItems.filter(it => {
    if (selectedTags.length === 0) return true;

    const itTargets = (!it.target || it.target === "all" || it.target === "全員") 
      ? ["全員"] 
      : it.target.split(",").map((t: string) => {
          const trimmed = t.trim();
          return (trimmed === "all") ? "全員" : trimmed;
        });

    if (itTargets.includes("全員")) return true;

    const isTagMatch = itTargets.some((tag: string) => selectedTags.includes(tag));
    const itAssignees = it.assignee ? it.assignee.split(",").map((a: string) => a.trim()) : [];
    const isAssigneeMatch = itAssignees.some((assignee: string) => selectedTags.includes(assignee));

    return isTagMatch || isAssigneeMatch;
  });

  const groups = groupByStartTime(filtered);

  return (
    <main className="min-h-screen bg-[#f7f9fb] font-sans selection:bg-[#00c2e8] selection:text-white pb-20">
      <EventHeader 
        title={event.title} 
        slug={slug}
        emergencyContacts={emergencyContacts}
      />
      
      <RealtimeListener eventId={event.id} />
      <AutoRefresh />

      {/* ★修正: ここにあった EventAnnouncement を削除 */}

      <div className="fixed bottom-6 right-6 z-40 flex flex-col-reverse gap-4 items-end pointer-events-none">
        <div className="pointer-events-auto">
          <FloatingFilter 
            slug={slug}
            tags={dynamicTabs}
            assignees={dynamicAssignees}
            selectedTags={selectedTags}
          />
        </div>
        <div className="pointer-events-auto">
          <FloatingMaterials materials={materials ?? []} />
        </div>
        <div className="pointer-events-auto">
          <FloatingActionMenu title={event.title} slug={slug} />
        </div>
      </div>

      {/* ★修正: ヘッダー下の余白を元の pt-24 に戻す */}
      <div className="pt-24 px-4 md:px-8 w-full max-w-lg md:max-w-7xl mx-auto space-y-6">
        
        {/* 1. イベント情報カード (ヒーロー) */}
        <section className="relative bg-white rounded-[2rem] p-8 overflow-hidden shadow-sm h-full min-h-[160px]">
           <div className="absolute inset-0 bg-[conic-gradient(at_top_left,_var(--tw-gradient-stops))] from-cyan-200 via-blue-100 to-[#00c2e8] opacity-80"></div>
           <div className="absolute -top-20 -left-20 w-60 h-60 bg-white/40 rounded-full blur-3xl mix-blend-overlay"></div>
           <div className="absolute -bottom-10 -right-4 text-[120px] font-black text-white/40 select-none leading-none z-0 tracking-tighter -rotate-6 mix-blend-overlay">
              {getDayNumber(event.date)}
           </div>

           <div className="relative z-10 text-left mt-2">
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

        {/* ★追加: ここにアナウンスを移動！(ヒーローとタイムラインの間) */}
        <EventAnnouncement 
          eventId={event.id} 
          initialAnnouncement={event.announcement} 
          updatedAt={event.announcement_updated_at}
        />

        {/* 2. タイムライン */}
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
                    const now = isNow(it.start_time, it.end_time, event.date);
                    const emoji = it.emoji || detectEmoji(it.title);
                    const duration = getDuration(it.start_time, it.end_time);
                    const startHhmm = hhmm(it.start_time);
                    const endHhmm = it.end_time ? hhmm(it.end_time) : null;

                    return (
                      <ScheduleItemCard
                        key={it.id}
                        it={it}
                        now={now}
                        emoji={emoji}
                        duration={duration}
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

      {/* フッター */}
      <footer className="mt-32 pb-12 px-4">
        <div className="max-w-xl mx-auto bg-gradient-to-br from-[#00c2e8] to-blue-600 rounded-[2rem] p-8 text-center text-white shadow-xl shadow-cyan-200/50 mb-12 relative overflow-hidden group">
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
            <Link href="/" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white text-[#00c2e8] rounded-2xl font-black text-sm sm:hover:bg-cyan-50 transition-all active:scale-95 shadow-lg">
              無料でイベントを作る <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="max-w-xl mx-auto text-center space-y-8">
           <div className="flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-400">
              <Link href="/" className="sm:hover:text-[#00c2e8] active:opacity-70 transition-colors">トップページ</Link>
              <span className="text-slate-300">|</span>
              <a href="https://x.com/araken525_toho" target="_blank" rel="noopener noreferrer" className="sm:hover:text-[#00c2e8] active:opacity-70 transition-colors">開発者 (X)</a>
              <span className="text-slate-300">|</span>
              <a href="https://kawasakiebase.com" target="_blank" rel="noopener noreferrer" className="sm:hover:text-[#00c2e8] active:opacity-70 transition-colors">運営元</a>
           </div>

           <div className="space-y-2">
              <div className="text-2xl font-black text-slate-300 tracking-tighter">TaiSuke</div>
              <div className="text-[10px] text-slate-400 font-bold">
                 © 2026 Time Schedule Sharing App
              </div>
           </div>

           <div className="pt-8 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-300 tracking-[0.2em] mb-3">PRODUCED BY</p>
              <a 
                href="https://kawasakiebase.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-slate-100 shadow-sm sm:hover:shadow-md sm:hover:border-slate-200 transition-all group"
              >
                 <span className="w-2.5 h-2.5 rounded-full bg-[#00c2e8] sm:group-hover:scale-125 transition-transform shadow-sm shadow-cyan-200"></span>
                 <span className="text-xs font-bold text-slate-600 sm:group-hover:text-slate-900 tracking-wide">ENSEMBLE LABS</span>
              </a>
           </div>
        </div>
      </footer>
    </main>
  );
}