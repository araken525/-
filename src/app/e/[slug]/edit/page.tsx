"use client";

import { useState, use, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Lock, Unlock, ArrowUpRight, LogOut, Edit3, 
  Sparkles, ArrowRight, Plus, 
  ListOrdered, Settings2
} from "lucide-react";

// 分割したコンポーネントをインポート
import EditMaterials from "@/components/edit/EditMaterials";
import EditEmergencyContacts from "@/components/edit/EditEmergencyContacts";
import EditScheduleList from "@/components/edit/EditScheduleList";
import EditItemSheet from "@/components/edit/EditItemSheet";
import EditEventInfo from "@/components/edit/EditEventInfo"; // ★追加

export default function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  // --- State ---
  const [ok, setOk] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [event, setEvent] = useState<any>(null);
  
  const [items, setItems] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  // 編集シート制御
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // タブ制御 (mobile only)
  const [activeTab, setActiveTab] = useState<'schedule' | 'settings'>('schedule');

  // 入力候補
  const [recentTags, setRecentTags] = useState<string[]>(["全員"]);
  const [recentAssignees, setRecentAssignees] = useState<string[]>([]);

  // --- Data Loading ---
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
      if (data) {
        setEvent(data);
        if (data.emergency_contacts) setContacts(data.emergency_contacts);
      }
    })();
  }, [slug]);

  async function loadAllData() {
    if (!event?.id) return;

    // イベント情報自体の再取得 (タイトルなどが変わった場合のため)
    const { data: eData } = await supabase.from("events").select("*").eq("id", event.id).single();
    if (eData) {
      setEvent(eData);
      if (eData.emergency_contacts) setContacts(eData.emergency_contacts);
    }
    
    // スケジュール
    const { data: sData } = await supabase.from("schedule_items").select("*").eq("event_id", event.id).order("start_time", { ascending: true }).order("sort_order", { ascending: true });
    setItems(sData ?? []);
    
    if (sData) {
      const tags = new Set<string>(["全員"]);
      const assignees = new Set<string>();
      sData.forEach((it) => { 
         if (it.target && it.target !== "all") {
            it.target.split(",").forEach((t: string) => tags.add(t.trim()));
         }
         if (it.assignee) {
            it.assignee.split(",").forEach((a: string) => assignees.add(a.trim()));
         }
      });
      setRecentTags(Array.from(tags));
      setRecentAssignees(Array.from(assignees));
    }

    // 資料
    const { data: mData } = await supabase.from("event_materials").select("*").eq("event_id", event.id).order("sort_order", { ascending: true });
    setMaterials(mData ?? []);
  }

  useEffect(() => { if (event?.id) loadAllData(); }, [event?.id]);
  useEffect(() => { if (sessionStorage.getItem(`edit-ok:${slug}`)) setOk(true); }, [slug]);

  // --- Auth ---
  async function checkPassword() {
    setStatus("確認中...");
    const { data } = await supabase.from("events").select("edit_password").eq("slug", slug).maybeSingle();
    if (!data?.edit_password) return setStatus("PW未設定");
    if (data.edit_password === password) {
      sessionStorage.setItem(`edit-ok:${slug}`, "true");
      setOk(true); setStatus(""); loadAllData();
    } else { setStatus("パスワードが違います"); }
  }

  function resetLock() {
    sessionStorage.removeItem(`edit-ok:${slug}`); setOk(false); setPassword(""); setStatus("ログアウトしました");
  }

  function openSheet(item?: any) {
    setEditingItem(item || null);
    setIsSheetOpen(true);
  }

  // --- Render: Locked ---
  if (!ok) {
    return (
      <main className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-sm bg-white rounded-[2rem] shadow-xl p-8 space-y-6 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300 mb-4"><Lock className="w-8 h-8" /></div>
          <h1 className="text-xl font-black text-slate-800">編集モード 🔐</h1>
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full h-14 px-4 bg-slate-50 rounded-2xl text-center text-lg font-black outline-none focus:ring-4 focus:ring-cyan-50 transition-all"/>
          <button onClick={checkPassword} className="w-full h-14 bg-[#00c2e8] text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"><Unlock className="w-5 h-5" /> 認証する</button>
          {status && <div className="text-sm font-bold text-red-500 animate-pulse">{status}</div>}
          <a href={`/e/${slug}`} className="block text-xs font-bold text-slate-400 hover:text-[#00c2e8] mt-4">公開ページに戻る</a>
        </div>
      </main>
    );
  }

  // --- Render: Edit Mode ---
  return (
    <main className="min-h-screen bg-[#f7f9fb] pb-32 font-sans selection:bg-[#00c2e8] selection:text-white relative">
      
      {/* 1. ヘッダー (固定) */}
      <header className="fixed top-0 inset-x-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100 px-4 h-14 flex items-center justify-between shadow-sm">
         <div className="flex items-center gap-2 font-black text-slate-800 truncate">
            <Edit3 className="w-4 h-4 text-[#00c2e8]" />
            <span className="truncate">{event?.title || slug} の編集</span>
         </div>
         <div className="flex gap-2 shrink-0">
            <a href={`/e/${slug}`} target="_blank" className="w-9 h-9 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-[#00c2e8] transition-all"><ArrowUpRight className="w-4 h-4"/></a>
            <button onClick={resetLock} className="w-9 h-9 flex items-center justify-center bg-slate-50 rounded-full text-slate-400 hover:text-red-500 transition-all"><LogOut className="w-4 h-4"/></button>
         </div>
      </header>

      {/* 2. ステータス通知 */}
      {status && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl bg-slate-800/90 text-white text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-md whitespace-nowrap">
          {status}
        </div>
      )}

      {/* 3. モバイル用タブスイッチャー (md以上では非表示) */}
      <div className="md:hidden fixed top-14 inset-x-0 z-20 bg-[#f7f9fb]/95 backdrop-blur-sm px-4 py-2 border-b border-slate-200/50">
         <div className="bg-slate-200/50 p-1 rounded-xl flex relative">
            {/* アクティブなタブの背景 (アニメーション用) */}
            <div 
              className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out ${activeTab === 'schedule' ? 'left-1' : 'left-[calc(50%+4px)]'}`}
            ></div>

            <button 
               onClick={() => setActiveTab('schedule')} 
               className={`flex-1 relative z-10 py-1.5 text-xs font-black flex items-center justify-center gap-1.5 transition-colors duration-300 ${activeTab === 'schedule' ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <ListOrdered className="w-3.5 h-3.5" /> スケジュール
            </button>
            <button 
               onClick={() => setActiveTab('settings')} 
               className={`flex-1 relative z-10 py-1.5 text-xs font-black flex items-center justify-center gap-1.5 transition-colors duration-300 ${activeTab === 'settings' ? 'text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
            >
               <Settings2 className="w-3.5 h-3.5" /> 設定・資料
            </button>
         </div>
      </div>

      {/* 4. メインコンテンツエリア */}
      <div className="pt-32 md:pt-24 px-4 w-full max-w-lg md:max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* === 左カラム: 設定・資料・連絡先 === */}
          <div className={`md:col-span-4 md:sticky md:top-24 space-y-6 ${activeTab === 'settings' ? 'block animate-in fade-in slide-in-from-left-4 duration-300' : 'hidden md:block'}`}>
            
            {/* ★ イベント基本情報の編集コンポーネント */}
            {event && (
              <EditEventInfo 
                event={event} 
                onUpdate={loadAllData} 
                setStatus={setStatus} 
              />
            )}

            {/* 資料管理 */}
            <EditMaterials 
               eventId={event?.id} 
               materials={materials} 
               onUpdate={loadAllData} 
               setStatus={setStatus} 
            />

            {/* 緊急連絡先管理 */}
            <EditEmergencyContacts 
               eventId={event?.id} 
               contacts={contacts} 
               setContacts={setContacts} 
               setStatus={setStatus} 
            />
          </div>

          {/* === 右カラム: スケジュール一覧 === */}
          <div className={`md:col-span-8 ${activeTab === 'schedule' ? 'block animate-in fade-in slide-in-from-right-4 duration-300' : 'hidden md:block'}`}>
             <EditScheduleList 
               items={items} 
               materials={materials} 
               onEdit={openSheet} 
               onDelete={loadAllData} 
               setStatus={setStatus} 
             />
          </div>
        </div>
      </div>

      {/* 5. 新規追加ボタン (FAB) */}
      <button 
         onClick={() => openSheet()} 
         className={`
           fixed bottom-6 right-6 w-14 h-14 bg-[#00c2e8] rounded-full shadow-xl shadow-cyan-200 text-white flex items-center justify-center active:scale-90 transition-all z-30 hover:scale-105 hover:bg-cyan-400
           ${activeTab === 'schedule' ? 'scale-100 opacity-100' : 'scale-0 opacity-0 md:scale-100 md:opacity-100'}
         `}
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* 6. 編集シート */}
      <EditItemSheet 
         isOpen={isSheetOpen}
         onClose={() => setIsSheetOpen(false)}
         editingItem={editingItem}
         eventId={event?.id}
         materials={materials}
         onSaved={() => { setIsSheetOpen(false); loadAllData(); }}
         setStatus={setStatus}
         recentTags={recentTags}
         recentAssignees={recentAssignees}
         onReload={loadAllData}
         allItems={items}
      />
      
      {/* 7. フッター */}
      <footer className={`mt-32 pb-12 px-4 ${activeTab === 'schedule' ? 'block' : 'hidden md:block'}`}>
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
            <a href="/" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white text-[#00c2e8] rounded-2xl font-black text-sm hover:bg-cyan-50 transition-all active:scale-95 shadow-lg">
              無料でイベントを作る <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="max-w-xl mx-auto text-center space-y-8">
           <div className="flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-400">
              <a href="/" className="hover:text-[#00c2e8] transition-colors">トップページ</a>
              <span className="text-slate-300">|</span>
              <a href="https://x.com/araken525_toho" target="_blank" rel="noopener noreferrer" className="hover:text-[#00c2e8] transition-colors">開発者 (X)</a>
              <span className="text-slate-300">|</span>
              <a href="https://kawasakiebase.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#00c2e8] transition-colors">運営元</a>
           </div>
           <div className="space-y-2">
              <div className="text-2xl font-black text-slate-300 tracking-tighter">TaiSuke</div>
              <div className="text-[10px] text-slate-400 font-bold">© 2026 Time Schedule Sharing App</div>
           </div>
           <div className="pt-8 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-300 tracking-[0.2em] mb-3">PRODUCED BY</p>
              <a href="https://kawasakiebase.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group">
                 <span className="w-2.5 h-2.5 rounded-full bg-[#00c2e8] group-hover:scale-125 transition-transform shadow-sm shadow-cyan-200"></span>
                 <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900 tracking-wide">ENSEMBLE LABS</span>
              </a>
           </div>
        </div>
      </footer>
    </main>
  );
}