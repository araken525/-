"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ArrowRight, Copy, Check, Link as LinkIcon, Lock, Calendar, MapPin, Type, Mail, Share2, ChevronRight, AlertCircle } from "lucide-react";

export default function CreateEventPage() {
  const [step, setStep] = useState<"form" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // フォーム入力 (ロジック維持)
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [slug, setSlug] = useState("");
  const [venue, setVenue] = useState("");
  const [password, setPassword] = useState("");

  // 作成後のURL (ロジック維持)
  const [publicUrl, setPublicUrl] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);

  // ロジック関数 (変更なし)
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

  // LINEシェア (変更なし)
  const shareToLine = (text: string, url: string) => {
    const message = `${text}\n${url}`;
    window.open(`https://line.me/R/msg/text/?${encodeURIComponent(message)}`, '_blank');
  };

  // メールシェア (変更なし)
  const shareToMail = (subject: string, body: string, url: string) => {
    const message = `${body}\n${url}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
  };

  return (
    <main className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-6 font-sans text-slate-800 selection:bg-[#00c2e8] selection:text-white">
      
      {/* === 入力画面 (Apple Wallet風カードデザイン) === */}
      {step === "form" && (
        <div className="w-full max-w-lg animate-in fade-in zoom-in-95 duration-500">
          
          <h1 className="text-3xl font-black text-slate-800 text-center mb-8 tracking-tight">新しいイベント</h1>

          <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden mb-6">
            {/* iOS設定画面風のリスト形式 */}
            <div className="divide-y divide-slate-100/80 pl-6">
              
              {/* 1. タイトル */}
              <div className="flex items-center justify-between py-4 pr-6">
                 <label className="flex items-center gap-3 text-sm font-bold text-slate-600 shrink-0">
                    <div className="w-8 h-8 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center"><Type className="w-4 h-4"/></div>
                    イベント名<span className="text-red-400">*</span>
                 </label>
                 <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="入力..." className="flex-1 text-right font-bold text-slate-800 placeholder:text-slate-300 outline-none bg-transparent h-10"/>
              </div>

              {/* 2. 日付 */}
              <div className="flex items-center justify-between py-4 pr-6">
                 <label className="flex items-center gap-3 text-sm font-bold text-slate-600 shrink-0">
                    <div className="w-8 h-8 bg-green-100 text-green-500 rounded-full flex items-center justify-center"><Calendar className="w-4 h-4"/></div>
                    開催日<span className="text-red-400">*</span>
                 </label>
                 <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 text-right font-bold text-slate-800 outline-none bg-transparent h-10 appearance-none relative z-10 cursor-pointer text-right-date"/>
              </div>

              {/* 3. 場所 */}
              <div className="flex items-center justify-between py-4 pr-6">
                 <label className="flex items-center gap-3 text-sm font-bold text-slate-600 shrink-0">
                    <div className="w-8 h-8 bg-purple-100 text-purple-500 rounded-full flex items-center justify-center"><MapPin className="w-4 h-4"/></div>
                    場所
                 </label>
                 <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="未定" className="flex-1 text-right font-bold text-slate-800 placeholder:text-slate-300 outline-none bg-transparent h-10"/>
              </div>
            </div>
          </div>
          
          {/* 設定グループ (URL/PW) */}
          <div className="bg-white rounded-[2rem] shadow-xl overflow-hidden mb-8">
             <div className="divide-y divide-slate-100/80 pl-6">
               {/* 4. URL ID */}
               <div className="flex items-center justify-between py-4 pr-6 group">
                  <label className="flex items-center gap-3 text-sm font-bold text-slate-600 shrink-0">
                     <div className="w-8 h-8 bg-cyan-100 text-cyan-500 rounded-full flex items-center justify-center"><LinkIcon className="w-4 h-4"/></div>
                     URL ID
                  </label>
                  <div className="flex-1 flex items-center justify-end gap-1 overflow-hidden pl-4">
                     <span className="text-slate-400 font-bold text-sm shrink-0">/e/</span>
                     <input type="text" value={slug} onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))} placeholder="おまかせ(ランダム)" className="flex-1 min-w-0 text-right font-bold text-slate-800 placeholder:text-slate-300 outline-none bg-transparent h-10 text-ellipsis"/>
                  </div>
               </div>

               {/* 5. パスワード */}
               <div className="flex items-center justify-between py-4 pr-6">
                  <label className="flex items-center gap-3 text-sm font-bold text-slate-600 shrink-0">
                     <div className="w-8 h-8 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center"><Lock className="w-4 h-4"/></div>
                     編集パスワード<span className="text-red-400">*</span>
                  </label>
                  <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="設定する" className="flex-1 text-right font-bold text-orange-500 placeholder:text-slate-300 outline-none bg-transparent h-10"/>
               </div>
             </div>
          </div>

          {error && <div className="mb-6 flex items-center justify-center gap-2 text-sm font-bold text-red-500 bg-red-50 py-3 rounded-2xl animate-pulse"><AlertCircle className="w-4 h-4"/>{error}</div>}

          {/* 送信ボタン */}
          <button 
            onClick={createEvent} 
            disabled={loading}
            className="w-full h-16 bg-[#00c2e8] text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-cyan-200/50 hover:bg-cyan-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? "作成中..." : <>チケットを発行する <ArrowRight className="w-6 h-6" /></>}
          </button>
        </div>
      )}

      {/* === 完了画面 (メリハリのあるデザイン) === */}
      {step === "done" && (
        <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-500">
          
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-sm mb-4 animate-bounce">
               <Check className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-slate-800">準備できました！🎉</h2>
          </div>

          {/* 1. 主役：参加者用シェアカード (特大・シアン) */}
          <div className="relative bg-gradient-to-br from-[#00c2e8] to-cyan-500 rounded-[2.5rem] shadow-2xl shadow-cyan-200/50 p-8 text-white overflow-hidden mb-6">
            <div className="absolute top-0 right-0 -mt-10 -mr-10 text-white/10"><Share2 className="w-40 h-40"/></div>
            
            <div className="relative z-10">
               <div className="flex items-center gap-2 mb-4 opacity-90">
                  <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-black backdrop-blur-sm">みんなに共有</span>
                  <span className="text-xs font-bold">参加者用 (閲覧のみ)</span>
               </div>
               <h3 className="text-2xl font-black mb-1 line-clamp-2">{title}</h3>
               <p className="text-sm font-bold opacity-90 mb-6 flex items-center gap-1"><Calendar className="w-4 h-4"/> {date}</p>

               {/* URLコピー */}
               <div onClick={() => copyToClipboard(publicUrl, false)} className="flex items-center justify-between bg-white/20 backdrop-blur-md p-4 rounded-2xl cursor-pointer hover:bg-white/30 transition-all mb-6 group">
                  <div className="flex-1 min-w-0 mr-4">
                     <div className="text-[10px] font-bold opacity-80 mb-1">{copiedPublic ? "コピーしました！" : "URLをコピー"}</div>
                     <div className="font-black text-sm truncate selection:bg-white/30">{publicUrl}</div>
                  </div>
                  <div className="shrink-0 w-10 h-10 bg-white/90 text-[#00c2e8] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                     {copiedPublic ? <Check className="w-5 h-5"/> : <Copy className="w-5 h-5"/>}
                  </div>
               </div>

               {/* LINEシェアボタン (特大) */}
               <button 
                 onClick={() => shareToLine(`${title}の招待状です！\n📅 ${date}\n\n▼参加はこちらから`, publicUrl)}
                 className="w-full h-14 bg-[#06c755] hover:bg-[#05b34c] text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
               >
                 LINEで送る
               </button>
            </div>
          </div>

          {/* 2. 脇役：管理者用カード (控えめ・白) */}
          <div className="bg-white border-2 border-orange-100 rounded-[2rem] p-6 shadow-sm mb-8">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-orange-500">
                   <Lock className="w-5 h-5"/>
                   <span className="text-sm font-black">管理者用 (自分専用の控え)</span>
                </div>
                <span className="text-[10px] font-bold text-orange-300 bg-orange-50 px-2 py-1 rounded-full">編集・削除が可能</span>
             </div>
             
             {/* URLコピー */}
             <div onClick={() => copyToClipboard(editUrl, true)} className="flex items-center gap-3 p-4 rounded-2xl bg-orange-50/50 cursor-pointer hover:bg-orange-100/50 transition-all">
                <div className="flex-1 min-w-0">
                   <div className="text-[10px] font-bold text-orange-400 mb-1">{copiedEdit ? "コピーしました！" : "タップしてコピー"}</div>
                   <div className="font-bold text-sm text-slate-700 truncate">{editUrl}</div>
                </div>
                <div className="shrink-0 text-orange-400">
                   {copiedEdit ? <Check className="w-5 h-5"/> : <Copy className="w-5 h-5"/>}
                </div>
             </div>
          </div>

          <button onClick={() => setStep("form")} className="block w-full text-center text-sm font-bold text-slate-400 hover:text-[#00c2e8] transition-colors">
            もうひとつ作成する
          </button>
        </div>
      )}
    </main>
  );
}