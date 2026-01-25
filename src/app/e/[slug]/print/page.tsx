import { supabase } from "@/lib/supabaseClient";
import { headers } from "next/headers";
import { Printer, Calendar, MapPin, Clock } from "lucide-react";
/* 👇 普通のインポートに戻す（これでOK） */
import EventQRCode from "@/components/EventQRCode";

export const dynamic = "force-dynamic";

/* === ヘルパー関数 === */
function hhmm(time: string) { return String(time).slice(0, 5); }

function targetLabel(t: string) {
  const map: Record<string, string> = {
    all: "全員", woodwinds: "木管", brass: "金管", perc: "打楽器", staff: "スタッフ"
  };
  return map[t] || t || "全員";
}

function fmtDate(d: string) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

function fmtUpdate(d: Date) {
  return d.toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

/* === メインコンポーネント === */
export default async function PrintPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  const targetKey = sp?.t ?? "all";
  const targetName = targetLabel(targetKey);

  // 1. データ取得
  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!event) return <div className="p-8 font-bold text-center">イベントが見つかりません</div>;

  const { data: items } = await supabase.from("schedule_items").select("*").eq("event_id", event.id).order("start_time", { ascending: true }).order("sort_order", { ascending: true });

  // 2. フィルタリング
  const allItems = items ?? [];
  const filtered = targetKey === "all" ? allItems : allItems.filter(it => it.target === targetKey || it.target === "all" || it.target === "全員");

  // 3. 最終更新日時の計算
  const dates: Date[] = [];
  if (event.updated_at) dates.push(new Date(event.updated_at));
  for (const item of allItems) {
    if (item.updated_at) dates.push(new Date(item.updated_at));
    if (item.created_at) dates.push(new Date(item.created_at));
  }
  const lastUpdated = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date();

  // 4. URL構築
  const headersList = await headers();
  const host = headersList.get("host") || "takt.com";
  const protocol = host.includes("localhost") ? "http" : "https";
  const publicUrl = `${protocol}://${host}/e/${slug}`;
  
  return (
    // ★変更: コンテナ幅を max-w-6xl に拡張 (iPad対応)
    <div className="min-h-screen bg-white text-slate-900 font-sans print:p-0 p-8 w-full max-w-lg md:max-w-6xl mx-auto selection:bg-slate-200">
      
      {/* 印刷用CSS設定 */}
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>

      {/* === 画面表示用ツールバー === */}
      <div className="no-print fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 fade-in duration-700">
        <button 
          className="print-btn flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-full font-bold shadow-xl hover:bg-black hover:scale-105 transition-all"
        >
          <Printer className="w-5 h-5" />
          <span>PDFで保存 / 印刷</span>
        </button>
      </div>
      <script dangerouslySetInnerHTML={{__html: `
        const btn = document.querySelector('.print-btn');
        if(btn) btn.addEventListener('click', () => window.print());
      `}} />

      {/* === ヘッダーエリア === */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-slate-900 pb-6 mb-8 gap-6">
        <div className="space-y-4 flex-1">
          <div>
             <h1 className="text-3xl md:text-5xl font-black leading-tight mb-3 tracking-tight">{event.title}</h1>
             <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm md:text-base font-bold text-slate-700">
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4 md:w-5 md:h-5" /> {fmtDate(event.date)}</div>
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4 md:w-5 md:h-5" /> {event.venue_name || "場所未定"}</div>
             </div>
          </div>
          
          <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded border border-slate-900 bg-slate-50 text-xs font-bold text-slate-600">
             <span>対象: <span className="text-slate-900 font-black text-sm">{targetName}</span></span>
             <span className="w-px h-3 bg-slate-300"></span>
             <span>最終更新: {fmtUpdate(lastUpdated)}</span>
          </div>
        </div>

        {/* QRコードエリア */}
        <div className="flex flex-row md:flex-col items-center gap-3 md:gap-1 shrink-0">
           <div className="border-2 border-slate-900 p-1 rounded-lg">
             <EventQRCode url={publicUrl} />
           </div>
           <span className="text-[10px] md:text-[9px] font-bold text-slate-500 text-left md:text-center leading-tight">
             <span className="md:hidden">◀ </span>リアルタイム更新
           </span>
        </div>
      </header>

      {/* === スケジュールリスト === */}
      {/* ★変更: Gridレイアウト (2列表示)
         スマホ: 1列
         iPad/PC/印刷時: 2列 (grid-cols-2)
         gap-x-12: 列の間隔を広めに取って読みやすく
      */}
      <main className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 items-start">
         
         {filtered.length === 0 && (
           <div className="col-span-full py-12 text-center text-slate-400 font-bold">該当する予定はありません</div>
         )}

         {filtered.map((item) => {
            return (
              // page-break クラスで印刷時の途中切れを防止
              <div key={item.id} className="grid grid-cols-[auto_1fr] gap-4 py-4 border-b border-slate-200 items-start page-break">
                
                {/* 左: 時間 */}
                <div className="w-16 pt-1">
                   <div className="text-xl font-black leading-none font-mono tracking-tighter text-slate-900">
                     {hhmm(item.start_time)}
                   </div>
                   {item.end_time && (
                     <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-0.5">
                       <div className="w-0.5 h-6 bg-slate-200 mx-auto rounded-full"></div>
                     </div>
                   )}
                   {item.end_time && (
                     <div className="text-sm font-bold text-slate-400 font-mono tracking-tighter leading-none mt-1">
                       {hhmm(item.end_time)}
                     </div>
                   )}
                </div>

                {/* 右: コンテンツ */}
                <div className="space-y-1">
                   <div className="flex items-start justify-between gap-2">
                     <div className="text-lg font-black text-slate-900 leading-tight">
                       {item.title}
                     </div>
                     <div className={`shrink-0 text-[9px] px-1.5 py-0.5 rounded font-black border uppercase tracking-wide ${
                        !item.target || item.target === "全員" || item.target === "all"
                          ? "bg-transparent text-slate-400 border-transparent" 
                          : "bg-slate-900 text-white border-slate-900"
                     }`}>
                        {targetLabel(item.target || "all")}
                     </div>
                   </div>

                   {item.location && (
                     <div className="text-xs font-bold text-slate-500 flex items-center gap-1">
                       <MapPin className="w-3 h-3 text-slate-400" />
                       {item.location}
                     </div>
                   )}

                   {item.note && (
                     <div className="mt-2 text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 p-2 rounded border border-slate-100">
                       {item.note}
                     </div>
                   )}
                </div>
              </div>
            );
         })}
      </main>

      <footer className="mt-8 pt-6 border-t-2 border-slate-900 flex justify-between items-center text-[10px] font-bold text-slate-400 page-break">
         <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[9px]">Takt</span>
            <span>Created with Takt Time Schedule</span>
         </div>
         <div className="font-mono">{publicUrl}</div>
      </footer>
    </div>
  );
}