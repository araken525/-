"use client";

import { useState, use, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Lock, Unlock, ArrowUpRight, LogOut, Save, Plus, RefreshCw, MapPin, AlignLeft, Edit3, Trash2, X, Clock, Calendar, ArrowUp, ArrowDown, Minus, Check, Link2, FileText, Paperclip, Youtube, Video, Image as ImageIcon, Sparkles, ArrowRight, Settings, ChevronDown, ChevronUp, XCircle, User, Users } from "lucide-react";

/* ===== ヘルパー関数 ===== */
function hhmm(t: string) { return String(t).slice(0, 5); }

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
  if (t.includes("休憩") || t.includes("昼") || t.includes("ランチ") || t.includes("ご飯")) return "🍱";
  if (t.includes("リハ") || t.includes("練習") || t.includes("合わせ") || t.includes("gp")) return "🎻";
  if (t.includes("開場") || t.includes("受付")) return "🎫";
  if (t.includes("開演") || t.includes("本番") || t.includes("ステージ")) return "✨";
  if (t.includes("終演") || t.includes("片付け") || t.includes("撤収")) return "🧹";
  if (t.includes("移動")) return "🚌";
  if (t.includes("トイレ")) return "🚽";
  if (t.includes("喫煙") || t.includes("タバコ")) return "🚬";
  if (t.includes("乾杯") || t.includes("打ち上げ") || t.includes("飲み")) return "🍻";
  if (t.includes("ホテル") || t.includes("宿")) return "🏨";
  return "🎵";
}
function getTargetColor(t: string) {
  if (!t || t === "all" || t === "全員") return "bg-slate-100 text-slate-500";
  return "bg-cyan-50 text-[#00c2e8]";
}

function getMaterialInfo(url: string) {
  const u = url.toLowerCase();
  const style = { color: "text-[#00c2e8]", bg: "bg-cyan-50" };
  if (u.includes("youtube") || u.includes("youtu.be")) return { icon: Youtube, ...style, label: "YouTube" };
  if (u.endsWith(".mp4") || u.endsWith(".mov") || u.includes("vimeo")) return { icon: Video, ...style, label: "Video" };
  if (u.endsWith(".pdf")) return { icon: FileText, ...style, label: "PDF" };
  if (u.match(/\.(jpg|jpeg|png|gif|webp)$/)) return { icon: ImageIcon, ...style, label: "Image" };
  return { icon: Link2, ...style, label: "Link" };
}

const EMOJI_PRESETS = ["🎵", "🎻", "🍱", "🎤", "🚌", "🚽", "🚬", "☕", "🍻", "🏨", "🎫", "✨", "🧹", "🚩"];

