"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Smartphone, Zap, Plus, Search, ChevronDown, Music, Clapperboard, Briefcase, Heart, Clock, ArrowRight } from "lucide-react";

export default function Home() {
  const [showSearch, setShowSearch] = useState(false);

  async function jumpToEvent(formData: FormData) {
    const slug = formData.get("slug") as string;
    if (slug) window.location.href = `/e/${slug}`;
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 selection:bg-[#00c2e8] selection:text-white pb-20 pt-16 relative overflow-hidden">
      
      {/* === カスタムアニメーションCSS === */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-delayed {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(15px) rotate(-1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite; }
      `}</style>

      {/* === 背景の動く光（オーブ） === */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#00c2e8] rounded-full blur-[120px] opacity-20 animate-pulse pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] bg-purple-500 rounded-full blur-[100px] opacity-10 animate-pulse pointer-events-none z-0" style={{ animationDelay: "2s" }}></div>

      {/* === ヘッダー (グラスモーフィズム) === */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white/60 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2 font-black text-2xl text-slate-800 tracking-tighter">
          <div className="w-8 h-8 bg-gradient-to-br from-[#00c2e8] to-cyan-500 rounded-xl flex items-center justify-center text-white text-base shadow-lg shadow-cyan-200/50">🎵</div>
          TaiSuke
        </div>
        <Link 
          href="/create"
          className="h-9 px-5 bg-slate-900 text-white rounded-full font-black text-xs shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> 作成する
        </Link>
      </header>

      {/* === ヒーローセクション === */}
      <section className="pt-20 px-6 max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12">
        
        {/* 左側: コピー & アクション */}
        <div className="flex-1 text-center md:text-left pt-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-white mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-xs font-black text-slate-600">無料・ログイン不要</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl font-black leading-[1.15] tracking-tight text-slate-900 mb-6 drop-shadow-sm">
            当日のタイスケ、<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c2e8] to-purple-600">みんなのスマホへ。</span>
          </h1>
          
          <p className="text-base sm:text-lg font-bold text-slate-500 mb-10 leading-relaxed max-w-md mx-auto md:mx-0">
            TaiSuke（タイスケ）は、PDFより見やすく、Excelより手軽な、新世代のイベント進行表ツールです。
          </p>

          <Link 
            href="/create"
            className="w-full sm:w-auto min-w-[300px] h-16 bg-[#00c2e8] text-white rounded-[1.5rem] font-black text-lg shadow-2xl shadow-cyan-200/50 hover:bg-cyan-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-6 mx-auto md:mx-0"
          >
            <Plus className="w-6 h-6" /> タイスケを作成する
          </Link>

          {!showSearch ? (
            <button onClick={() => setShowSearch(true)} className="w-full sm:w-auto py-3 text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center md:justify-start gap-2 transition-colors mx-auto md:mx-0">
              <Search className="w-4 h-4" /> 招待されたタイスケを見る <ChevronDown className="w-3.5 h-3.5"/>
            </button>
          ) : (
            <div className="bg-white/80 backdrop-blur-md p-2 rounded-[1.5rem] shadow-lg border border-white max-w-sm mx-auto md:mx-0 animate-in fade-in slide-in-from-top-2 duration-300">
              <form action={jumpToEvent} className="flex gap-2">
                <input name="slug" type="text" placeholder="URL IDを入力 (例: concert2026)" className="flex-1 h-12 px-4 bg-slate-100/50 rounded-xl font-bold text-slate-800 placeholder:text-slate-400 outline-none min-w-0 text-sm" required />
                <button type="submit" className="h-12 px-6 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center">開く</button>
              </form>
            </div>
          )}
        </div>

        {/* 右側: 浮遊するUIモックアップ */}
        <div className="flex-1 relative w-full max-w-md aspect-square md:aspect-auto h-[400px] hidden sm:block">
          {/* カード1 (手前・メイン) */}
          <div className="absolute top-10 right-10 w-80 bg-white/90 backdrop-blur-xl p-5 rounded-[2rem] shadow-2xl border border-white/50 animate-float z-20 rotate-[-2deg]">
             <div className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-cyan-50 text-[#00c2e8] rounded-[1.2rem] flex items-center justify-center text-3xl shadow-inner">🎻</div>
                <div>
                   <h3 className="text-lg font-black text-slate-800 leading-tight">ゲネプロ (全体)</h3>
                   <span className="text-xs font-bold text-[#00c2e8] flex items-center gap-1 mt-1"><Clock className="w-3 h-3"/> 15:00 ~ 16:30</span>
                </div>
             </div>
             <div className="mt-4 px-3 py-2 bg-slate-50 rounded-xl text-xs font-bold text-slate-500 flex justify-between items-center">
                <span>📍 メインホール</span>
                <span className="bg-cyan-100 text-[#00c2e8] px-2 py-0.5 rounded-md">全員</span>
             </div>
          </div>

          {/* カード2 (奥・サブ) */}
          <div className="absolute top-40 left-0 w-72 bg-white/80 backdrop-blur-lg p-5 rounded-[2rem] shadow-xl border border-white/30 animate-float-delayed z-10 rotate-[3deg] scale-90">
             <div className="flex gap-4 items-center">
                <div className="w-12 h-12 bg-purple-50 text-purple-500 rounded-[1.2rem] flex items-center justify-center text-2xl">🍱</div>
                <div>
                   <h3 className="text-base font-black text-slate-800 leading-tight">お昼休憩</h3>
                   <span className="text-[10px] font-bold text-purple-500 mt-1">12:30 ~ 13:30</span>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* === 3つの特徴 (グラスモーフィズムカード) === */}
      <section className="mt-24 px-6 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
        {[
          { icon: Zap, color: "from-amber-400 to-orange-500", title: "アプリ・ログイン不要", desc: "URLをクリックするだけ。面倒な会員登録やインストールは一切必要ありません。" },
          { icon: Smartphone, color: "from-purple-500 to-indigo-600", title: "スマホで一番見やすい", desc: "PDFを拡大するストレスから解放。自分の出番や進行状況が一目でわかるデザイン。" },
          { icon: Calendar, color: "from-[#00c2e8] to-cyan-500", title: "急な変更も1秒で共有", desc: "当日の急なスケジュール変更も、手元のスマホから即座に全員へ反映。" },
        ].map((item, i) => (
          <div key={i} className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white/50 hover:-translate-y-1 transition-transform duration-300">
            <div className={`w-14 h-14 bg-gradient-to-br ${item.color} text-white rounded-[1.2rem] flex items-center justify-center mb-6 shadow-lg`}>
              <item.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-3">{item.title}</h3>
            <p className="text-sm font-bold text-slate-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* === 利用シーン === */}
      <section className="mt-24 px-6 text-center relative z-10">
        <p className="text-xs font-black text-slate-400 mb-8 tracking-widest uppercase">こんなイベントで使われています</p>
        <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
          {[
            { icon: Music, label: "定期演奏会・発表会", color: "text-pink-500" },
            { icon: Music, label: "ライブ・フェス", color: "text-orange-500" },
            { icon: Heart, label: "結婚式・二次会", color: "text-red-500" },
            { icon: Clapperboard, label: "映像・スチール撮影", color: "text-blue-500" },
            { icon: Briefcase, label: "社内イベント・研修", color: "text-slate-500" },
          ].map((tag, i) => (
            <div key={i} className="flex items-center gap-2 px-5 py-3 bg-white/80 backdrop-blur-sm border border-white/50 rounded-full shadow-sm text-sm font-black text-slate-700 hover:bg-white transition-colors cursor-default">
              <tag.icon className={`w-4 h-4 ${tag.color}`}/> {tag.label}
            </div>
          ))}
        </div>
      </section>

      {/* === ボトムCTA === */}
      <section className="mt-28 px-6 text-center max-w-lg mx-auto relative z-10">
        <div className="bg-gradient-to-br from-[#00c2e8] to-cyan-500 p-10 rounded-[2.5rem] shadow-2xl shadow-cyan-200/50 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 text-white/10"><Calendar className="w-40 h-40"/></div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-3 leading-tight">さあ、準備を<br/>始めましょう。</h2>
            <p className="text-sm font-bold opacity-90 mb-8">URLを発行するのにかかる時間は、わずか10秒です。</p>
            <Link 
              href="/create"
              className="w-full h-16 bg-white text-[#00c2e8] rounded-[1.5rem] font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              <Plus className="w-6 h-6" /> タイスケを作成する
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}