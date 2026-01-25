import { supabase } from "@/lib/supabaseClient";
import { headers } from "next/headers";
import { Printer, Calendar, MapPin } from "lucide-react";
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
    <div className="min-h-screen bg-white text-slate-900 font-sans print:p-0 p-8 max-w-4xl mx-auto selection:bg-slate-200">
      
      {/* 印刷用CSS設定 */}
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-inside: avoid; }
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
      <header className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
        <div className="space-y-4">
          <div>
             <h1 className="text-3xl font-black leading-tight mb-2 tracking-tight">{event.title}</h1>
             <div className="flex items-center gap-4 text-sm font-bold text-slate-600">
                <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {fmtDate(event.date)}</div>
                <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {event.venue_name || "場所未定"}</div>
             </div>
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-slate-300 bg-slate-50 text-xs font-bold text-slate-500">
             <span>対象: <span className="text-slate-900 font-black text-sm">{targetName}</span></span>
             <span className="w-px h-3 bg-slate-300"></span>
             <span>最終更新: {fmtUpdate(lastUpdated)}</span>
          </div>
        </div>

        {/* QRコードエリア */}
        <div className="flex flex-col items-center gap-1">
           {/* 普通に配置するだけでOK */}
           <EventQRCode url={publicUrl} />
           <span className="text-[10px] font-bold text-slate-500 text-center leading-tight">
             リアルタイム<br/>更新はこちら
           </span>
        </div>
      </header>

      {/* === スケジュールリスト === */}
      <main className="space-y-0">
         <div className="grid grid-cols-[auto_1fr_auto] gap-6 px-4 py-2 border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
            <div className="w-20">Time</div>
            <div>Content</div>
            <div className="w-32">Note / Target</div>
         </div>

         {filtered.length === 0 && (
           <div className="py-12 text-center text-slate-400 font-bold">該当する予定はありません</div>
         )}

         {filtered.map((item, i) => {
            const isLast = i === filtered.length - 1;
            return (
              <div key={item.id} className={`grid grid-cols-[auto_1fr_auto] gap-6 px-4 py-3 items-start page-break ${!isLast ? "border-b border-slate-100" : ""}`}>
                <div className="w-20 pt-0.5">
                   <div className="text-lg font-black leading-none font-mono tracking-tighter">
                     {hhmm(item.start_time)}
                   </div>
                   {item.end_time && (
                     <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-0.5">
                       <span className="w-0.5 h-2 bg-slate-200 rounded-full"></span>
                       {hhmm(item.end_time)}
                     </div>
                   )}
                </div>
                <div className="pt-0.5">
                   <div className="text-base font-bold text-slate-900 leading-snug">
                     {item.title}
                   </div>
                   {item.location && (
                     <div className="text-xs font-bold text-slate-500 mt-1 flex items-center gap-1">
                       <MapPin className="w-3 h-3 text-slate-400" />
                       {item.location}
                     </div>
                   )}
                </div>
                <div className="w-32 text-right space-y-1">
                   <div className={`inline-block text-[10px] px-2 py-0.5 rounded font-black border ${
                      !item.target || item.target === "全員" || item.target === "all"
                        ? "bg-white text-slate-400 border-slate-200" 
                        : "bg-black text-white border-black"
                   }`}>
                      {targetLabel(item.target || "all")}
                   </div>
                   {item.note && (
                     <div className="text-[10px] font-medium text-slate-500 leading-tight whitespace-pre-wrap">
                       {item.note}
                     </div>
                   )}
                </div>
              </div>
            );
         })}
      </main>

      <footer className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center text-[10px] font-bold text-slate-400 page-break">
         <div>Created with Takt</div>
         <div>{publicUrl}</div>
      </footer>
    </div>
  );
}