"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, Smartphone, Zap, Plus, Search, ChevronDown, Music, Clapperboard, Briefcase, Heart } from "lucide-react";

export default function Home() {
  const [showSearch, setShowSearch] = useState(false);

  async function jumpToEvent(formData: FormData) {
    const slug = formData.get("slug") as string;
    if (slug) window.location.href = `/e/${slug}`;
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] font-sans text-slate-800 selection:bg-[#00c2e8] selection:text-white pt-16 relative overflow-hidden flex flex-col">
      
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
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 9s ease-in-out infinite; }
      `}</style>

      {/* === ヘッダー === */}
      <header className="fixed top-0 inset-x-0 h-16 bg-white/80 backdrop-blur-xl border-b border-white/40 flex items-center justify-between px-6 z-50">
        <div className="font-black text-2xl text-slate-800 tracking-tighter">
          TaiSuke
        </div>
        <Link 
          href="/create"
          className="h-9 px-5 bg-slate-900 text-white rounded-full font-black text-xs shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> 作成する
        </Link>
      </header>

      {/* === メインコンテンツ (flex-1で高さを確保) === */}
      <div className="flex-1 pb-20">
        
        {/* === ヒーローセクション === */}
        {/* ★iPad対応: max-w-xl -> md:max-w-5xl に拡張し、全体を広く使う */}
        <section className="pt-24 md:pt-36 px-6 w-full max-w-xl md:max-w-5xl mx-auto relative z-10 text-center">
          
          {/* ★背景として浮遊するUIモックアップ */}
          <div className="absolute inset-0 pointer-events-none z-[-1] overflow-visible">
             
             {/* ① 上のカード: iPadでは左端へ (md:left-0) */}
             <div className="absolute top-0 -left-8 md:left-0 md:-top-10 w-[260px] bg-white/60 backdrop-blur-sm rounded-[1.5rem] p-4 flex gap-3 items-center shadow-lg border border-white/50 animate-float rotate-[-6deg] opacity-70 scale-90 sm:scale-100">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-2xl">🎻</div>
                <div className="flex-1 min-w-0 text-left">
                   <h3 className="text-sm font-black text-slate-800 truncate">ゲネプロ (全体)</h3>
                   <div className="text-xs font-bold text-[#00c2e8] mt-1">15:00 ~ 16:30</div>
                </div>
             </div>

             {/* ② 下のカード: iPadでは右端へ (md:right-0) */}
             <div className="absolute -bottom-24 -right-6 md:right-0 md:-bottom-10 w-[240px] bg-white/60 backdrop-blur-sm rounded-[1.5rem] p-4 flex gap-3 items-center shadow-lg border border-white/50 animate-float-delayed rotate-[6deg] opacity-70 scale-90 sm:scale-100">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-2xl">🍱</div>
                <div className="flex-1 min-w-0 text-left">
                   <h3 className="text-sm font-black text-slate-800 truncate">お昼休憩</h3>
                   <div className="text-xs font-bold text-purple-500 mt-1">12:30 ~ 13:30</div>
                </div>
             </div>
          </div>

          {/* コンテンツエリア */}
          <div className="relative z-10 max-w-xl mx-auto">
            <h1 className="text-4xl sm:text-6xl font-black leading-[1.15] tracking-tight text-slate-900 mb-6 drop-shadow-sm">
              <span className="inline-block whitespace-nowrap">当日のタイスケ、</span><br />
              <span className="inline-block whitespace-nowrap text-transparent bg-clip-text bg-gradient-to-r from-[#00c2e8] to-purple-600">みんなのスマホへ。</span>
            </h1>
            
            <p className="text-sm sm:text-base font-bold text-slate-500 mb-10 leading-relaxed max-w-xs mx-auto">
              TaiSuke（タイスケ）は、PDFより見やすく、Excelより手軽な、新世代のイベント進行表ツールです。
            </p>

            <Link 
              href="/create"
              className="w-full h-16 bg-[#00c2e8] text-white rounded-[1.5rem] font-black text-lg shadow-xl shadow-cyan-200/30 hover:bg-cyan-500 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mb-8 mx-auto"
            >
              <Plus className="w-6 h-6" /> タイスケを作成する
            </Link>

            {!showSearch ? (
              <button onClick={() => setShowSearch(true)} className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-2 transition-colors mx-auto">
                <Search className="w-4 h-4" /> 招待されたタイスケを見る <ChevronDown className="w-3.5 h-3.5"/>
              </button>
            ) : (
              <div className="bg-white/90 backdrop-blur-md p-2 rounded-[1.5rem] shadow-lg border border-white/50 animate-in fade-in slide-in-from-top-2 duration-300 relative z-10">
                <form action={jumpToEvent} className="flex gap-2">
                  <input name="slug" type="text" placeholder="URL ID (例: concert2026)" className="flex-1 h-12 px-4 bg-slate-100/80 rounded-xl font-bold text-slate-800 placeholder:text-slate-400 outline-none min-w-0 text-sm" required />
                  <button type="submit" className="h-12 px-6 bg-slate-900 text-white font-black rounded-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center text-sm">開く</button>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* === 3つの特徴 === */}
        {/* ★iPad対応: grid-cols-1 -> md:grid-cols-3 (横並び) */}
        <section className="mt-40 px-6 grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8 max-w-5xl mx-auto relative z-10">
          {[
            { icon: Zap, color: "from-amber-400 to-orange-500", title: "アプリ・ログイン不要", desc: "URLをクリックするだけ。面倒な会員登録やインストールは一切必要ありません。" },
            { icon: Smartphone, color: "from-purple-500 to-indigo-600", title: "スマホで一番見やすい", desc: "PDFを拡大するストレスから解放。自分の出番や進行状況が一目でわかるデザイン。" },
            { icon: Calendar, color: "from-[#00c2e8] to-cyan-500", title: "急な変更も1秒で共有", desc: "当日の急なスケジュール変更も、手元のスマホから即座に全員へ反映。" },
          ].map((item, i) => (
            <div key={i} className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-sm border border-white/60 h-full">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-5 mb-2">
                 <div className={`w-12 h-12 bg-gradient-to-br ${item.color} text-white rounded-[1rem] flex items-center justify-center shrink-0 shadow-md`}>
                   <item.icon className="w-6 h-6" />
                 </div>
                 <h3 className="text-lg font-black text-slate-800">{item.title}</h3>
              </div>
              <p className="text-sm font-bold text-slate-500 leading-relaxed mt-2">{item.desc}</p>
            </div>
          ))}
        </section>

        {/* === 利用シーン === */}
        {/* ★iPad対応: 縦積み -> md:grid-cols-2 (2列グリッド) */}
        <section className="mt-32 px-6 relative z-10 max-w-4xl mx-auto">
          <p className="text-xs font-black text-slate-400 mb-8 text-center tracking-widest uppercase">こんなイベントで使われています</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: Music, label: "定期演奏会・発表会", desc: "進行管理が複雑な舞台裏に。", color: "bg-pink-50 text-pink-500" },
              { icon: Music, label: "ライブ・フェス", desc: "多数の出演者の出番を管理。", color: "bg-orange-50 text-orange-500" },
              { icon: Heart, label: "結婚式・二次会", desc: "幹事とスタッフの連携に。", color: "bg-red-50 text-red-500" },
              { icon: Clapperboard, label: "映像・スチール撮影", desc: "香盤表をスマホで共有。", color: "bg-blue-50 text-blue-500" },
              { icon: Briefcase, label: "社内イベント・研修", desc: "スムーズな進行のために。", color: "bg-slate-100 text-slate-600" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm border border-white/60 rounded-[1.5rem] shadow-sm hover:bg-white transition-colors h-full">
                 <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center shrink-0`}>
                    <item.icon className="w-6 h-6"/>
                 </div>
                 <div>
                    <h4 className="text-base font-black text-slate-800 leading-tight">{item.label}</h4>
                    <p className="text-xs font-bold text-slate-400 mt-0.5">{item.desc}</p>
                 </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* === フッター (開発者への連絡) === */}
      <footer className="mt-20 py-12 border-t border-slate-100 relative z-10 bg-white/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-4 mb-8">
           
           {/* コピーライト */}
           <div className="text-center md:text-left">
              <div className="font-black text-slate-800 text-lg mb-1 tracking-tight">TaiSuke</div>
              <div className="text-xs font-bold text-slate-400">© 2026 Time Schedule Sharing App</div>
           </div>

           {/* 開発者リンク (X / Twitter) */}
           <a
             href="https://x.com/araken525_toho?s=21"
             target="_blank"
             rel="noopener noreferrer"
             className="group flex items-center gap-3 px-5 py-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-slate-300 hover:shadow-md transition-all"
           >
              <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                 {/* X ロゴ SVG */}
                 <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </div>
              <div className="text-left">
                 <div className="text-[10px] font-bold text-slate-400 group-hover:text-[#00c2e8] transition-colors">開発者へ連絡・要望</div>
                 <div className="text-xs font-black text-slate-700">@araken525_toho</div>
              </div>
           </a>
        </div>
        
        {/* ▼▼▼ 追加: PRODUCED BY ENSEMBLE LABS ▼▼▼ */}
        <div className="text-center border-t border-slate-100 pt-8 mt-8">
           <div className="text-[10px] font-black text-slate-300 tracking-[0.2em]">
              PRODUCED BY ENSEMBLE LABS
           </div>
        </div>
      </footer>

    </main>
  );
}