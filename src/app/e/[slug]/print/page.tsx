import { supabase } from "@/lib/supabaseClient";
import { headers } from "next/headers";
import { 
  Printer, Calendar, MapPin, Clock, Hash, 
  User, StickyNote, Activity 
} from "lucide-react";
import EventQRCode from "@/components/EventQRCode";

export const dynamic = "force-dynamic";

/* === ヘルパー関数 === */
function hhmm(time: string) { return String(time).slice(0, 5); }

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
    <div className="min-h-screen bg-white text-slate-900 font-sans print:p-0 p-8 w-full max-w-6xl mx-auto selection:bg-slate-200">
      
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-inside: avoid; break-inside: avoid; }
          
          /* テーブルのヘッダーを次ページにも表示させる */
          thead { display: table-header-group; } 
          tr { page-break-inside: avoid; }
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
      <header className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-8 gap-8">
        <div className="space-y-4 flex-1">
          <div>
             <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight mb-2">{event.title}</h1>
             <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base font-bold text-slate-700">
                <div className="flex items-center gap-2"><Calendar className="w-5 h-5" /> {fmtDate(event.date)}</div>
                <div className="flex items-center gap-2"><MapPin className="w-5 h-5" /> {event.venue_name || "場所未定"}</div>
             </div>
          </div>
          
          {/* フィルタ情報 */}
          <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
             <Hash className="w-3 h-3" />
             <span>出力対象: {targetName}</span>
          </div>
        </div>

        {/* QRコード */}
        <div className="flex flex-col items-center gap-1 shrink-0">
           <div className="border border-slate-200 p-1 rounded bg-white">
             <EventQRCode url={publicUrl} />
           </div>
           <span className="text-[9px] font-bold text-slate-400 tracking-tight">最新情報</span>
        </div>
      </header>

      {/* === テーブル === */}
      <main>
        {filtered.length === 0 ? (
           <div className="py-12 text-center text-slate-400 font-bold border-t border-slate-200">予定はありません</div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-slate-800">
                <th className="py-3 pl-2 w-32 font-black text-sm text-slate-900">時間</th>
                <th className="py-3 px-4 font-black text-sm text-slate-900">内容</th>
                <th className="py-3 px-2 w-48 font-black text-sm text-slate-900">詳細・担当</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                 // タグの配列化
                 const tags = item.target && item.target !== "all" && item.target !== "全員"
                    ? item.target.split(",").map((t: string) => t.trim()) 
                    : [];

                 // 担当者の配列化
                 const assignees = item.assignee 
                    ? item.assignee.split(",").map((a: string) => a.trim()) 
                    : [];

                 return (
                   <tr key={item.id} className="border-b border-slate-200 page-break group odd:bg-white even:bg-slate-50/50">
                     
                     {/* 1. 時間カラム */}
                     <td className="py-4 pl-2 align-top">
                       <div className="text-lg font-black font-mono tracking-tighter leading-none text-slate-900">
                         {hhmm(item.start_time)}
                       </div>
                       {item.end_time && (
                         <div className="text-xs font-bold font-mono text-slate-400 mt-1 flex items-center gap-1">
                           <span className="opacity-50">~</span>{hhmm(item.end_time)}
                         </div>
                       )}
                     </td>

                     {/* 2. 内容カラム */}
                     <td className="py-4 px-4 align-top">
                       <div className="flex items-start gap-3">
                         {/* 統一アイコン */}
                         <div className="mt-1 shrink-0 text-slate-300">
                            <Activity className="w-4 h-4" />
                         </div>
                         <div className="space-y-2 flex-1">
                            <div className="text-base font-bold text-slate-900 leading-tight">
                              {item.title}
                            </div>
                            
                            {item.location && (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {item.location}
                              </div>
                            )}

                            {item.note && (
                              <div className="flex items-start gap-1.5 text-xs font-medium text-slate-600 leading-relaxed bg-white p-2 rounded border border-slate-100">
                                <StickyNote className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                                <span className="whitespace-pre-wrap">{item.note}</span>
                              </div>
                            )}
                         </div>
                       </div>
                     </td>

                     {/* 3. 詳細・担当カラム */}
                     <td className="py-4 px-2 align-top">
                       <div className="flex flex-col gap-3">
                         
                         {/* タグ (個別の四角いバッジ) */}
                         {tags.length > 0 && (
                           <div className="flex flex-wrap gap-1">
                             {tags.map((t: string) => (
                               <span key={t} className="px-2 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-bold text-slate-600">
                                 {t}
                               </span>
                             ))}
                           </div>
                         )}

                         {/* 担当者 */}
                         {assignees.length > 0 && (
                           <div className="flex items-start gap-1.5 text-xs text-slate-500">
                             <User className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                             <div className="font-bold leading-relaxed">
                               {assignees.join("、")}
                             </div>
                           </div>
                         )}
                       </div>
                     </td>
                   </tr>
                 );
              })}
            </tbody>
          </table>
        )}
      </main>

      {/* フッター */}
      <footer className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end text-[10px] font-bold text-slate-400 page-break">
         <div className="space-y-1">
            <div className="flex items-center gap-2">
               <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[9px] tracking-widest">TaiSuke</span>
               <span>Smart Schedule Sharing</span>
            </div>
         </div>
         <div className="text-right font-mono opacity-50">
           {publicUrl}
         </div>
      </footer>
    </div>
  );
}