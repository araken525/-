"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, Smartphone, Zap, Plus, Search, ChevronDown, Music, Clapperboard, Briefcase, Heart } from "lucide-react";

export default function Home() {
  const [showSearch, setShowSearch] = useState(false);

  // 既存のイベントにジャンプする処理
  async function jumpToEvent(formData: FormData) {
    const slug = formData.get("slug") as string;
    if (slug) window.location.href = `/e/${slug}`;
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb] font-sans text-slate-800 selection:bg-[#00c2e8] selection:text-white pb-20 pt-16">
      
      {/* === 1. ヘッダー (固定バーを追加) === */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2 font-black text-2xl text-slate-800 tracking-tighter">
          <div className="w-8 h-8 bg-[#00c2e8] rounded-xl flex items-center justify-center text-white text-base shadow-sm">🎵</div>
          TaiSuke
        </div>
        <Link 
          href="/create"
          className="h-9 px-4 bg-[#00c2e8] text-white rounded-full font-black text-xs shadow-sm hover:bg-cyan-500 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> 作成する
        </Link>
      </header>

      {/* === ヒーローセクション (キャッチコピー変更) === */}
      <section className="pt-24 px-6 flex flex-col items-center text-center max-w-2xl mx-auto">
        <span className="px-3 py-1 bg-cyan-50 text-[#00c2e8] text-xs font-black rounded-full mb-6">無料・ログイン不要</span>
        
        {/* ★変更: キャッチコピー */}
        <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight text-slate-900 mb-6">
          当日のタイスケ、<br />みんなのスマホへ。
        </h1>
        
        <p className="text-sm sm:text-base font-bold text-slate-500 mb-10 leading-relaxed max-w-md">
          TaiSuke（タイスケ）は、PDFより見やすく、Excelより手軽な、イベント進行表の共有ツールです。
        </p>

        {/* メインCTA（タイスケ作成） */}
        <Link 
          href="/create"
          className="w-full sm:w-auto min-w-[300px] h-16 bg-[#00c2e8] text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-cyan-200/50 hover:bg-cyan-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-6"
        >
          <Plus className="w-6 h-6" /> タイスケを作成する
        </Link>

        {/* サブアクション（ID検索） */}
        <div className="w-full max-w-sm mx-auto">
          {!showSearch ? (
            <button 
              onClick={() => setShowSearch(true)}
              className="w-full py-4 text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-2 transition-colors"
            >
              <Search className="w-4 h-4" /> 招待されたタイスケを見る <ChevronDown className="w-3.5 h-3.5"/>
            </button>
          ) : (
            <div className="bg-white p-2 rounded-[1.5rem] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
              <form action={jumpToEvent} className="flex gap-2">
                <input
                  name="slug"
                  type="text"
                  placeholder="URL IDを入力 (例: concert2026)"
                  className="flex-1 h-12 px-4 bg-slate-50 rounded-xl font-bold text-slate-800 placeholder:text-slate-300 outline-none min-w-0 text-sm"
                  required
                />
                <button type="submit" className="h-12 px-6 bg-slate-800 text-white font-black rounded-xl hover:bg-slate-700 active:scale-95 transition-all flex items-center justify-center text-sm">
                  開く
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* === 3つの特徴 === */}
      <section className="mt-20 px-6 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] shadow-sm">
          <div className="w-12 h-12 bg-cyan-50 text-[#00c2e8] rounded-2xl flex items-center justify-center mb-4">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2">アプリ・ログイン不要</h3>
          <p className="text-xs font-bold text-slate-500 leading-relaxed">
            参加者はURLをクリックするだけ。面倒な会員登録やアプリのインストールは一切必要ありません。
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm">
          <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-2xl flex items-center justify-center mb-4">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2">スマホで一番見やすい</h3>
          <p className="text-xs font-bold text-slate-500 leading-relaxed">
            PDFを拡大縮小するストレスから解放。自分の出番や今の進行状況が一目でわかるデザインです。
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-sm">
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-800 mb-2">急な変更も1秒で共有</h3>
          <p className="text-xs font-bold text-slate-500 leading-relaxed">
            「時間が押した」「曲順が変わった」。当日の急なスケジュール変更も手元のスマホから即座に全員へ反映。
          </p>
        </div>
      </section>

      {/* === 利用シーン === */}
      <section className="mt-20 px-6 text-center">
        <p className="text-xs font-black text-slate-400 mb-6 tracking-widest">こんなイベントで使われています</p>
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white rounded-full shadow-sm text-sm font-bold text-slate-700"><Music className="w-4 h-4 text-pink-500"/> 定期演奏会・発表会</div>
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white rounded-full shadow-sm text-sm font-bold text-slate-700"><Music className="w-4 h-4 text-orange-500"/> ライブ・フェス</div>
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white rounded-full shadow-sm text-sm font-bold text-slate-700"><Heart className="w-4 h-4 text-red-500"/> 結婚式・二次会</div>
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white rounded-full shadow-sm text-sm font-bold text-slate-700"><Clapperboard className="w-4 h-4 text-blue-500"/> 映像・スチール撮影</div>
          <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white rounded-full shadow-sm text-sm font-bold text-slate-700"><Briefcase className="w-4 h-4 text-slate-500"/> 社内イベント・研修</div>
        </div>
      </section>

      {/* === ボトムCTA === */}
      <section className="mt-24 px-6 text-center max-w-lg mx-auto">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50">
          <h2 className="text-2xl font-black text-slate-800 mb-2">さあ、準備を始めましょう。</h2>
          <p className="text-xs font-bold text-slate-400 mb-8">URLを発行するのにかかる時間は、わずか10秒です。</p>
          <Link 
            href="/create"
            className="w-full h-16 bg-[#00c2e8] text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-cyan-200/50 hover:bg-cyan-500 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <Plus className="w-6 h-6" /> タイスケを作成する
          </Link>
        </div>
      </section>

    </main>
  );
}