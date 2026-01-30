"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Printer, Calendar, MapPin, Hash, User, StickyNote, Activity, 
  Filter, CheckSquare, Square, X, Loader2, Eye, Clock, ArrowRight 
} from "lucide-react";
import EventQRCode from "@/components/EventQRCode";
import { Noto_Sans_JP } from "next/font/google";

// 美しい日本語フォント
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  preload: true,
  display: "swap",
});

/* === ヘルパー関数 === */
function hhmm(time: string) { return String(time).slice(0, 5); }

// 分数を計算して "90分" のように返す
function getDuration(start: string, end: string | null) {
  if (!end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  let diff = endMin - startMin;
  if (diff < 0) diff += 24 * 60; // 日またぎ対応(簡易)
  
  if (diff === 0) return null;
  if (diff >= 60) {
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m > 0 ? `${h}時間${m}分` : `${h}時間`;
  }
  return `${diff}分`;
}

function fmtDate(d: string) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

/* === メインコンポーネント === */
export default function PrintPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  // --- State ---
  const [event, setEvent] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // フィルタリング用State
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // 空配列 = 全表示
  
  // ★表示オプション (トグル)
  const [showOptions, setShowOptions] = useState({
    timeInfo: true,   // 終了時刻・所要時間
    location: true,   // 場所
    note: true,       // メモ
    tags: true,       // タグ
    assignee: true    // 担当者
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [publicUrl, setPublicUrl] = useState("");

  // --- Data Loading ---
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPublicUrl(`${window.location.origin}/e/${slug}`);
    }

    (async () => {
      const { data: eData } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
      if (!eData) { setLoading(false); return; }
      setEvent(eData);

      const { data: iData } = await supabase.from("schedule_items").select("*").eq("event_id", eData.id).order("start_time", { ascending: true }).order("sort_order", { ascending: true });
      const loadedItems = iData ?? [];
      setItems(loadedItems);

      const tagsSet = new Set<string>();
      loadedItems.forEach(it => {
        if (it.target && it.target !== "all" && it.target !== "全員") {
          it.target.split(",").forEach((t: string) => tagsSet.add(t.trim()));
        }
      });
      setAllTags(Array.from(tagsSet).sort());
      setLoading(false);
    })();
  }, [slug]);

  // --- Logic ---
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
    else setSelectedTags([...selectedTags, tag]);
  };

  const toggleOption = (key: keyof typeof showOptions) => {
    setShowOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredItems = items.filter(it => {
    if (selectedTags.length === 0) return true;
    const itTargets = (!it.target || it.target === "all" || it.target === "全員") 
      ? ["全員"] 
      : it.target.split(",").map((t: string) => t.trim());
    if (itTargets.includes("全員")) return true;
    return itTargets.some((t: string) => selectedTags.includes(t));
  });

  const targetDisplayName = selectedTags.length === 0 ? "全員・全パート" : selectedTags.join("・");

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="w-8 h-8 text-slate-400 animate-spin" /></div>;
  }
  if (!event) return <div className="p-8 font-bold text-center">イベントが見つかりません</div>;

  return (
    <div className={`min-h-screen bg-white text-slate-900 print:p-0 p-8 w-full max-w-6xl mx-auto selection:bg-slate-200 ${notoSansJP.className}`}>
      
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .page-break { page-break-inside: avoid; break-inside: avoid; }
          thead { display: table-header-group; } 
          tr { page-break-inside: avoid; }
        }
      `}</style>

      {/* === ツールバー (印刷時非表示) === */}
      <div className="no-print fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 animate-in slide-in-from-bottom-4 fade-in duration-700">
        
        {isFilterOpen && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 w-72 mb-2 animate-in fade-in zoom-in-95 origin-bottom-right">
             <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
               <span className="font-bold text-sm text-slate-800 flex items-center gap-2"><Filter className="w-4 h-4"/> 表示設定 & 絞り込み</span>
               <button onClick={() => setIsFilterOpen(false)}><X className="w-4 h-4 text-slate-400 hover:text-slate-600"/></button>
             </div>
             
             {/* 1. 表示オプション (トグル) */}
             <div className="mb-5 space-y-2">
               <div className="text-[10px] font-bold text-slate-400 mb-1">表示する項目</div>
               <div className="grid grid-cols-2 gap-2">
                 {[
                   { k: "timeInfo", label: "終了・時間" },
                   { k: "location", label: "場所" },
                   { k: "note", label: "メモ" },
                   { k: "tags", label: "タグ" },
                   { k: "assignee", label: "担当者" }
                 ].map((opt) => (
                   <button 
                     key={opt.k}
                     onClick={() => toggleOption(opt.k as keyof typeof showOptions)}
                     className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${showOptions[opt.k as keyof typeof showOptions] ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-200"}`}
                   >
                     {showOptions[opt.k as keyof typeof showOptions] ? <CheckSquare className="w-3.5 h-3.5"/> : <Square className="w-3.5 h-3.5"/>}
                     {opt.label}
                   </button>
                 ))}
               </div>
             </div>

             {/* 2. タグ絞り込み */}
             <div className="space-y-1">
                <div className="text-[10px] font-bold text-slate-400 mb-1">対象パートで絞り込み</div>
                <div className="max-h-[200px] overflow-y-auto pr-1 custom-scrollbar space-y-1">
                  <button 
                    onClick={() => setSelectedTags([])}
                    className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold transition-colors ${selectedTags.length === 0 ? "bg-cyan-50 text-[#00c2e8]" : "hover:bg-slate-50 text-slate-600"}`}
                  >
                    {selectedTags.length === 0 ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4"/>}
                    全て表示
                  </button>
                  {allTags.map((tag: string) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button 
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold transition-colors ${isSelected ? "bg-cyan-50 text-[#00c2e8]" : "hover:bg-slate-50 text-slate-600"}`}
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4"/>}
                        {tag}
                      </button>
                    )
                  })}
                </div>
             </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-5 py-4 rounded-full font-bold shadow-xl transition-all ${isFilterOpen || selectedTags.length > 0 ? "bg-cyan-500 text-white hover:bg-cyan-600" : "bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            <Eye className="w-5 h-5" />
            <span>表示・絞り込み</span>
          </button>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-full font-bold shadow-xl hover:bg-black hover:scale-105 transition-all"
          >
            <Printer className="w-5 h-5" />
            <span>印刷する</span>
          </button>
        </div>
      </div>

      {/* === ヘッダー === */}
      <header className="flex justify-between items-end border-b-4 border-slate-900 pb-6 mb-8 gap-8">
        <div className="space-y-4 flex-1">
          <div>
             <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight mb-3">{event.title}</h1>
             <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-lg font-bold text-slate-700">
                <div className="flex items-center gap-2"><Calendar className="w-5 h-5" /> {fmtDate(event.date)}</div>
                <div className="flex items-center gap-2"><MapPin className="w-5 h-5" /> {event.venue_name || "場所未定"}</div>
             </div>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
             <Hash className="w-3.5 h-3.5" />
             <span>出力対象: <span className="text-slate-900 text-sm">{targetDisplayName}</span></span>
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 shrink-0">
           <div className="border-2 border-slate-900 p-1 rounded bg-white">
             {publicUrl && <EventQRCode url={publicUrl} />}
           </div>
           <span className="text-[10px] font-bold text-slate-500 tracking-tight">最新情報</span>
        </div>
      </header>

      {/* === スケジュールテーブル === */}
      <main>
        {filteredItems.length === 0 ? (
           <div className="py-20 text-center text-slate-400 font-bold border-t border-slate-200 text-xl">
             表示する予定はありません
           </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-slate-900">
                <th className="py-4 pl-2 w-28 font-black text-sm text-slate-900">TIME</th>
                <th className="py-4 px-6 font-black text-sm text-slate-900">CONTENT</th>
                {(showOptions.tags || showOptions.assignee || showOptions.note) && (
                  <th className="py-4 px-4 w-1/3 font-black text-sm text-slate-900">DETAILS</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => {
                 const duration = getDuration(item.start_time, item.end_time);
                 const tags = item.target && item.target !== "all" && item.target !== "全員"
                    ? item.target.split(",").map((t: string) => t.trim()) : [];
                 const assignees = item.assignee ? item.assignee.split(",").map((a: string) => a.trim()) : [];

                 return (
                   <tr key={item.id} className="border-b border-slate-300 page-break group odd:bg-white even:bg-slate-50">
                     
                     {/* 1. 時間カラム */}
                     <td className="py-5 pl-2 align-top">
                       <div className="text-2xl font-black tracking-tighter leading-none text-slate-900 tabular-nums">
                         {hhmm(item.start_time)}
                       </div>
                       {/* 終了時刻 (オプション) */}
                       {showOptions.timeInfo && item.end_time && (
                         <div className="text-sm font-bold text-slate-500 mt-1.5 flex items-center gap-1 tabular-nums">
                           <ArrowRight className="w-3 h-3 opacity-50"/> {hhmm(item.end_time)}
                         </div>
                       )}
                     </td>

                     {/* 2. 内容カラム */}
                     <td className="py-5 px-6 align-top">
                       <div className="space-y-2">
                          {/* タイトル */}
                          <div className="text-xl font-black text-slate-900 leading-tight">
                            {item.title}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                            {/* 場所 (オプション) */}
                            {showOptions.location && item.location && (
                              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                {item.location}
                              </div>
                            )}

                            {/* 所要時間 (オプション・場所の下/横に配置) */}
                            {showOptions.timeInfo && duration && (
                              <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                {duration}
                              </div>
                            )}
                          </div>
                       </div>
                     </td>

                     {/* 3. 詳細カラム (表示項目がある場合のみ) */}
                     {(showOptions.tags || showOptions.assignee || showOptions.note) && (
                       <td className="py-5 px-4 align-top">
                         <div className="flex flex-col gap-3">
                           
                           {/* メモ (オプション: アイコン+テキストのみ) */}
                           {showOptions.note && item.note && (
                              <div className="flex items-start gap-2 text-sm font-medium text-slate-700 leading-relaxed">
                                <StickyNote className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                                <span className="whitespace-pre-wrap">{item.note}</span>
                              </div>
                           )}

                           {/* タグ (オプション) */}
                           {showOptions.tags && tags.length > 0 && (
                             <div className="flex flex-wrap gap-1.5">
                               {tags.map((t: string) => (
                                 <span key={t} className="px-2 py-0.5 rounded border border-slate-300 bg-white text-[10px] font-bold text-slate-600">
                                   {t}
                                 </span>
                               ))}
                             </div>
                           )}

                           {/* 担当者 (オプション) */}
                           {showOptions.assignee && assignees.length > 0 && (
                             <div className="flex items-start gap-1.5 text-xs text-slate-500 pt-1">
                               <User className="w-4 h-4 shrink-0 text-slate-400" />
                               <div className="font-bold leading-relaxed">
                                 {assignees.join("、")}
                               </div>
                             </div>
                           )}
                         </div>
                       </td>
                     )}
                   </tr>
                 );
              })}
            </tbody>
          </table>
        )}
      </main>

      {/* フッター */}
      <footer className="mt-12 pt-6 border-t-2 border-slate-900 flex justify-between items-end text-[10px] font-bold text-slate-400 page-break">
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