"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Sparkles, ArrowRight, Copy, Check, Link as LinkIcon, Lock } from "lucide-react";

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
      setError("タイトル、日付、パスワードは必須です 🙇‍♂️");
      return;
    }
    // スラッグが空ならランダム生成
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

    // 3. 完了画面へ (URL生成)
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
    <main className="min-h-screen bg-[#f7f9fb] flex items-center justify-center p-6 font-sans text-slate-800">
      
      {/* === 入力画面 === */}
      {step === "form" && (
        <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-[#00c2e8] p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">新しいイベントを作成</h1>
            <p className="text-cyan-100 text-sm font-bold mt-2">ログイン不要。30秒で作れます。</p>
          </div>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">イベント名 <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="例：第5回 定期演奏会" 
                  className="w-full h-12 px-4 bg-slate-50 rounded-xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-cyan-50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 ml-1">開催日 <span className="text-red-400">*</span></label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)} 
                    className="w-full h-12 px-4 bg-slate-50 rounded-xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-cyan-50 transition-all"
                  />
                </div>
                <div className="space-y-1">
                   <label className="text-xs font-bold text-slate-400 ml-1">場所 (任意)</label>
                   <input 
                    type="text" 
                    value={venue} 
                    onChange={(e) => setVenue(e.target.value)} 
                    placeholder="ホール名など"
                    className="w-full h-12 px-4 bg-slate-50 rounded-xl font-bold outline-none focus:bg-white focus:ring-4 focus:ring-cyan-50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 ml-1">URL ID (任意)</label>
                <div className="flex items-center bg-slate-50 rounded-xl px-4 h-12 focus-within:ring-4 focus-within:ring-cyan-50 focus-within:bg-white transition-all">
                  <span className="text-slate-400 font-bold text-sm shrink-0">takt.com/e/</span>
                  <input 
                    type="text" 
                    value={slug} 
                    onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))} 
                    placeholder="concert-2026" 
                    className="flex-1 bg-transparent font-bold outline-none text-slate-800 ml-1"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold ml-1">※ 空欄だとランダムになります</p>
              </div>

              <div className="space-y-1 pt-2">
                <label className="text-xs font-bold text-slate-400 ml-1 flex items-center gap-1"><Lock className="w-3 h-3"/> 編集パスワード <span className="text-red-400">*</span></label>
                <input 
                  type="text" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="後で編集するのに必要です" 
                  className="w-full h-12 px-4 bg-orange-50 text-orange-800 placeholder:text-orange-300 rounded-xl font-black outline-none focus:ring-4 focus:ring-orange-100 transition-all"
                />
              </div>
            </div>

            {error && <p className="text-center text-xs font-bold text-red-500 animate-pulse">{error}</p>}

            <button 
              onClick={createEvent} 
              disabled={loading}
              className="w-full h-14 bg-slate-800 text-white rounded-xl font-black shadow-lg hover:bg-black active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "作成中..." : <>イベントを作成 <ArrowRight className="w-5 h-5" /></>}
            </button>
          </div>
        </div>
      )}

      {/* === 完了画面 === */}
      {step === "done" && (
        <div className="w-full max-w-lg bg-white rounded-[2rem] shadow-2xl p-8 space-y-8 animate-in zoom-in duration-300 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-500 shadow-sm">
            <Check className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800">作成しました！🎉</h2>
            <p className="text-sm font-bold text-slate-400">以下のリンクを保存してください。<br/>この画面を閉じると二度と表示されません。</p>
          </div>

          <div className="space-y-6 text-left">
            {/* 編集用URL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <span className="text-xs font-black text-orange-500 flex items-center gap-1"><Lock className="w-3 h-3"/> 管理者用 (編集・削除)</span>
                <span className="text-[10px] font-bold text-slate-300">自分だけ</span>
              </div>
              <div 
                onClick={() => copyToClipboard(editUrl, true)}
                className="group relative flex items-center gap-3 p-4 rounded-2xl bg-orange-50 border-2 border-orange-100 cursor-pointer hover:bg-white hover:border-orange-400 transition-all"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${copiedEdit ? "bg-orange-500 text-white" : "bg-white text-orange-400 shadow-sm"}`}>
                  {copiedEdit ? <Check className="w-5 h-5"/> : <Copy className="w-5 h-5"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-orange-300 mb-0.5">{copiedEdit ? "コピーしました！" : "タップしてコピー"}</div>
                  <div className="text-sm font-black text-slate-700 truncate">{editUrl}</div>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-100"></div>

            {/* 公開用URL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <span className="text-xs font-black text-[#00c2e8] flex items-center gap-1"><LinkIcon className="w-3 h-3"/> 参加者用 (閲覧のみ)</span>
                <span className="text-[10px] font-bold text-slate-300">みんなに共有</span>
              </div>
              <div 
                onClick={() => copyToClipboard(publicUrl, false)}
                className="group relative flex items-center gap-3 p-4 rounded-2xl bg-cyan-50 border-2 border-cyan-100 cursor-pointer hover:bg-white hover:border-[#00c2e8] transition-all"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${copiedPublic ? "bg-[#00c2e8] text-white" : "bg-white text-[#00c2e8] shadow-sm"}`}>
                  {copiedPublic ? <Check className="w-5 h-5"/> : <Copy className="w-5 h-5"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-cyan-400 mb-0.5">{copiedPublic ? "コピーしました！" : "タップしてコピー"}</div>
                  <div className="text-sm font-black text-slate-700 truncate">{publicUrl}</div>
                </div>
              </div>
            </div>
          </div>

          <button onClick={() => setStep("form")} className="text-sm font-bold text-slate-400 hover:text-slate-600 underline decoration-slate-200">
            もうひとつ作成する
          </button>
        </div>
      )}
    </main>
  );
}