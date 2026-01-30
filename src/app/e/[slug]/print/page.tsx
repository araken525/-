"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Printer, Calendar, MapPin, Hash, User, StickyNote, Activity, 
  Filter, CheckSquare, Square, X, Loader2 
} from "lucide-react";
import EventQRCode from "@/components/EventQRCode";
import { Noto_Sans_JP } from "next/font/google";

// 美しい日本語フォントの導入
const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  preload: true,
  display: "swap",
});

/* === ヘルパー関数 === */
function hhmm(time: string) { return String(time).slice(0, 5); }

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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // URL (QRコード用)
  const [publicUrl, setPublicUrl] = useState("");

  // --- Data Loading ---
  useEffect(() => {
    // クライアント側でURLを構築
    if (typeof window !== "undefined") {
      setPublicUrl(`${window.location.origin}/e/${slug}`);
    }

    (async () => {
      // 1. イベント取得
      const { data: eData } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
      if (!eData) {
        setLoading(false);
        return;
      }
      setEvent(eData);

      // 2. アイテム取得
      const { data: iData } = await supabase.from("schedule_items").select("*").eq("event_id", eData.id).order("start_time", { ascending: true }).order("sort_order", { ascending: true });
      const loadedItems = iData ?? [];
      setItems(loadedItems);

      // 3. 全タグの抽出 (重複排除)
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

  // --- Filtering Logic ---
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const filteredItems = items.filter(it => {
    // 選択なし = 全表示
    if (selectedTags.length === 0) return true;

    // アイテムのタグを取得
    const itTargets = (!it.target || it.target === "all" || it.target === "全員") 
      ? ["全員"] 
      : it.target.split(",").map((t: string) => t.trim());

    // 「全員」タグがついているものは常に表示
    if (itTargets.includes("全員")) return true;

    // 選択されたタグが含まれているかチェック
    return itTargets.some((t: string) => selectedTags.includes(t));
  });

  const targetDisplayName = selectedTags.length === 0 ? "全員・全パート" : selectedTags.join("・");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
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

      {/* === 画面表示用ツールバー (印刷時は非表示) === */}
      <div className="no-print fixed bottom-8 right-8 z-50 flex flex-col items-end gap-4 animate-in slide-in-from-bottom-4 fade-in duration-700">
        
        {/* フィルタメニュー */}
        {isFilterOpen && (
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-64 mb-2 animate-in fade-in zoom-in-95 origin-bottom-right">
             <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
               <span className="font-bold text-sm text-slate-700">表示するタグを選択</span>
               <button onClick={() => setIsFilterOpen(false)}><X className="w-4 h-4 text-slate-400 hover:text-slate-600"/></button>
             </div>
             <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                <button 
                  onClick={() => setSelectedTags([])}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-xs font-bold transition-colors ${selectedTags.length === 0 ? "bg-slate-900 text-white" : "hover:bg-slate-50 text-slate-600"}`}
                >
                   {selectedTags.length === 0 ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4"/>}
                   全て表示 (全員)
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
        )}

        <div className="flex items-center gap-3">
          {/* 絞り込みボタン */}
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center gap-2 px-5 py-4 rounded-full font-bold shadow-xl transition-all ${isFilterOpen || selectedTags.length > 0 ? "bg-cyan-500 text-white hover:bg-cyan-600" : "bg-white text-slate-700 hover:bg-slate-50"}`}
          >
            <Filter className="w-5 h-5" />
            <span>{selectedTags.length > 0 ? `${selectedTags.length}件で絞り込み中` : "絞り込み"}</span>
          </button>

          {/* 印刷ボタン */}
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
      <header className="flex justify-between items-end border-b-2 border-slate-900 pb-6 mb-8 gap-8">
        <div className="space-y-4 flex-1">
          <div>
             <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight mb-2">{event.title}</h1>
             <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-base font-bold text-slate-700">
                <div className="flex items-center gap-2"><Calendar className="w-5 h-5" /> {fmtDate(event.date)}</div>
                <div className="flex items-center gap-2"><MapPin className="w-5 h-5" /> {event.venue_name || "場所未定"}</div>
             </div>
          </div>
          
          {/* フィルタ情報表示 (印刷用) */}
          <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-500">
             <Hash className="w-3 h-3" />
             <span>出力対象: {targetDisplayName}</span>
          </div>
        </div>

        {/* QRコード */}
        <div className="flex flex-col items-center gap-1 shrink-0">
           <div className="border border-slate-200 p-1 rounded bg-white">
             {publicUrl && <EventQRCode url={publicUrl} />}
           </div>
           <span className="text-[9px] font-bold text-slate-400 tracking-tight">最新情報</span>
        </div>
      </header>

      {/* === テーブル === */}
      <main>
        {filteredItems.length === 0 ? (
           <div className="py-12 text-center text-slate-400 font-bold border-t border-slate-200">
             条件に一致する予定はありません
           </div>
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
              {filteredItems.map((item) => {
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
                     
                     {/* 1. 時間カラム (font-mono削除、tabular-nums追加) */}
                     <td className="py-4 pl-2 align-top">
                       <div className="text-lg font-black tracking-tighter leading-none text-slate-900 tabular-nums">
                         {hhmm(item.start_time)}
                       </div>
                       {item.end_time && (
                         <div className="text-xs font-bold text-slate-400 mt-1 flex items-center gap-1 tabular-nums">
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