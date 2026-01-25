"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ArrowRight, Copy, Check, Link as LinkIcon, Lock, Calendar, MapPin, Type, Mail, Share2, AlertCircle, Plus } from "lucide-react";

export default function CreateEventPage() {
  const [step, setStep] = useState<"form" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // フォーム入力
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [slug, setSlug] = useState("");
  const [venue, setVenue] = useState("");
  const [password, setPassword] = useState("");

  // URL ID入力欄の表示/非表示ステート
  const [showUrlId, setShowUrlId] = useState(false);

  // 作成後のURL
  const [publicUrl, setPublicUrl] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);

  // ロジック関数
  async function createEvent() {
    if (!title || !date || !password) {
      setError("必須項目（タイトル、日付、パスワード）を入力してください 🙇‍♂️");
      return;
    }
    const finalSlug = slug.trim() || Math.random().toString(36).substring(2, 8);
    
    setLoading(true);
    setError("");

    // 1. 重複チェック
    const { data: existing } = await supabase.from("events").select("id").eq("slug", finalSlug).maybeSingle();
    if (existing) {
      setLoading(false);
      setError("そのURL IDは既に使われています 💦 別のIDにしてください。");
      return;
    }

    // 2. 作成
    const { error: insertError } = await supabase.from("events").insert({
      title: title.trim(),
      date: date,
      slug: finalSlug,
      venue_name: venue.trim() || null,
      edit_password: password.trim(),
    });

    if (insertError) {
      setLoading(false);
      setError("エラーが発生しました: " + insertError.message);
      return;
    }

    // 3. 完了画面へ
    const origin = window.location.origin;
    setPublicUrl(`${origin}/e/${finalSlug}`);
    setEditUrl(`${origin}/e/${finalSlug}/edit`);
    setStep("done");
    setLoading(false);
  }

  const copyToClipboard = (text: string, isEdit: boolean) => {
    navigator.clipboard.writeText(text);
    if (isEdit) {
      setCopiedEdit(true); setTimeout(() => setCopiedEdit(false), 2000);
    } else {
      setCopiedPublic(true); setTimeout(() => setCopiedPublic(false), 2000);
    }
  };

  // LINEシェア
  const shareToLine = (text: string, url: string) => {
    const message = `${text}\n${url}`;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(message)}`, '_blank');
  };

  // メールシェア
  const shareToMail = (subject: string, body: string, url: string) => {
    const message = `${body}\n${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  };

  return (
    // ★変更: pt-20 pb-20 を追加し、縦の余白を確保 (スマホ/PC共通のベースレイアウト)
    <main className="min-h-screen bg-[#f7f9fb] p-4 sm:p-6 font-sans text-slate-800 selection:bg-[#00c2e8] selection:text-white pt-10 md:pt-24 pb-20">
      
      {/* ★変更: コンテナ幅を最大6xlまで拡張 (iPad/PC対応) */}
      <div className="w-full max-w-lg md:max-w-6xl mx-auto transition-all duration-500">
      
      {/* === 入力画面 === */}
      {step === "form" && (
        // ★変更: Gridレイアウトの導入 (スマホ1列 : PC2列)
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start animate-in fade-in zoom-in-95 duration-500">
          
          {/* 左カラム: タイトル & ガイド (PC/iPadで固定表示) */}
          <div className="md:col-span-5 md:sticky md:top-24 text-center md:text-left">
             <h1 className="text-2xl sm:text-4xl font-black text-slate-800 mb-4 tracking-tight leading-tight">
               新しい<br className="hidden md:block"/>タイスケを作成
             </h1>
             <p className="text-sm font-bold text-slate-400 hidden md:block leading-relaxed">
               イベント名と日時を入力して、<br/>すぐにページを発行しましょう。
             </p>
          </div>

          {/* 右カラム: フォーム (PCでも広がりすぎないよう max-w-lg で制限) */}
          <div className="md:col-span-7 w-full max-w-md md:max-w-lg mx-auto md:mx-0">
            
            {/* 基本情報カード */}
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-xl overflow-hidden mb-6">
              <div className="divide-y divide-slate-100/80">
                
                {/* 1. タイトル */}
                <div className="flex items-center justify-between py-3.5 px-4 sm:px-6">
                   <label className="flex items-center gap-2 text-sm font-bold text-slate-600 shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center"><Type className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></div>
                      イベント名<span className="text-red-400">*</span>
                   </label>
                   <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="定期演奏会" className="flex-1 min-w-0 ml-2 text-center font-black text-slate-800 placeholder:text-slate-300 outline-none bg-transparent h-10 truncate"/>
                </div>

                {/* 2. 日付 */}
                <div className="flex items-center justify-between py-3.5 px-4 sm:px-6">
                   <label className="flex items-center gap-2 text-sm font-bold text-slate-600 shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-100 text-green-500 rounded-full flex items-center justify-center"><Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></div>
                      開催日<span className="text-red-400">*</span>
                   </label>
                   <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 min-w-0 ml-2 text-center font-black text-slate-800 outline-none bg-transparent h-10 appearance-none relative z-10 cursor-pointer"/>
                </div>

                {/* 3. 場所 */}
                <div className="flex items-center justify-between py-3.5 px-4 sm:px-6">
                   <label className="flex items-center gap-2 text-sm font-bold text-slate-600 shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center"><MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></div>
                      場所
                   </label>
                   <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="ミューザ" className="flex-1 min-w-0 ml-2 text-center font-black text-slate-800 placeholder:text-slate-300 outline-none bg-transparent h-10 truncate"/>
                </div>
              </div>
            </div>
            
            {/* 設定グループ */}
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-xl overflow-hidden mb-8">
               <div className="divide-y divide-slate-100/80">
                 
                 {/* 4. パスワード */}
                 <div className="flex items-center justify-between py-3.5 px-4 sm:px-6">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-600 shrink-0">
                       <div className="w-7 h-7 sm:w-8 sm:h-8 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center"><Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></div>
                       パスワード<span className="text-red-400">*</span>
                    </label>
                    <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="0000" className="flex-1 min-w-0 ml-2 text-center font-black text-orange-500 placeholder:text-slate-300 outline-none bg-transparent h-10 truncate"/>
                 </div>

                 {/* 5. URL ID */}
                 {showUrlId ? (
                   <div className="flex items-center justify-between py-3.5 px-4 sm:px-6 bg-slate-50/50 animate-in fade-in slide-in-from-top-2">
                      <label className="flex items-center gap-2 text-sm font-bold text-slate-600 shrink-0">
                         <div className="w-7 h-7 sm:w-8 sm:h-8 bg-cyan-100 text-cyan-500 rounded-full flex items-center justify-center"><LinkIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4"/></div>
                         URL ID
                      </label>
                      <div className="flex-1 min-w-0 flex items-center justify-center gap-1 ml-2">
                         <span className="text-slate-400 font-bold text-sm shrink-0">/e/</span>
                         <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))} placeholder="regularconcert2026" className="flex-1 min-w-0 text-center font-black text-slate-800 placeholder:text-slate-300 outline-none bg-transparent h-10 truncate"/>
                      </div>
                   </div>
                 ) : (
                   <button onClick={() => setShowUrlId(true)} className="w-full py-3.5 px-4 sm:px-6 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">
                     <Plus className="w-3.5 h-3.5"/> URLを自分で決める (オプション)
                   </button>
                 )}
               </div>
            </div>

            {error && <div className="mb-6 flex items-center justify-center gap-2 text-sm font-bold text-red-500 bg-red-50 py-3 rounded-2xl animate-pulse px-4 text-center"><AlertCircle className="w-4 h-4 shrink-0"/>{error}</div>}

            <button 
              onClick={createEvent} 
              disabled={loading}
              className="w-full h-14 sm:h-16 bg-[#00c2e8] text-white rounded-[1.2rem] sm:rounded-[1.5rem] font-black text-lg shadow-xl shadow-cyan-200/50 hover:bg-cyan-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? "作成中..." : <>タイスケを作成 <ArrowRight className="w-6 h-6" /></>}
            </button>
          </div>
        </div>
      )}

      {/* === 完了画面 === */}
      {step === "done" && (
        // ★変更: Gridレイアウトの導入
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-start animate-in fade-in slide-in-from-bottom-8 duration-500">
          
          {/* 左カラム: タイトル & ガイド */}
          <div className="md:col-span-5 md:sticky md:top-24 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 leading-tight">準備<br className="hidden md:block"/>できました！🎉</h2>
            <p className="text-sm font-bold text-slate-400 hidden md:block leading-relaxed mb-8">
               URLを参加者に共有して、<br/>当日の準備を始めましょう。
            </p>
            {/* PCのみ表示: 左側の作成ボタン */}
            <button onClick={() => setStep("form")} className="hidden md:block text-sm font-bold text-slate-400 hover:text-[#00c2e8] transition-colors">
               ← もうひとつ作成する
            </button>
          </div>

          {/* 右カラム: 完了カード */}
          <div className="md:col-span-7 w-full max-w-md md:max-w-lg mx-auto md:mx-0">
            {/* 1. 主役：参加者用シェアカード */}
            <div className="relative bg-gradient-to-br from-[#00c2e8] to-cyan-500 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl shadow-cyan-200/50 p-6 sm:p-8 text-white overflow-hidden mb-6">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 text-white/10"><Share2 className="w-32 h-32 sm:w-40 sm:h-40"/></div>
              
              <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-4 opacity-90">
                    <span className="px-2.5 py-1 rounded-full bg-white/20 text-[10px] sm:text-xs font-black backdrop-blur-sm">みんなに共有</span>
                    <span className="text-xs font-bold">参加者用 (閲覧のみ)</span>
                 </div>
                 <h3 className="text-xl sm:text-2xl font-black mb-1 line-clamp-2">{title}</h3>
                 <p className="text-sm font-bold opacity-90 mb-6 flex items-center gap-1"><Calendar className="w-4 h-4"/> {date}</p>

                 <div onClick={() => copyToClipboard(publicUrl, false)} className="flex items-center justify-between bg-white/20 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl cursor-pointer hover:bg-white/30 transition-all mb-6 group">
                    <div className="flex-1 min-w-0 mr-3">
                       <div className="text-[10px] font-bold opacity-80 mb-0.5 sm:mb-1">{copiedPublic ? "コピーしました！" : "URLをコピー"}</div>
                       <div className="font-black text-xs sm:text-sm truncate selection:bg-white/30">{publicUrl}</div>
                    </div>
                    <div className="shrink-0 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 text-[#00c2e8] rounded-lg sm:rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                       {copiedPublic ? <Check className="w-4 h-4 sm:w-5 sm:h-5"/> : <Copy className="w-4 h-4 sm:w-5 sm:h-5"/>}
                    </div>
                 </div>

                 <div className="flex gap-2">
                   <button 
                     onClick={() => shareToLine(`${title}の招待状です！\n📅 ${date}\n\n▼参加はこちらから`, publicUrl)}
                     className="flex-1 h-12 sm:h-14 bg-[#06c755] hover:bg-[#05b34c] text-white rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-sm sm:text-base"
                   >
                     LINEで送る
                   </button>
                   <button 
                     onClick={() => shareToMail(`${title} タイムスケジュール`, `イベント: ${title}\n日付: ${date}\n\n▼タイムスケジュールはこちら\n`, publicUrl)}
                     className="flex-1 h-12 sm:h-14 bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm rounded-xl sm:rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-sm sm:text-base"
                   >
                     <Mail className="w-4 h-4"/> メール
                   </button>
                 </div>
              </div>
            </div>

            {/* 2. 脇役：管理者用カード */}
            <div className="bg-white border-2 border-orange-100 rounded-[1.5rem] sm:rounded-[2rem] p-5 sm:p-6 shadow-sm mb-6">
               <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <div className="flex items-center gap-1.5 text-orange-500">
                     <Lock className="w-4 h-4 sm:w-5 sm:h-5"/>
                     <span className="text-xs sm:text-sm font-black">管理者用 (控え)</span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-bold text-orange-300 bg-orange-50 px-2 py-1 rounded-full">編集・削除</span>
               </div>
               
               <div onClick={() => copyToClipboard(editUrl, true)} className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-orange-50/50 cursor-pointer hover:bg-orange-100/50 transition-all">
                  <div className="flex-1 min-w-0">
                     <div className="text-[10px] font-bold text-orange-400 mb-0.5 sm:mb-1">{copiedEdit ? "コピーしました！" : "タップしてコピー"}</div>
                     <div className="font-bold text-xs sm:text-sm text-slate-700 truncate">{editUrl}</div>
                  </div>
                  <div className="shrink-0 text-orange-400">
                     {copiedEdit ? <Check className="w-4 h-4 sm:w-5 sm:h-5"/> : <Copy className="w-4 h-4 sm:w-5 sm:h-5"/>}
                  </div>
               </div>
            </div>

            {/* スマホのみ表示: 下部の作成ボタン */}
            <button onClick={() => setStep("form")} className="block md:hidden w-full text-center text-sm font-bold text-slate-400 hover:text-[#00c2e8] transition-colors">
              もうひとつ作成する
            </button>
          </div>
        </div>
      )}
      
      </div>
    </main>
  );
}