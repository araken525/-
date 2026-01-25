"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ArrowRight, Copy, Check, Link as LinkIcon, Lock, Calendar, MapPin, Type, ChevronDown } from "lucide-react";

export default function CreateEventPage() {
  const [step, setStep] = useState<"form" | "done">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false); // 詳細設定の開閉

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
      setError("タイトル、日付、パスワードを入力してください");
      return;
    }
    const finalSlug = slug.trim() || Math.random().toString(36).substring(2, 8);
    
    setLoading(true);
    setError("");

    // 1. 重複チェック
    const { data: existing } = await supabase.from("events").select("id").eq("slug", finalSlug).maybeSingle();
    if (existing) {
      setLoading(false);
      setError("そのIDは既に使われています");
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
      setError("エラー: " + insertError.message);
      return;
    }

    // 3. 完了
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
    <main className="min-h-screen bg-white font-sans text-slate-800 selection:bg-[#00c2e8] selection:text-white">
      
      {/* === 入力画面 === */}
      {step === "form" && (
        <div className="max-w-2xl mx-auto px-6 py-12 md:py-20 animate-in fade-in duration-700">
          
          <div className="space-y-10">
            
            {/* 1. タイトル (超巨大) */}
            <div className="space-y-2">
               <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Event Name</label>
               <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="イベント名を入力..." 
                  className="w-full bg-transparent text-4xl md:text-5xl font-black placeholder:text-slate-200 outline-none border-none p-0 focus:ring-0 leading-tight"
                  autoFocus
                />
            </div>

            <div className="space-y-6">
                {/* 2. 日付 */}
                <div className="flex items-center gap-4 py-2 border-b border-slate-100 focus-within:border-[#00c2e8] transition-colors">
                  <Calendar className="w-5 h-5 text-slate-400 shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <input 
                        type="date" 
                        value={date} 
                        onChange={(e) => setDate(e.target.value)} 
                        className="w-full bg-transparent font-bold text-xl outline-none border-none p-0 focus:ring-0 text-slate-700"
                    />
                  </div>
                </div>

                {/* 3. 場所 */}
                <div className="flex items-center gap-4 py-2 border-b border-slate-100 focus-within:border-[#00c2e8] transition-colors">
                   <MapPin className="w-5 h-5 text-slate-400 shrink-0"/>
                   <input 
                    type="text" 
                    value={venue} 
                    onChange={(e) => setVenue(e.target.value)} 
                    placeholder="場所を追加 (任意)"
                    className="w-full bg-transparent font-bold text-xl outline-none border-none p-0 focus:ring-0 placeholder:text-slate-300 text-slate-700"
                  />
                </div>
            </div>

            {/* 詳細設定トグル */}
            <div className="pt-4">
               <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs font-bold text-slate-400 flex items-center gap-2 hover:text-slate-600 transition-colors">
                  {showAdvanced ? "詳細設定を隠す" : "IDとパスワードを設定"} <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? "rotate-180" : ""}`}/>
               </button>

               <div className={`space-y-6 overflow-hidden transition-all duration-300 ease-in-out ${showAdvanced ? "max-h-96 pt-6 opacity-100" : "max-h-0 opacity-0"}`}>
                  {/* URL ID */}
                  <div className="space-y-1">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">URL ID</label>
                     <div className="flex items-center bg-slate-50 rounded-xl px-4 h-14">
                        <span className="text-slate-400 font-bold text-sm shrink-0 mr-1">takt.com/e/</span>
                        <input 
                          type="text" 
                          value={slug} 
                          onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ""))} 
                          placeholder="random" 
                          className="flex-1 bg-transparent font-black text-lg outline-none text-slate-800 placeholder:text-slate-300"
                        />
                     </div>
                  </div>

                  {/* パスワード */}
                  <div className="space-y-1">
                      <label className="text-[10px] font-bold text-orange-400 uppercase tracking-wider ml-1">Password</label>
                      <div className="flex items-center bg-orange-50 rounded-xl px-4 h-14">
                        <Lock className="w-4 h-4 text-orange-400 mr-3"/>
                        <input 
                          type="text" 
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)} 
                          placeholder="編集用パスワード" 
                          className="w-full bg-transparent text-orange-600 placeholder:text-orange-300 font-black text-lg outline-none"
                        />
                      </div>
                  </div>
               </div>
            </div>

            {error && <p className="text-sm font-bold text-red-500">{error}</p>}

            {/* Submit Button (Fixed Bottom on Mobile, Inline on Desktop) */}
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent md:static md:bg-none md:p-0">
                <button 
                  onClick={createEvent} 
                  disabled={loading}
                  className="w-full h-16 bg-slate-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? "作成中..." : <>イベントを作成 <ArrowRight className="w-5 h-5" /></>}
                </button>
            </div>
            
            {/* Spacer for mobile scroll */}
            <div className="h-24 md:h-0"></div>

          </div>
        </div>
      )}

      {/* === 完了画面 (シンプル版) === */}
      {step === "done" && (
        <div className="min-h-screen flex items-center justify-center p-6 animate-in zoom-in duration-300">
          <div className="w-full max-w-lg space-y-10 text-center">
            
            <div className="space-y-4">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white shadow-xl shadow-green-200">
                <Check className="w-10 h-10" />
              </div>
              <h2 className="text-4xl font-black text-slate-800">Done!</h2>
              <p className="text-sm font-bold text-slate-400">イベントページが完成しました。</p>
            </div>

            <div className="space-y-6 text-left">
              {/* 編集用URL */}
              <div 
                onClick={() => copyToClipboard(editUrl, true)}
                className="group p-6 rounded-3xl bg-orange-50 border-2 border-orange-100 cursor-pointer hover:border-orange-400 transition-all"
              >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-orange-500 flex items-center gap-1"><Lock className="w-3 h-3"/> 自分用 (編集)</span>
                    <span className="text-[10px] font-bold text-orange-300">{copiedEdit ? "コピー済" : "タップしてコピー"}</span>
                  </div>
                  <div className="text-lg font-black text-slate-800 truncate">{editUrl}</div>
              </div>

              {/* 公開用URL */}
              <div 
                onClick={() => copyToClipboard(publicUrl, false)}
                className="group p-6 rounded-3xl bg-cyan-50 border-2 border-cyan-100 cursor-pointer hover:border-[#00c2e8] transition-all"
              >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black text-[#00c2e8] flex items-center gap-1"><LinkIcon className="w-3 h-3"/> みんな用 (閲覧)</span>
                    <span className="text-[10px] font-bold text-cyan-300">{copiedPublic ? "コピー済" : "タップしてコピー"}</span>
                  </div>
                  <div className="text-lg font-black text-slate-800 truncate">{publicUrl}</div>
              </div>
            </div>

            <button onClick={() => setStep("form")} className="text-sm font-bold text-slate-300 hover:text-slate-500 transition-colors">
              新しいイベントを作る
            </button>
          </div>
        </div>
      )}
    </main>
  );
}