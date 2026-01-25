"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2, X, MapPin, Clock, GripVertical, Check } from "lucide-react";
import { useRouter } from "next/navigation";

/* === 定数・型 === */
const DEFAULT_TAGS = ["全員", "木管", "金管", "打楽器", "弦楽器", "指揮者", "スタッフ"];

type ScheduleItem = {
  id?: number;
  title: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  target: string | null;
  note: string | null;
  sort_order: number;
};

/* === ヘルパー関数 === */
function hhmm(t: string) { return t ? t.slice(0, 5) : ""; }

/* === コンポーネント本体 === */
export default function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const [slug, setSlug] = useState<string>("");
  const [event, setEvent] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // モーダル用State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<ScheduleItem | null>(null);
  
  // タグ編集用State (文字列配列で管理)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const router = useRouter();

  // 初期ロード
  useEffect(() => {
    params.then(p => {
      setSlug(p.slug);
      loadData(p.slug);
    });
  }, [params]);

  async function loadData(s: string) {
    setLoading(true);
    const { data: ev } = await supabase.from("events").select("*").eq("slug", s).single();
    if (ev) {
      setEvent(ev);
      const { data: it } = await supabase
        .from("schedule_items")
        .select("*")
        .eq("event_id", ev.id)
        .order("start_time", { ascending: true })
        .order("sort_order", { ascending: true });
      setItems(it || []);
    }
    setLoading(false);
  }

  /* === 操作ロジック === */
  const openModal = (item?: any) => {
    if (item) {
      setEditItem(item);
      // カンマ区切りの文字列を配列に変換してセット
      const tags = item.target && item.target !== "all" ? item.target.split(",") : ["全員"];
      setSelectedTags(tags);
    } else {
      // 新規作成
      setEditItem({
        title: "",
        start_time: "10:00",
        end_time: "",
        location: "",
        target: "全員",
        note: "",
        sort_order: items.length + 1
      });
      setSelectedTags(["全員"]);
    }
    setIsModalOpen(true);
  };

  const toggleTag = (tag: string) => {
    if (tag === "全員") {
      // 「全員」を選んだら他をクリア
      setSelectedTags(["全員"]);
      return;
    }

    let newTags = [...selectedTags];
    if (newTags.includes("全員")) {
      newTags = newTags.filter(t => t !== "全員"); // 「全員」を外す
    }

    if (newTags.includes(tag)) {
      newTags = newTags.filter(t => t !== tag);
    } else {
      newTags.push(tag);
    }

    if (newTags.length === 0) newTags = ["全員"]; // 空っぽなら全員に戻す
    setSelectedTags(newTags);
  };

  const handleSave = async () => {
    if (!editItem || !event) return;

    // 配列をカンマ区切り文字列に戻す
    const targetStr = selectedTags.includes("全員") ? "全員" : selectedTags.join(",");
    
    const saveData = {
      ...editItem,
      event_id: event.id,
      target: targetStr
    };

    if (saveData.id) {
      await supabase.from("schedule_items").update(saveData).eq("id", saveData.id);
    } else {
      await supabase.from("schedule_items").insert(saveData);
    }
    
    setIsModalOpen(false);
    loadData(slug);
    
    // 閲覧ページを更新させるためにキャッシュをクリアするおまじない
    router.refresh(); 
  };

  const handleDelete = async () => {
    if (!editItem?.id) return;
    if (!confirm("本当に削除しますか？")) return;
    await supabase.from("schedule_items").delete().eq("id", editItem.id);
    setIsModalOpen(false);
    loadData(slug);
    router.refresh();
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">読み込み中...</div>;

  return (
    <div className="min-h-screen bg-[#f7f9fb] font-sans pb-24">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 h-14 flex items-center justify-between px-4">
        <Link href={`/e/${slug}`} className="p-2 -ml-2 text-slate-400 hover:text-slate-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-sm font-black text-slate-800">{event?.title} (編集)</h1>
        <div className="w-8"></div> {/* スペーサー */}
      </header>

      {/* リスト表示エリア */}
      <main className="pt-20 px-4 max-w-lg mx-auto space-y-3">
        {items.map((item) => (
          <div 
            key={item.id}
            onClick={() => openModal(item)}
            className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 active:scale-[0.98] transition-all flex gap-4 cursor-pointer group"
          >
            <div className="flex flex-col items-center justify-center w-12 pt-1">
               <span className="text-lg font-black text-slate-800 leading-none font-mono">{hhmm(item.start_time)}</span>
               {item.end_time && <span className="text-[10px] font-bold text-slate-400 mt-1">~{hhmm(item.end_time)}</span>}
            </div>
            
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-1">
                 <h3 className="font-bold text-slate-900 truncate">{item.title}</h3>
                 {item.target && item.target !== "全員" && (
                   <span className="shrink-0 text-[10px] font-black bg-cyan-50 text-[#00c2e8] px-1.5 py-0.5 rounded">
                     {item.target.replace(/,/g, "・")}
                   </span>
                 )}
               </div>
               <div className="text-xs text-slate-500 truncate flex items-center gap-2">
                 {item.location && <span className="flex items-center"><MapPin className="w-3 h-3 mr-0.5"/> {item.location}</span>}
                 {item.note && <span className="opacity-60">📝 メモあり</span>}
               </div>
            </div>

            <div className="text-slate-300">
               <GripVertical className="w-5 h-5" />
            </div>
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="text-center py-12 text-slate-400 font-bold text-sm">
            右下の ＋ ボタンで<br/>予定を追加してください
          </div>
        )}
      </main>

      {/* 追加ボタン (FAB) */}
      <button
        onClick={() => openModal()}
        className="fixed bottom-6 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-black hover:scale-105 active:scale-95 transition-all z-40"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* 編集モーダル */}
      {isModalOpen && editItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-md bg-white rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl animate-in slide-in-from-bottom-10 duration-300 overflow-hidden">
             
             {/* モーダルヘッダー */}
             <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
               <h3 className="text-lg font-black text-slate-800">
                 {editItem.id ? "予定を編集" : "新しい予定"}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-600">
                 <X className="w-5 h-5" />
               </button>
             </div>

             <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* 時間設定 */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 pl-1">開始時間</label>
                      <input 
                        type="time" 
                        value={editItem.start_time}
                        onChange={(e) => setEditItem({...editItem, start_time: e.target.value})}
                        className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 font-bold text-lg text-slate-800 focus:ring-2 focus:ring-[#00c2e8]"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 pl-1">終了時間 (任意)</label>
                      <input 
                        type="time" 
                        value={editItem.end_time || ""}
                        onChange={(e) => setEditItem({...editItem, end_time: e.target.value})}
                        className="w-full bg-slate-100 border-none rounded-xl px-4 py-3 font-bold text-lg text-slate-800 focus:ring-2 focus:ring-[#00c2e8]"
                      />
                   </div>
                </div>

                {/* タイトル & 場所 */}
                <div className="space-y-4">
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 pl-1">タイトル</label>
                      <input 
                        type="text" 
                        placeholder="例: リハーサル、全体合奏"
                        value={editItem.title}
                        onChange={(e) => setEditItem({...editItem, title: e.target.value})}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:border-[#00c2e8]"
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 pl-1">場所 (任意)</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="例: 大ホール、スタジオA"
                          value={editItem.location || ""}
                          onChange={(e) => setEditItem({...editItem, location: e.target.value})}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 font-bold text-slate-800 focus:outline-none focus:border-[#00c2e8]"
                        />
                      </div>
                   </div>
                </div>

                {/* ★ 複数タグ選択エリア */}
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 pl-1">対象パート (複数選択可)</label>
                   <div className="flex flex-wrap gap-2">
                      {DEFAULT_TAGS.map(tag => {
                        const isSelected = selectedTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`
                              px-3 py-2 rounded-lg text-xs font-black transition-all border
                              ${isSelected 
                                ? "bg-[#00c2e8] border-[#00c2e8] text-white shadow-md shadow-cyan-100" 
                                : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"}
                            `}
                          >
                            {isSelected && <Check className="w-3 h-3 inline-block mr-1 -mt-0.5" />}
                            {tag}
                          </button>
                        )
                      })}
                   </div>
                   {/* カスタムタグ入力は一旦省略し、プリセットのみでシンプルに */}
                </div>

                {/* メモ */}
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-400 pl-1">メモ (任意)</label>
                   <textarea 
                      placeholder="持ち物や詳細な指示など"
                      value={editItem.note || ""}
                      onChange={(e) => setEditItem({...editItem, note: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 min-h-[80px] focus:outline-none focus:border-[#00c2e8]"
                   />
                </div>
             </div>

             {/* フッターアクション */}
             <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
               {editItem.id && (
                 <button 
                   onClick={handleDelete}
                   className="w-14 h-14 flex items-center justify-center rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                 >
                   <Trash2 className="w-5 h-5" />
                 </button>
               )}
               <button 
                 onClick={handleSave}
                 className="flex-1 h-14 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-lg hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 <Save className="w-5 h-5" />
                 保存する
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}