export default function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [ok, setOk] = useState(false);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [event, setEvent] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  
  const [materials, setMaterials] = useState<any[]>([]);
  const [matTitle, setMatTitle] = useState("");
  const [matUrl, setMatUrl] = useState("");
  const [matLoading, setMatLoading] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDivElement>(null);

  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isTagEditMode, setIsTagEditMode] = useState(false);

  // フォーム状態（assignee追加）
  const [formData, setFormData] = useState({
    startTime: "10:00", endTime: "", title: "", location: "", note: "", 
    target: "全員", assignee: "", // ★追加
    emoji: "🎵", sortOrder: 0, materialIds: [] as string[]
  });
  
  const [recentTags, setRecentTags] = useState<string[]>(["全員"]); 
  const [recentAssignees, setRecentAssignees] = useState<string[]>([]); // ★追加
  const [newTagInput, setNewTagInput] = useState("");
  const [newAssigneeInput, setNewAssigneeInput] = useState(""); // ★追加

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
      if (data) setEvent(data);
    })();
  }, [slug]);

  async function loadAllData() {
    if (!event?.id) return;
    
    // スケジュール (assigneeも取得)
    const { data: sData } = await supabase.from("schedule_items").select("*").eq("event_id", event.id).order("start_time", { ascending: true }).order("sort_order", { ascending: true });
    setItems(sData ?? []);
    if (sData) {
      // タグ収集
      const tags = new Set<string>(recentTags);
      const assignees = new Set<string>(recentAssignees);

      sData.forEach((it) => { 
         if (it.target && it.target !== "all") {
            it.target.split(",").forEach((t: string) => tags.add(t.trim()));
         }
         // ★担当者収集
         if (it.assignee) {
            it.assignee.split(",").forEach((a: string) => assignees.add(a.trim()));
         }
      });
      tags.delete("全員");
      setRecentTags(["全員", ...Array.from(tags)]);
      setRecentAssignees(Array.from(assignees));
    }

    const { data: mData } = await supabase.from("event_materials").select("*").eq("event_id", event.id).order("sort_order", { ascending: true });
    setMaterials(mData ?? []);
  }

  useEffect(() => { if (event?.id) loadAllData(); }, [event?.id]);
  useEffect(() => { if (sessionStorage.getItem(`edit-ok:${slug}`)) setOk(true); }, [slug]);

  useEffect(() => {
    if (!editingId && formData.title) {
      const detected = detectEmoji(formData.title);
      if (formData.emoji === "🎵" || EMOJI_PRESETS.includes(formData.emoji)) {
         if (detected !== "🎵") setFormData(prev => ({ ...prev, emoji: detected }));
      }
    }
  }, [formData.title]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(event.target as Node)) closeSheet();
    }
    if (isSheetOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSheetOpen]);

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
    sessionStorage.removeItem(`edit-ok:${slug}`); setOk(false); setPassword(""); setStatus("ログアウトしました"); closeSheet();
  }

  function openSheet(item?: any) {
    if (item) {
      setEditingId(item.id);
      setFormData({
        startTime: hhmm(item.start_time), 
        endTime: item.end_time ? hhmm(item.end_time) : "",
        title: item.title ?? "", 
        location: item.location ?? "", 
        note: item.note ?? "",
        target: item.target ?? "全員", 
        assignee: item.assignee ?? "", // ★追加
        emoji: item.emoji || detectEmoji(item.title || ""), 
        sortOrder: item.sort_order ?? 0,
        materialIds: item.material_ids ? item.material_ids.split(",") : []
      });
    } else {
      setEditingId(null);
      setFormData({ 
        ...formData, 
        title: "", location: "", note: "", emoji: "🎵", sortOrder: 0, assignee: "",
        materialIds: []
      }); 
    }
    setNewTagInput("");
    setNewAssigneeInput("");
    setIsSortOpen(false);
    setIsTagEditMode(false);
    setIsSheetOpen(true);
  }
  function closeSheet() { setIsSheetOpen(false); setTimeout(() => setEditingId(null), 300); }

  function toggleTag(tag: string) {
    if (isTagEditMode) {
      // ★リネーム処理
      if(tag === "全員") return;
      const newName = prompt(`「${tag}」の名前を変更しますか？\n(過去のデータも全て書き換わります)`, tag);
      if(newName && newName !== tag) {
        renameTagGlobally(tag, newName);
      }
      return;
    }

    if (tag === "全員") {
      setFormData({ ...formData, target: "全員" });
      return;
    }
    let currentTags = formData.target ? formData.target.split(",").map(t => t.trim()).filter(Boolean) : [];
    if (currentTags.includes("全員")) currentTags = [];
    if (currentTags.includes(tag)) {
      currentTags = currentTags.filter(t => t !== tag);
    } else {
      currentTags.push(tag);
    }
    const newTarget = currentTags.length === 0 ? "全員" : currentTags.join(",");
    setFormData({ ...formData, target: newTarget });
  }

  // ★タグ一括置換ロジック
  async function renameTagGlobally(oldName: string, newName: string) {
    if (!confirm(`本当に「${oldName}」を「${newName}」に変更しますか？\nこれは全てのスケジュールに反映されます。`)) return;
    
    setStatus("タグ名を変更中...");
    
    // 1. 影響を受けるアイテムを探す
    const targetsToUpdate = items.filter(it => {
       const tags = it.target ? it.target.split(",").map((t: string) => t.trim()) : [];
       return tags.includes(oldName);
    });

    // 2. 更新ループ
    for (const item of targetsToUpdate) {
       const oldTags = item.target.split(",").map((t: string) => t.trim());
       const newTags = oldTags.map((t: string) => t === oldName ? newName : t).join(",");
       
       await supabase.from("schedule_items").update({ target: newTags }).eq("id", item.id);
    }

    // 3. ローカルの履歴も更新
    const newRecents = recentTags.map(t => t === oldName ? newName : t);
    setRecentTags(newRecents);
    
    // 4. フォームも更新（もし現在編集中なら）
    if(formData.target.includes(oldName)) {
       const currentFormTags = formData.target.split(",").map(t => t.trim());
       const newFormTags = currentFormTags.map(t => t === oldName ? newName : t).join(",");
       setFormData(prev => ({ ...prev, target: newFormTags }));
    }

    setStatus("変更完了");
    loadAllData();
    setTimeout(() => setStatus(""), 2000);
  }

  function addNewTag() {
    const t = newTagInput.trim();
    if (!t) return;
    if (!recentTags.includes(t)) setRecentTags([...recentTags, t]);
    let currentTags = formData.target ? formData.target.split(",").map(x => x.trim()).filter(Boolean) : [];
    if (currentTags.includes("全員")) currentTags = [];
    if (!currentTags.includes(t)) currentTags.push(t);
    setFormData({ ...formData, target: currentTags.join(",") });
    setNewTagInput("");
  }
  
  // ★担当者トグル
  function toggleAssignee(name: string) {
    let current = formData.assignee ? formData.assignee.split(",").map(t => t.trim()).filter(Boolean) : [];
    if (current.includes(name)) {
      current = current.filter(t => t !== name);
    } else {
      current.push(name);
    }
    setFormData({ ...formData, assignee: current.join(",") });
  }

  // ★担当者追加
  function addNewAssignee() {
    const t = newAssigneeInput.trim();
    if (!t) return;
    if (!recentAssignees.includes(t)) setRecentAssignees([...recentAssignees, t]);
    let current = formData.assignee ? formData.assignee.split(",").map(x => x.trim()).filter(Boolean) : [];
    if (!current.includes(t)) current.push(t);
    setFormData({ ...formData, assignee: current.join(",") });
    setNewAssigneeInput("");
  }

  function toggleMaterialLink(matId: number) {
    const idStr = String(matId);
    let currentIds = [...formData.materialIds];
    if (currentIds.includes(idStr)) {
      currentIds = currentIds.filter(id => id !== idStr);
    } else {
      currentIds.push(idStr);
    }
    setFormData({ ...formData, materialIds: currentIds });
  }

  function startEditMaterial(m: any) {
    setEditingMaterialId(m.id);
    setMatTitle(m.title);
    setMatUrl(m.url);
  }

  function cancelEditMaterial() {
    setEditingMaterialId(null);
    setMatTitle("");
    setMatUrl("");
  }

  async function updateMaterial() {
    if (!matTitle.trim() || !matUrl.trim() || !editingMaterialId) return;
    setMatLoading(true);
    const { error } = await supabase.from("event_materials").update({
      title: matTitle.trim(),
      url: matUrl.trim()
    }).eq("id", editingMaterialId);
    setMatLoading(false);
    if (error) {
       setStatus("エラー: " + error.message);
    } else {
       setMatTitle("");
       setMatUrl("");
       setEditingMaterialId(null);
       loadAllData();
       setStatus("リンクを更新しました");
       setTimeout(() => setStatus(""), 2000);
    }
  }

  async function addMaterial() {
    if (!matTitle.trim() || !matUrl.trim()) return;
    setMatLoading(true);
    const { error } = await supabase.from("event_materials").insert({
      event_id: event.id,
      title: matTitle.trim(),
      url: matUrl.trim(),
      sort_order: materials.length + 1
    });
    setMatLoading(false);
    if (error) {
       setStatus("エラー: " + error.message);
       setTimeout(() => setStatus(""), 2000);
    } else {
       setMatTitle("");
       setMatUrl("");
       loadAllData();
    }
  }

  async function removeMaterial(id: number) {
    if (!confirm("このリンクを削除しますか？")) return;
    const { error } = await supabase.from("event_materials").delete().eq("id", id);
    if (error) {
      setStatus("削除エラー");
    } else {
      if (editingMaterialId === id) cancelEditMaterial();
      loadAllData();
    }
  }

  async function saveItem() {
    if (!event?.id) return setStatus("イベント不明");
    if (!formData.title.trim()) return setStatus("タイトル必須");
    const payload = {
      event_id: event.id, 
      start_time: formData.startTime + ":00", 
      end_time: formData.endTime ? formData.endTime + ":00" : null,
      title: formData.title.trim(), 
      location: formData.location.trim() || null, 
      note: formData.note.trim() || null,
      target: formData.target.trim() || "全員", 
      assignee: formData.assignee.trim() || null, // ★追加
      emoji: formData.emoji || "🎵", 
      sort_order: formData.sortOrder,
      material_ids: formData.materialIds.length > 0 ? formData.materialIds.join(",") : null
    };
    setStatus(editingId ? "更新中..." : "追加中...");
    const res = editingId
      ? await supabase.from("schedule_items").update(payload).eq("id", editingId)
      : await supabase.from("schedule_items").insert(payload);
    if (res.error) return setStatus("エラー: " + res.error.message);
    setStatus(editingId ? "更新しました" : "追加しました");
    closeSheet(); loadAllData(); setTimeout(() => setStatus(""), 2000);
  }

  async function removeItem(id: string) {
    if (!confirm("本当に削除しますか？")) return;
    const { error } = await supabase.from("schedule_items").delete().eq("id", id);
    if (error) return setStatus("エラー: " + error.message);
    loadAllData(); setStatus("削除しました"); setTimeout(() => setStatus(""), 2000);
  }

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

  return (
    <main className="min-h-screen bg-[#f7f9fb] pb-32 font-sans selection:bg-[#00c2e8] selection:text-white relative">
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

      {status && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-xl bg-slate-800/90 text-white text-sm font-bold animate-in fade-in slide-in-from-top-2 duration-300 backdrop-blur-md whitespace-nowrap">
          {status}
        </div>
      )}

      <div className="pt-20 px-4 w-full max-w-lg md:max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* 左カラム */}
          <div className="md:col-span-4 md:sticky md:top-24 space-y-6">
            {event && (
              <section className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-50">
                 <div>
                   <h1 className="text-xl font-black text-slate-800 leading-tight mb-3">{event.title}</h1>
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-50 p-2 rounded-lg">
                        <Calendar className="w-4 h-4 text-slate-400"/>
                        {event.date}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-slate-500 bg-slate-50 p-2 rounded-lg">
                        <MapPin className="w-4 h-4 text-slate-400"/>
                        {event.venue_name || "未設定"}
                      </div>
                   </div>
                 </div>
              </section>
            )}

            {/* 資料管理エリア (省略なし) */}
            <section className="bg-white rounded-[1.5rem] shadow-sm border border-slate-50 overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                 <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-[#00c2e8]" />
                    <h3 className="text-sm font-black text-slate-700">資料リンク管理</h3>
                 </div>
                 <div className="text-[10px] font-bold text-slate-400">{materials.length}件</div>
              </div>
              
              <div className="p-4 bg-white space-y-3">
                 <div className="space-y-2">
                    <input type="text" value={matTitle} onChange={(e) => setMatTitle(e.target.value)} placeholder="タイトル (例: 進行表)" className="w-full h-10 px-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-100 transition-all border border-transparent focus:border-cyan-100"/>
                    <input type="text" value={matUrl} onChange={(e) => setMatUrl(e.target.value)} placeholder="URL (https://...)" className="w-full h-10 px-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-100 transition-all border border-transparent focus:border-cyan-100"/>
                 </div>
                 {editingMaterialId ? (
                   <div className="flex gap-2">
                      <button onClick={cancelEditMaterial} className="flex-1 h-10 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all">キャンセル</button>
                      <button onClick={updateMaterial} disabled={!matTitle || !matUrl || matLoading} className="flex-[2] h-10 bg-[#00c2e8] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-cyan-500 disabled:opacity-50 transition-all">{matLoading ? "更新中" : <><RefreshCw className="w-3.5 h-3.5" /> 保存</>}</button>
                   </div>
                 ) : (
                   <button onClick={addMaterial} disabled={!matTitle || !matUrl || matLoading} className="w-full h-10 bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-black disabled:opacity-50 transition-all shadow-sm">{matLoading ? "追加中..." : <><Plus className="w-3.5 h-3.5" /> 新規追加</>}</button>
                 )}
              </div>

              <div className="bg-slate-50/50 p-2 space-y-1 border-t border-slate-100 min-h-[100px]">
                 {materials.length > 0 ? materials.map(m => {
                    const { icon: Icon, color, bg } = getMaterialInfo(m.url);
                    const isEditing = editingMaterialId === m.id;
                    return (
                      <div key={m.id} className={`flex items-center justify-between p-2.5 rounded-xl transition-all group bg-white border ${isEditing ? "border-[#00c2e8] shadow-sm" : "border-slate-100 sm:hover:border-slate-300"}`}>
                         <div className="flex items-center gap-3 overflow-hidden">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
                            <div className="min-w-0">
                               <div className={`text-xs font-bold truncate ${isEditing ? "text-[#00c2e8]" : "text-slate-800"}`}>{m.title}</div>
                               <div className="text-[10px] text-slate-400 truncate opacity-70">{m.url}</div>
                            </div>
                         </div>
                         <div className="flex items-center gap-1 shrink-0">
                           <button onClick={() => startEditMaterial(m)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-[#00c2e8] hover:bg-cyan-50 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                           <button onClick={() => removeMaterial(m.id)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                         </div>
                      </div>
                    );
                 }) : (
                    <div className="flex flex-col items-center justify-center py-8 text-slate-300 gap-2"><Link2 className="w-6 h-6 opacity-50"/><span className="text-xs font-bold">まだリンクがありません</span></div>
                 )}
              </div>
            </section>
          </div>

          {/* 右カラム: スケジュール */}
          <section className="space-y-4 md:col-span-8 pb-32">
            <div className="flex items-center justify-between mb-4 px-1">
               <span className="text-xs font-bold text-slate-400">スケジュール ({items.length}件)</span>
            </div>
            
            {items.map((it) => {
               const badgeColor = getTargetColor(it.target);
               const emoji = it.emoji || detectEmoji(it.title);
               const duration = getDuration(it.start_time, it.end_time);
               const displayTarget = it.target && it.target !== "all" ? it.target.replace(/,/g, "・") : "全員";
               // ★担当者表示
               const displayAssignee = it.assignee ? it.assignee.replace(/,/g, ", ") : null;
               
               const currentMaterialIds = it.material_ids ? it.material_ids.split(",") : [];
               const validCount = currentMaterialIds.filter((id: string) => materials.some(m => String(m.id) === id)).length;
               
               return (
                <div key={it.id} className="relative bg-white rounded-[1.5rem] p-5 flex gap-5 items-stretch shadow-sm border border-slate-100 sm:hover:border-slate-300 transition-all group">
                  <div className="flex flex-col items-center shrink-0 space-y-2 pt-1">
                     <div className="text-lg font-black text-slate-800 leading-none">{hhmm(it.start_time)}</div>
                     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner">{emoji}</div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center py-1 pr-12">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                       <h3 className="text-lg font-black leading-tight text-slate-900">{it.title}</h3>
                       <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${badgeColor}`}>{displayTarget}</span>
                    </div>
                    
                    {it.end_time && (
                       <div className="flex items-center text-xs font-bold text-[#00c2e8] mb-2 bg-cyan-50 w-fit px-2 py-0.5 rounded-lg">
                          <Clock className="w-3 h-3 mr-1"/>~{hhmm(it.end_time)}
                       </div>
                    )}
                    
                    {it.note && <div className="text-xs text-slate-600 leading-relaxed font-medium mb-3 line-clamp-2">{it.note}</div>}
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-400">
                       {it.location && <div className="flex items-center bg-slate-50 px-2 py-1 rounded-md"><MapPin className="w-3 h-3 mr-1 text-slate-300"/>{it.location}</div>}
                       {/* ★担当者表示 */}
                       {displayAssignee && (
                          <div className="flex items-center bg-indigo-50 text-indigo-500 px-2 py-1 rounded-md">
                             <User className="w-3 h-3 mr-1" />{displayAssignee}
                          </div>
                       )}
                       {duration && <div className="bg-slate-50 px-2 py-1 rounded-md">⏳ {duration}</div>}
                       {validCount > 0 && (
                          <div className="flex items-center text-[#00c2e8] bg-cyan-50 px-2 py-1 rounded-md">
                            <Paperclip className="w-3 h-3 mr-1"/>{validCount}件
                          </div>
                       )}
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                     <button onClick={() => openSheet(it)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-[#00c2e8] hover:bg-cyan-50 flex items-center justify-center transition-all shadow-sm active:scale-95" title="編集">
                        <Edit3 className="w-4 h-4"/>
                     </button>
                     <button onClick={() => removeItem(it.id)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all shadow-sm active:scale-95" title="削除">
                        <Trash2 className="w-4 h-4"/>
                     </button>
                  </div>
                </div>
               );
            })}
            {items.length === 0 && <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-100 text-slate-300 font-bold">まだ予定がありません</div>}
          </section>
        </div>
      </div>

      <button onClick={() => openSheet()} className="fixed bottom-6 right-6 w-14 h-14 bg-[#00c2e8] rounded-full shadow-xl shadow-cyan-200 text-white flex items-center justify-center active:scale-90 transition-all z-30 hover:scale-105 hover:bg-cyan-400">
        <Plus className="w-8 h-8" />
      </button>

      {/* 入力フォーム */}
      <div className={`fixed inset-0 z-50 flex items-end justify-center pointer-events-none ${isSheetOpen ? "visible" : "invisible"}`}>
         <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${isSheetOpen ? "opacity-100 pointer-events-auto" : "opacity-0"}`} onClick={closeSheet}></div>
         
         <div ref={sheetRef} className={`relative w-full max-w-lg bg-white rounded-t-[2.5rem] shadow-2xl pointer-events-auto transition-transform duration-300 ease-out flex flex-col max-h-[95vh] ${isSheetOpen ? "translate-y-0" : "translate-y-full"}`}>
            <div className="shrink-0 relative h-12 flex items-center justify-center cursor-pointer" onClick={closeSheet}>
               <div className="w-12 h-1.5 bg-slate-200 rounded-full absolute top-4"></div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 pb-6 pt-0 space-y-8 no-scrollbar">
               {/* 1. タイトルセクション (省略なし) */}
               <div className="space-y-4">
                  <div className="flex items-start gap-4">
                     <div className="w-20 h-20 shrink-0 bg-slate-50 rounded-2xl flex items-center justify-center relative shadow-inner border border-slate-100">
                        <input type="text" value={formData.emoji} onChange={(e)=>setFormData({...formData, emoji:e.target.value})} className="w-full h-full bg-transparent text-center text-5xl outline-none p-0 appearance-none" placeholder="🎵"/>
                     </div>
                     <div className="flex-1 pt-1">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">タイトル</label>
                        <input type="text" value={formData.title} onChange={(e)=>setFormData({...formData, title:e.target.value})} placeholder="練習, 移動, 本番..." className="w-full bg-transparent text-2xl font-black placeholder:text-slate-200 outline-none border-b-2 border-slate-100 focus:border-[#00c2e8] transition-colors py-1 text-slate-800 appearance-none rounded-none"/>
                     </div>
                  </div>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 mask-linear">
                     {EMOJI_PRESETS.map((emoji) => (
                        <button key={emoji} onClick={() => setFormData({...formData, emoji})} className={`shrink-0 w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${formData.emoji === emoji ? "bg-cyan-50 text-[#00c2e8] scale-110 shadow-sm border border-cyan-100" : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}>{emoji}</button>
                     ))}
                  </div>
               </div>

               {/* 2. タイムブロック (省略なし) */}
               <div className="bg-slate-50 p-4 rounded-3xl space-y-4 border border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                     <Clock className="w-4 h-4 text-[#00c2e8]"/>
                     <span className="text-xs font-bold text-slate-500">時間設定</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="flex-1">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 text-center">開始</label>
                        <input type="time" value={formData.startTime} onChange={(e)=>setFormData({...formData, startTime:e.target.value})} className="w-full h-14 bg-white border border-slate-200 rounded-xl text-2xl font-black text-center outline-none shadow-sm focus:ring-2 focus:ring-cyan-100 focus:border-cyan-200 transition-all text-slate-800 appearance-none"/>
                     </div>
                     <div className="text-slate-300 pt-4"><ArrowRight className="w-6 h-6"/></div>
                     <div className="flex-1 relative">
                        <label className="text-[10px] font-bold text-slate-400 block mb-1 text-center">終了</label>
                        <div className="relative w-full h-14">
                           <input type="time" value={formData.endTime} onChange={(e)=>setFormData({...formData, endTime:e.target.value})} className={`w-full h-full bg-white border border-slate-200 rounded-xl text-2xl font-black text-center outline-none shadow-sm focus:ring-2 focus:ring-cyan-100 focus:border-cyan-200 transition-all appearance-none ${!formData.endTime ? 'text-transparent' : 'text-slate-800'}`}/>
                           {!formData.endTime && <div className="absolute inset-0 flex items-center justify-center text-slate-300 text-2xl font-black pointer-events-none tracking-widest">--:--</div>}
                        </div>
                        {formData.endTime && <button onClick={() => setFormData({...formData, endTime: ""})} className="absolute -top-2 -right-2 w-6 h-6 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm z-10"><X className="w-3 h-3"/></button>}
                     </div>
                  </div>
               </div>

               {/* 3. 詳細情報 */}
               <div className="space-y-4">
                  
                  {/* 対象タグ (リネーム機能付き) */}
                  <div>
                     <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-bold text-slate-400 block">対象タグ</label>
                        <button onClick={() => setIsTagEditMode(!isTagEditMode)} className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 ${isTagEditMode ? "bg-red-50 text-red-500" : "bg-slate-100 text-slate-400"}`}>{isTagEditMode ? "完了" : "編集"}</button>
                     </div>
                     
                     <div className="flex flex-wrap gap-2">
                        <button onClick={() => toggleTag("全員")} className={`h-9 px-4 rounded-full font-bold text-xs flex items-center gap-1 transition-all ${(formData.target === "全員" || !formData.target) ? "bg-[#00c2e8] text-white shadow-md shadow-cyan-200" : "bg-slate-100 text-slate-500"} ${isTagEditMode ? "opacity-50 pointer-events-none" : ""}`}>
                           {(formData.target === "全員" || !formData.target) && <Check className="w-3 h-3"/>} 全員
                        </button>
                        
                        {recentTags.filter(t => t !== "全員").map(t => {
                           const currentList = formData.target ? formData.target.split(",").map(x => x.trim()) : [];
                           const isActive = currentList.includes(t);
                           return (
                              <button key={t} onClick={() => isTagEditMode ? toggleTag(t) : toggleTag(t)} className={`h-9 px-3 rounded-full font-bold text-xs transition-all flex items-center gap-1 relative ${isTagEditMode ? "bg-red-50 text-red-500 border border-red-100 pr-8 animate-pulse-slow" : isActive ? "bg-cyan-50 text-[#00c2e8] border border-cyan-200" : "bg-white border border-slate-200 text-slate-500"}`}>
                                 {(!isTagEditMode && isActive) && <Check className="w-3 h-3"/>} 
                                 {t}
                                 {isTagEditMode && <div className="absolute right-1 top-1/2 -translate-y-1/2"><Edit3 className="w-3 h-3" /></div>}
                              </button>
                           )
                        })}
                     </div>
                     
                     {!isTagEditMode && (
                        <div className="flex gap-2 mt-3">
                           <input type="text" value={newTagInput} onChange={(e) => setNewTagInput(e.target.value)} placeholder="新しいタグ..." className="flex-1 h-9 bg-slate-50 rounded-lg px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-cyan-100 appearance-none"/>
                           <button onClick={addNewTag} disabled={!newTagInput.trim()} className="h-9 px-3 bg-slate-800 text-white rounded-lg text-xs font-bold disabled:opacity-50">追加</button>
                        </div>
                     )}
                  </div>

                  {/* ★追加: 担当スタッフ */}
                  <div className="pt-2 border-t border-slate-50">
                     <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-indigo-400"/>
                        <label className="text-[10px] font-bold text-slate-400 block">担当スタッフ (任意)</label>
                     </div>
                     <div className="flex flex-wrap gap-2 mb-3">
                        {recentAssignees.map(a => {
                           const current = formData.assignee ? formData.assignee.split(",").map(x => x.trim()) : [];
                           const isActive = current.includes(a);
                           return (
                              <button key={a} onClick={() => toggleAssignee(a)} className={`h-8 px-3 rounded-lg font-bold text-xs flex items-center gap-1 border transition-all ${isActive ? "bg-indigo-50 border-indigo-200 text-indigo-500" : "bg-white border-slate-200 text-slate-500"}`}>
                                 {isActive && <Check className="w-3 h-3"/>}{a}
                              </button>
                           )
                        })}
                     </div>
                     <div className="flex gap-2">
                        <input type="text" value={newAssigneeInput} onChange={(e) => setNewAssigneeInput(e.target.value)} placeholder="担当者名 (例: 田中)" className="flex-1 h-9 bg-slate-50 rounded-lg px-3 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-100 appearance-none"/>
                        <button onClick={addNewAssignee} disabled={!newAssigneeInput.trim()} className="h-9 px-3 bg-indigo-500 text-white rounded-lg text-xs font-bold disabled:opacity-50">追加</button>
                     </div>
                  </div>

                  <div className="space-y-3 pt-2">
                     <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 h-12 border border-slate-100">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0"/>
                        <input type="text" value={formData.location} onChange={(e)=>setFormData({...formData, location:e.target.value})} placeholder="場所 (例: 大ホール)" className="flex-1 bg-transparent text-sm font-bold outline-none text-slate-700 appearance-none"/>
                     </div>
                     <div className="flex items-start gap-3 bg-slate-50 rounded-2xl px-4 py-3 border border-slate-100">
                        <AlignLeft className="w-4 h-4 text-slate-400 shrink-0 mt-1"/>
                        <textarea value={formData.note} onChange={(e) => { setFormData({ ...formData, note: e.target.value }); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }} placeholder="メモ・備考" className="flex-1 bg-transparent text-sm font-medium outline-none resize-none min-h-[4rem] text-slate-700 appearance-none"></textarea>
                     </div>
                  </div>
               </div>
               
               {/* 4. 資料紐付け */}
               {materials.length > 0 && (
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                     <div className="flex items-center gap-2 px-1 text-slate-400">
                        <Paperclip className="w-4 h-4" />
                        <span className="text-xs font-bold">資料を紐付ける</span>
                     </div>
                     <div className="grid grid-cols-1 gap-2">
                        {materials.map(m => {
                           const isLinked = formData.materialIds.includes(String(m.id));
                           const { icon: Icon, color, bg } = getMaterialInfo(m.url);
                           return (
                              <button key={m.id} onClick={() => toggleMaterialLink(m.id)} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isLinked ? "bg-cyan-50 border-cyan-200 shadow-sm" : "bg-white border-slate-100 hover:bg-slate-50"}`}>
                                 <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}><Icon className={`w-4 h-4 ${color}`} /></div>
                                    <span className={`text-xs font-bold truncate ${isLinked ? "text-slate-800" : "text-slate-500"}`}>{m.title}</span>
                                 </div>
                                 {isLinked ? <div className="w-5 h-5 bg-[#00c2e8] rounded-full flex items-center justify-center"><Check className="w-3 h-3 text-white"/></div> : <div className="w-5 h-5 rounded-full border-2 border-slate-200"></div>}
                              </button>
                           )
                        })}
                     </div>
                  </div>
               )}

               {/* 並び順設定 (省略なし) */}
               <div className="pt-4 border-t border-slate-100">
                  <button onClick={() => setIsSortOpen(!isSortOpen)} className="flex items-center justify-between w-full py-2">
                     <div className="flex items-center gap-2 text-xs font-bold text-slate-400"><Settings className="w-4 h-4" /> 高度な設定・並び順</div>
                     {isSortOpen ? <ChevronUp className="w-4 h-4 text-slate-300"/> : <ChevronDown className="w-4 h-4 text-slate-300"/>}
                  </button>
                  {isSortOpen && (
                     <div className="flex items-center justify-between gap-4 pt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button onClick={() => setFormData({...formData, sortOrder: -10})} className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${formData.sortOrder < 0 ? "bg-cyan-50 border-cyan-200 text-[#00c2e8]" : "bg-white border-slate-100 text-slate-400"}`}><ArrowUp className="w-5 h-5"/><span className="text-[10px] font-black">一番上</span></button>
                        <button onClick={() => setFormData({...formData, sortOrder: 0})} className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${formData.sortOrder === 0 ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-400"}`}><Minus className="w-5 h-5"/><span className="text-[10px] font-black">標準</span></button>
                        <button onClick={() => setFormData({...formData, sortOrder: 10})} className={`flex-1 py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all border ${formData.sortOrder > 0 ? "bg-orange-50 border-orange-200 text-orange-500" : "bg-white border-slate-100 text-slate-400"}`}><ArrowDown className="w-5 h-5"/><span className="text-[10px] font-black">一番下</span></button>
                     </div>
                  )}
               </div>
            </div>

            <div className="shrink-0 p-6 pt-2 bg-white pb-8">
               <button onClick={saveItem} className="w-full h-14 bg-[#00c2e8] rounded-2xl font-black text-white active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-200/50 hover:bg-cyan-400">
                  {editingId ? <><RefreshCw className="w-5 h-5"/> 変更を保存</> : <><Save className="w-5 h-5"/> リストに追加</>}
               </button>
            </div>
         </div>
      </div>
      
      {/* フッター */}
      <footer className="mt-32 pb-12 px-4">
        {/* 省略なし */}
        <div className="max-w-xl mx-auto bg-gradient-to-br from-[#00c2e8] to-blue-600 rounded-[2rem] p-8 text-center text-white shadow-xl shadow-cyan-200/50 mb-12 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black mb-4 border border-white/20 shadow-sm">
               <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
               <span>完全無料・Beta版公開中</span>
            </div>
            <h3 className="text-2xl font-black mb-3 leading-tight tracking-tight drop-shadow-sm">あなたの団体でも、<br/><span className="text-cyan-100">TaiSuke</span> を使いませんか？</h3>
            <p className="text-sm font-bold text-cyan-50 mb-8 leading-relaxed opacity-90">練習日程、本番のタイムテーブル、資料共有。<br/>面倒な連絡を、これひとつでスマートに完結。</p>
            <a href="/" className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-4 bg-white text-[#00c2e8] rounded-2xl font-black text-sm hover:bg-cyan-50 transition-all active:scale-95 shadow-lg">無料でイベントを作る <ArrowRight className="w-4 h-4" /></a>
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