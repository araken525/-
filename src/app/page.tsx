"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Smartphone, Zap, Plus, Search, ChevronDown, Music, Clapperboard, Briefcase, Heart, MapPin, Clock } from "lucide-react";

export default function Home() {
  const [showSearch, setShowSearch] = useState(false);

  async function jumpToEvent(formData: FormData) {
    const slug = formData.get("slug") as string;
    if (slug) window.location.href = `/e/${slug}`;
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 selection:bg-[#00c2e8] selection:text-white pb-16 pt-16 relative overflow-hidden">
      
      {/* === カスタムアニメーションCSS === */}
      <style jsx global>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes float-delayed {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(10px) rotate(-1deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 7s ease-in-out infinite; }
      `}</style>

      {/* === 背景の動く光 === */}
      <div className="absolute top-[-5%] left-[-20%] w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-[#00c2e8] rounded-full blur-[100px] opacity-20 animate-pulse pointer-events-none z-0"></div>
      <div className="absolute top-[30%] right-[-10%] w-[250px] h-[250px] md:w-[400px] md:h-[400px] bg-purple-500 rounded-full blur-[80px] opacity-10 animate-pulse pointer-events-none z-0" style={{ animationDelay: "2s" }}></div>

      {/* === ヘッダー === */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white/60 backdrop-blur-xl border-b border-white/50 flex items-center justify-between px-4 sm:px-6 z-50">
        <div className="font-black text-xl sm:text-2xl text-slate-800 tracking-tighter">
          TaiSuke
        </div>
        <Link 
          href="/create"
          className="h-8 sm:h-9 px-4 sm:px-5 bg-slate-900 text-white rounded-full font-black text-xs shadow-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> 作成する
        </Link>
      </header>

      {/* === ヒーローセクション === */}
      <section className="pt-10 sm:pt-20 px-4 sm:px-6 max-w-6xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
        
        {/* 左側: コピー & アクション */}
        <div className="flex-1 text-center md:text-left pt-6 md:pt-12 w-full">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 bg-white/80 backdrop-blur-md rounded-full shadow-sm border border-white mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] sm:text-xs font-black text-slate-600">無料・ログイン不要</span>
          </div>
          
          {/* ★スマホ向けに文字サイズを調整 */}
          <h1 className="text-4xl sm:text-6xl font-black leading-[1.15] tracking-tight text-slate-900 mb-4 sm:mb-6 drop-shadow-sm">
            当日のタイスケ、<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c2e8] to-purple-600">みんなのスマホへ。</span>
          </h1>
          
          <p className="text-sm sm:text-lg font-bold text-slate-500 mb-8 sm:mb-10 leading-relaxed max-w-md mx-auto md:mx-0">
            TaiSuke（タイスケ）は、PDFより見やすく、Excelより手軽な、新世代のイベント進行表ツールです。
          </p>

          <Link 
            href="/create"
            className="w-full sm:w-auto min-w-[300px] h-14 sm:h-16 bg-[#00c2e8] text-white rounded-[1.2rem] sm:rounded-[1.5rem] font-black text-base sm:text-lg shadow-2xl shadow-cyan-200/50 hover:bg-cyan-500 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-6 mx-auto md:mx-0"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6" /> タイスケを作成する
          </Link>

          {!showSearch ? (
            <button onClick={() => setShowSearch(true)} className="w-full sm:w-auto py-2 sm:py-3 text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center md:justify-start gap-2 transition-colors mx-auto md:mx-0">
              <Search className="w-4 h-4" /> 招待されたタイスケを見る <ChevronDown className="w-3.5 h-3.5"/>
            </button>
          ) : (
            <div className="bg-white/80 backdrop-blur-md p-2 rounded-[1.2rem] sm:rounded-[1.5rem] shadow-lg border border-white max-w-sm mx-auto md:mx-0 animate-in fade-in slide-in-from-top-2 duration-300">
              <form action={jumpToEvent} className="flex gap-2">
                <input name="slug" type="text" placeholder="URL IDを入力 (例: concert2026)" className="flex-1 h-12 px-4 bg-slate-100/50 rounded-xl font-bold text-slate-800 placeholder:text-slate-400 outline-none min-w-0 text-xs sm:text-sm" required />
                <button type="submit" className="h-12 px-5 sm:px-6 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center text-sm">開く</button>
              </form>
            </div>
          )}
        </div>

        {/* 右側: 浮遊するリアルなUIモックアップ (★スマホでも表示するように変更) */}
        <div className="flex-1 relative w-full h-[320px] sm:h-[450px] pointer-events-none mt-6 md:mt-0">
          
          {/* カード1 (手前・メイン) */}
          <div className="absolute top-0 md:top-12 right-0 md:right-6 w-[85%] sm:w-full max-w-[340px] bg-white rounded-[1.2rem] sm:rounded-[1.5rem] p-4 sm:p-5 flex gap-4 sm:gap-5 items-stretch shadow-[0_20px_50px_-12px_rgb(0_194_232_/_0.3)] border border-slate-100 animate-float z-20 rotate-[-2deg]">
            <div className="flex flex-col items-center shrink-0 space-y-1.5 sm:space-y-2">
               <div className="text-base sm:text-lg font-black text-slate-800 leading-none">15:00</div>
               <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-50 rounded-[0.8rem] sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl">🎻</div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
              <div className="flex justify-between items-start mb-1">
                 <h3 className="text-base sm:text-lg font-black leading-tight text-slate-900 truncate">ゲネプロ (全体)</h3>
                 <span className="ml-1 shrink-0 px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black bg-cyan-50 text-[#00c2e8]">全員</span>
              </div>
              <div className="flex items-center text-xs sm:text-sm font-bold text-[#00c2e8] mb-1"><Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 mr-1"/>~16:30 まで</div>
              <div className="flex items-center gap-3 text-[10px] sm:text-xs font-bold text-slate-400">
                 <div className="flex items-center"><MapPin className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-1 text-slate-300"/>メインホール</div>
              </div>
            </div>
          </div>

          {/* カード2 (奥・サブ) */}
          <div className="absolute top-32 md:top-48 left-0 w-[75%] sm:w-full max-w-[300px] bg-white/90 backdrop-blur-sm rounded-[1.2rem] sm:rounded-[1.5rem] p-3 sm:p-4 flex gap-3 sm:gap-4 items-stretch shadow-xl border border-slate-50 animate-float-delayed z-10 rotate-[4deg] scale-95 opacity-90">
            <div className="flex flex-col items-center shrink-0 space-y-1.5 sm:space-y-2">
               <div className="text-sm sm:text-base font-black text-slate-800 leading-none">12:30</div>
               <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-50 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl">🍱</div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
              <div className="flex justify-between items-start mb-1">
                 <h3 className="text-sm sm:text-base font-black leading-tight text-slate-900 truncate">お昼休憩</h3>
              </div>
              <div className="flex items-center text-[10px] sm:text-xs font-bold text-slate-400 mb-1"><Clock className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-1"/>~13:30 まで</div>
            </div>
          </div>
        </div>
      </section>

      {/* === 3つの特徴 === */}
      <section className="mt-20 md:mt-32 px-4 sm:px-6 max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 relative z-10">
        {[
          { icon: Zap, color: "from-amber-400 to-orange-500", title: "アプリ・ログイン不要", desc: "URLをクリックするだけ。面倒な会員登録やインストールは一切必要ありません。" },
          { icon: Smartphone, color: "from-purple-500 to-indigo-600", title: "スマホで一番見やすい", desc: "PDFを拡大するストレスから解放。自分の出番や進行状況が一目でわかるデザイン。" },
          { icon: Calendar, color: "from-[#00c2e8] to-cyan-500", title: "急な変更も1秒で共有", desc: "当日の急なスケジュール変更も、手元のスマホから即座に全員へ反映。" },
        ].map((item, i) => (
          <div key={i} className="bg-white/70 backdrop-blur-xl p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl border border-white/50 hover:-translate-y-1 transition-transform duration-300">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${item.color} text-white rounded-xl sm:rounded-[1.2rem] flex items-center justify-center mb-4 sm:mb-6 shadow-lg`}>
              <item.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-2 sm:mb-3">{item.title}</h3>
            <p className="text-xs sm:text-sm font-bold text-slate-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* === 利用シーン === */}
      <section className="mt-16 sm:mt-20 px-4 sm:px-6 text-center relative z-10 pb-20">
        <p className="text-[10px] sm:text-xs font-black text-slate-400 mb-6 sm:mb-8 tracking-widest uppercase">こんなイベントで使われています</p>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 max-w-3xl mx-auto">
          {[
            { icon: Music, label: "定期演奏会・発表会", color: "text-pink-500" },
            { icon: Music, label: "ライブ・フェス", color: "text-orange-500" },
            { icon: Heart, label: "結婚式・二次会", color: "text-red-500" },
            { icon: Clapperboard, label: "映像・スチール撮影", color: "text-blue-500" },
            { icon: Briefcase, label: "社内イベント・研修", color: "text-slate-500" },
          ].map((tag, i) => (
            <div key={i} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-white/80 backdrop-blur-sm border border-white/50 rounded-full shadow-sm text-xs sm:text-sm font-black text-slate-700 hover:bg-white transition-colors cursor-default">
              <tag.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${tag.color}`}/> {tag.label}
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}