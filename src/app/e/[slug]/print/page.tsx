import { supabase } from "@/lib/supabaseClient";
import { headers } from "next/headers";
import { Printer, Calendar, MapPin, Clock, Hash, AlignLeft } from "lucide-react";
import EventQRCode from "@/components/EventQRCode";

export const dynamic = "force-dynamic";

/* === ヘルパー関数 === */
function hhmm(time: string) { return String(time).slice(0, 5); }

function getDisplayTarget(targetStr: string) {
  if (!targetStr || targetStr === "all" || targetStr === "全員") return "全員";
  return targetStr.replace(/,/g, "・");
}

function fmtDate(d: string) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

/* === メインコンポーネント === */
export default async function PrintPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string }> }) {
  const { slug } = await params;
  const sp = await searchParams;
  
  // タグフィルタリング
  const rawT = sp?.t ? decodeURIComponent(sp.t) : "";
  const selectedTags = rawT ? rawT.split(",") : [];
  const targetName = selectedTags.length > 0 ? selectedTags.join("・") : "全員";

  // 1. データ取得
  const { data: event } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!event) return <div className="p-8 font-bold text-center">イベントが見つかりません</div>;

  const { data: items } = await supabase.from("schedule_items").select("*").eq("event_id", event.id).order("start_time", { ascending: true }).order("sort_order", { ascending: true });

  // 2. フィルタリング
  const allItems = items ?? [];
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

  // 3. URL構築
  const headersList = await headers();
  const host = headersList.get("host") || "taisuke.com";
  const protocol = host.includes("localhost") ? "http" : "https";
  const publicUrl = `${protocol}://${host}/e/${slug}`;
  
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans print:p-0 p-8 w-full max-w-4xl mx-auto selection:bg-slate-200">
      
      <style>{`
        @media print {
          @page { size: A4; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>

      {/* 画面表示用ツールバー */}
      <div className="no-print fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 fade-in duration-700">
        <button 
          className="print-btn flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-full font-bold shadow-xl hover:bg-black hover:scale-105 transition-all"
        >
          <Printer className="w-5 h-5" />
          <span>印刷する</span>
        </button>
      </div>
      <script dangerouslySetInnerHTML={{__html: `
        const btn = document.querySelector('.print-btn');
        if(btn) btn.addEventListener('click', () => window.print());
      `}} />

      {/* === ヘッダー === */}
      <header className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-10 gap-8">
        <div className="space-y-4 flex-1">
          <div>
             <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight mb-2">{event.title}</h1>
             <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base font-bold text-slate-700">
                <div className="flex items-center gap-2"><Calendar className="w-5 h-5" /> {fmtDate(event.date)}</div>
                <div className="flex items-center gap-2"><MapPin className="w-5 h-5" /> {event.venue_name || "場所未定"}</div>
             </div>
          </div>
          
          {/* タグ情報 */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600">
             <Hash className="w-3 h-3" />
             <span>表示対象: <span className="text-slate-900 font-black">{targetName}</span></span>
          </div>
        </div>

        {/* QRコード */}
        <div className="flex flex-col items-center gap-1 shrink-0">
           <div className="border border-slate-200 p-1 rounded bg-white">
             <EventQRCode url={publicUrl} />
           </div>
           <span className="text-[9px] font-bold text-slate-400 tracking-tight">最新情報はこちら</span>
        </div>
      </header>

      {/* === タイムライン === */}
      <main className="relative pl-4">
         {/* 縦線 (全体を貫く線) */}
         <div className="absolute left-[5.5rem] top-4 bottom-4 w-0.5 bg-slate-200"></div>

         {filtered.length === 0 && (
           <div className="py-12 text-center text-slate-400 font-bold">予定はありません</div>
         )}

         {filtered.map((item, index) => {
            const isLast = index === filtered.length - 1;
            
            return (
              <div key={item.id} className="grid grid-cols-[5rem_auto] gap-8 relative pb-10 page-break group">
                
                {/* 1. 時刻カラム */}
                <div className="text-right pt-0.5 relative z-10">
                   <div className="text-xl font-black font-mono tracking-tighter leading-none text-slate-900">
                     {hhmm(item.start_time)}
                   </div>
                   {item.end_time && (
                     <div className="text-xs font-bold font-mono text-slate-400 mt-1">
                       <span className="mr-0.5 text-[10px] opacity-60">~</span>{hhmm(item.end_time)}
                     </div>
                   )}
                </div>

                {/* タイムラインのドット (丸) */}
                <div className="absolute left-[5.5rem] top-2 -translate-x-1/2 w-3 h-3 bg-white border-[3px] border-slate-900 rounded-full z-10"></div>

                {/* 2. コンテンツカラム */}
                <div className="pt-0 relative">
                   {/* タイトル & タグ */}
                   <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-1">
                     <h3 className="text-lg font-black leading-tight text-slate-900">
                       {item.title}
                     </h3>
                     {/* タグバッジ */}
                     {item.target && item.target !== "全員" && item.target !== "all" && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 whitespace-nowrap">
                          {getDisplayTarget(item.target)}
                        </span>
                     )}
                   </div>

                   {/* 場所 */}
                   {item.location && (
                     <div className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mb-2">
                       <MapPin className="w-3.5 h-3.5 text-slate-400" />
                       {item.location}
                     </div>
                   )}

                   {/* メモ (ノート風デザイン) */}
                   {item.note && (
                     <div className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-slate-200">
                       {item.note}
                     </div>
                   )}
                   
                   {/* 担当者 (存在する場合のみ) */}
                   {item.assignee && (
                     <div className="mt-2 text-xs font-bold text-slate-500 flex items-center gap-1.5">
                       <span className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">👤</span>
                       <span>{item.assignee}</span>
                     </div>
                   )}
                </div>
              </div>
            );
         })}
      </main>

      {/* フッター */}
      <footer className="mt-4 pt-6 border-t border-slate-200 flex justify-between items-end text-[10px] font-bold text-slate-400 page-break">
         <div className="space-y-1">
            <div className="flex items-center gap-2">
               <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[9px] tracking-widest">TaiSuke</span>
               <span>Smart Schedule Sharing</span>
            </div>
            <div>※QRコードから最新のスケジュールを確認できます</div>
         </div>
         <div className="text-right font-mono opacity-50">
           {publicUrl}
         </div>
      </footer>
    </div>
  );
}