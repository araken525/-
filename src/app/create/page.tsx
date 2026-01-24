"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Lock, Calendar, Type, Link as LinkIcon, MapPin } from "lucide-react";
import Link from "next/link";

export default function CreatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // フォームの内容
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // バリデーション
    if (!slug.match(/^[a-zA-Z0-9-_]+$/)) {
      setError("イベントIDは半角英数字とハイフンのみ使えます");
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabase.from("events").insert({
        slug: slug,
        title: title,
        date: date,
        venue_name: venue,
        edit_password: password, // ★ここでパスワードを設定
      });

      if (insertError) {
        // ID被りのエラーコード(23505)など
        if (insertError.code === "23505") {
          throw new Error("そのイベントIDは既に使われています");
        }
        throw insertError;
      }

      // 作成成功したら、編集パスワードをブラウザに保存して編集画面へ飛ばす
      sessionStorage.setItem(`edit-ok:${slug}`, "true");
      router.push(`/e/${slug}/edit`);

    } catch (err: any) {
      setError(err.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center gap-3">
          <Link href="/" className="text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-white font-bold text-lg">新しいイベントを作成</h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* ID Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1">
              <LinkIcon className="w-3 h-3" />
              イベントID (URLになります)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-slate-400 font-bold text-sm">/e/</span>
              <input
                required
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="my-concert-2026"
                className="w-full h-12 pl-10 pr-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all placeholder:font-normal placeholder:text-slate-300"
              />
            </div>
            <p className="text-[10px] text-slate-400 ml-1">※ 半角英数字とハイフンのみ</p>
          </div>

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1">
              <Type className="w-3 h-3" />
              イベント名
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="第5回 定期演奏会"
              className="w-full h-12 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          {/* Date & Venue */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                日付
              </label>
              <input
                required
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-12 px-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 text-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                場所
              </label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="市民ホール"
                className="w-full h-12 px-3 bg-slate-50 border-2 border-slate-100 rounded-xl font-bold text-slate-900 text-sm focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5 pt-2">
            <label className="text-xs font-bold text-slate-500 ml-1 flex items-center gap-1 text-red-500">
              <Lock className="w-3 h-3" />
              編集用パスワード (忘れないで！)
            </label>
            <input
              required
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="secret123"
              className="w-full h-12 px-4 bg-red-50 border-2 border-red-100 rounded-xl font-bold text-slate-900 focus:ring-4 focus:ring-red-100 focus:border-red-400 outline-none transition-all"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-500 text-xs font-bold p-3 rounded-lg flex items-center gap-2">
              <span className="block w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-5 h-5" />
                イベントを作成する
              </>
            )}
          </button>

        </form>
      </div>
    </main>
  );
}