"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Sparkles, ArrowRight, Copy, Check, Link as LinkIcon, Lock, Calendar, MapPin, Type } from "lucide-react";

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

  // 作成後のURL
  const [publicUrl, setPublicUrl] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [copiedPublic, setCopiedPublic] = useState(false);
  const [copiedEdit, setCopiedEdit] = useState(false);

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

  return (
    <main className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-6 font-sans text-slate-800 selection:bg-[#00c2e8] selection:text-white">
      
      {/* === 入力画面 === */}
      {step === "form" && (
        <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* シンプルヘッダー (白背景) */}
          <div className="pt-10 pb-2 text-center px-8">
             <div className="w-16 h-16 bg-[#00c2e8]/10 text-[#00c2e8] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
               <Sparkles className="w-8 h-8" />
             </div>
             <h1 className="text-3xl font-black text-slate-800 tracking-tight">イベントを作成</h1>
             <p className="text-slate-400 text-sm font-bold mt-2">ログイン不要。必要なのはこのフォームだけ。</p>
          </div>

          <div className="p-8 space-y-6">
            
            {/* 1. タイトル (最重要) */}
            <div className="space-y-2">
               <label className="text-xs font-black text-slate-400 ml-1 flex items-center gap-1"><Type className="w-4 h-4"/> イベント名 <span className="text-red-400">*</span></label>
               <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="例：第5回 定期演奏会" 
                  className="w-full h-20 px-6 bg-slate-50 rounded-[1.5rem] text-2xl font-black placeholder:text-slate-300 outline-none border-2 border-transparent focus:border-[#00c2e8] focus:bg-white transition-all shadow-sm"
                />
            </div>

            {/* 2. 日付 (1行フル) */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 ml-1 flex items-center gap-1"><Calendar className="w-4 h-4"/> 開催日 <span className="text-red-400">*</span></label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="w-full h-16 px-4 bg-slate-50 rounded-2xl font-black text-lg outline-none border-2 border-transparent focus:border-[#00c2e8] focus:bg-white transition-all shadow-sm"
              />
            </div>

            {/* 3. 場所 (1行フル) */}
            <div className="space-y-2">
               <label className="text-xs font-black text-slate-400 ml-1 flex items-center gap-1"><MapPin className="w-4 h-4"/> 場所 (任意)</label>
               <input 
                type="text" 
                value={venue} 
                onChange={(e) => setVenue(e.target.value)} 
                placeholder="ホール名など"
                className="w-full h-16 px-6 bg-slate-50 rounded-2xl font-bold text-lg outline-none border-2 border-transparent focus:border-[#00c2e8] focus:bg-white transition-all shadow-sm"
              />
            </div>

            {/* 4. URL ID */}
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100 mt-2">
               <label className="text-xs font-black text-slate-500 flex items-center gap-1 mb-1"><LinkIcon className="w-4 h-4"/> URL ID (任意)</label>
               <div className="flex items-center">
                  <span className="text-slate-400 font-black text-lg shrink-0 mr-1">takt.com/e/</span>
                  <input 
                    type="text" 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))} 
                    placeholder="concert-2026" 
                    className="flex-1 bg-transparent font-black text-xl outline-none text-slate-800 placeholder:text-slate-300"
                  />
               </div>
               <p className="text-[10px] text-slate-400 font-bold">※ 半角英数字のみ。空欄でランダム生成。</p>
            </div>

            {/* 5. パスワード (重要) */}
            <div className="space-y-2 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                <label className="text-xs font-black text-orange-500 flex items-center gap-1 mb-1"><Lock className="w-4 h-4"/> 編集パスワード <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="後で編集するのに必要です" 
                  className="w-full h-14 px-4 bg-white text-orange-600 placeholder:text-orange-200 rounded-xl font-black text-lg outline-none border-2 border-orange-100 focus:border-orange-400 transition-all text-center shadow-sm"
                />
                 <p className="text-[10px] text-orange-300 font-bold text-center">※ 忘れないようにメモしてください！</p>
            </div>

            {error && <p className="text-center text-xs font-bold text-red-500 animate-pulse bg-red-50 py-2 rounded-lg">{error}</p>}

            {/* 送信ボタン */}
            <button 
              onClick={createEvent} 
              disabled={loading}
              className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-black hover:shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "作成中..." : <>イベントを作成する <ArrowRight className="w-6 h-6" /></>}
            </button>
          </div>
        </div>
      )}

      {/* === 完了画面 (維持) === */}
      {step === "done" && (
        <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-8 space-y-8 animate-in zoom-in duration-300 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-sm rotate-12">
            <Check className="w-12 h-12" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-800">作成しました！🎉</h2>
            <p className="text-sm font-bold text-slate-400 leading-relaxed">以下のリンクを必ず保存してください。<br/>この画面を閉じると二度と表示されません。</p>
          </div>

          <div className="space-y-6 text-left bg-slate-50 p-6 rounded-3xl">
            {/* 編集用URL */}
            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <span className="text-xs font-black text-orange-500 flex items-center gap-1"><Lock className="w-4 h-4"/> 管理者用 (編集・削除)</span>
                <span className="text-[10px] font-bold text-slate-300 bg-white px-2 py-1 rounded-full">自分だけ</span>
              </div>
              <div 
                onClick={() => copyToClipboard(editUrl, true)}
                className="group relative flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-orange-100 cursor-pointer hover:border-orange-400 transition-all shadow-sm"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${copiedEdit ? "bg-orange-500 text-white" : "bg-orange-50 text-orange-400"}`}>
                  {copiedEdit ? <Check className="w-6 h-6"/> : <Copy className="w-6 h-6"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-orange-300 mb-0.5">{copiedEdit ? "コピーしました！" : "タップしてコピー"}</div>
                  <div className="text-sm font-black text-slate-700 truncate">{editUrl}</div>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200 my-4"></div>

            {/* 公開用URL */}
            <div className="space-y-3">
              <div className="flex items-center justify-between ml-1">
                <span className="text-xs font-black text-[#00c2e8] flex items-center gap-1"><LinkIcon className="w-4 h-4"/> 参加者用 (閲覧のみ)</span>
                <span className="text-[10px] font-bold text-slate-300 bg-white px-2 py-1 rounded-full">みんなに共有</span>
              </div>
              <div 
                onClick={() => copyToClipboard(publicUrl, false)}
                className="group relative flex items-center gap-3 p-4 rounded-2xl bg-white border-2 border-cyan-100 cursor-pointer hover:border-[#00c2e8] transition-all shadow-sm"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${copiedPublic ? "bg-[#00c2e8] text-white" : "bg-cyan-50 text-[#00c2e8]"}`}>
                  {copiedPublic ? <Check className="w-6 h-6"/> : <Copy className="w-6 h-6"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-cyan-400 mb-0.5">{copiedPublic ? "コピーしました！" : "タップしてコピー"}</div>
                  <div className="text-sm font-black text-slate-700 truncate">{publicUrl}</div>
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => setStep("form")} className="text-sm font-bold text-slate-400 hover:text-slate-600 underline decoration-slate-200 transition-colors">
            もうひとつ作成する
          </button>
        </div>
      )}
    </main>
  );
}