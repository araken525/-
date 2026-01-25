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
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 9s ease-in-out infinite; }
      `}</style>

      {/* 背景のオーブ（光）は削除しました */}

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

      {/* === ヒーローセクション === */}
      {/* バッジを消したので pt-32 -> pt-24 に詰めました */}
      <section className="pt-24 px-6 max-w-xl mx-auto relative z-10 text-center">
        
        {/* ★背景として浮遊するUIモックアップ */}
        <div className="absolute inset-0 pointer-events-none z-[-1] overflow-visible">
           
           {/* ① 上のカード（ゲネプロ） */}
           <div className="absolute top-0 -left-8 w-[260px] bg-white/60 backdrop-blur-sm rounded-[1.5rem] p-4 flex gap-3 items-center shadow-lg border border-white/50 animate-float rotate-[-6deg] opacity-70 scale-90 sm:scale-100">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-2xl">🎻</div>
              <div className="flex-1 min-w-0 text-left">
                 <h3 className="text-sm font-black text-slate-800 truncate">ゲネプロ (全体)</h3>
                 <div className="text-xs font-bold text-[#00c2e8] mt-1">15:00 ~ 16:30</div>
              </div>
           </div>

           {/* ② 下のカード（お昼休憩）：さらに下へ配置 (-bottom-24) */}
           <div className="absolute -bottom-24 -right-6 w-[240px] bg-white/60 backdrop-blur-sm rounded-[1.5rem] p-4 flex gap-3 items-center shadow-lg border border-white/50 animate-float-delayed rotate-[6deg] opacity-70 scale-90 sm:scale-100">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-2xl">🍱</div>
              <div className="flex-1 min-w-0 text-left">
                 <h3 className="text-sm font-black text-slate-800 truncate">お昼休憩</h3>
                 <div className="text-xs font-bold text-purple-500 mt-1">12:30 ~ 13:30</div>
              </div>
           </div>

        </div>

        {/* コンテンツエリア */}
        <div className="relative z-10">
          
          {/* バッジ削除により、ここからタイトル開始 */}
          
          <h1 className="text-5xl font-black leading-[1.15] tracking-tight text-slate-900 mb-6 drop-shadow-sm">
            当日のタイスケ、<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00c2e8] to-purple-600">みんなのスマホへ。</span>
          </h1>
          
          <p className="text-base font-bold text-slate-500 mb-10 leading-relaxed max-w-xs mx-auto">
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

      {/* === 3つの特徴 (固定) === */}
      <section className="mt-40 px-6 grid grid-cols-1 gap-5 relative z-10">
        {[
          { icon: Zap, color: "from-amber-400 to-orange-500", title: "アプリ・ログイン不要", desc: "URLをクリックするだけ。面倒な会員登録やインストールは一切必要ありません。" },
          { icon: Smartphone, color: "from-purple-500 to-indigo-600", title: "スマホで一番見やすい", desc: "PDFを拡大するストレスから解放。自分の出番や進行状況が一目でわかるデザイン。" },
          { icon: Calendar, color: "from-[#00c2e8] to-cyan-500", title: "急な変更も1秒で共有", desc: "当日の急なスケジュール変更も、手元のスマホから即座に全員へ反映。" },
        ].map((item, i) => (
          <div key={i} className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-sm border border-white/60">
            <div className="flex items-start gap-5">
               <div className={`w-12 h-12 bg-gradient-to-br ${item.color} text-white rounded-[1rem] flex items-center justify-center shrink-0 shadow-md`}>
                 <item.icon className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-lg font-black text-slate-800 mb-2">{item.title}</h3>
                  <p className="text-sm font-bold text-slate-500 leading-relaxed">{item.desc}</p>
               </div>
            </div>
          </div>
        ))}
      </section>

      {/* === 利用シーン === */}
      <section className="mt-24 px-6 relative z-10 pb-20">
        <p className="text-xs font-black text-slate-400 mb-8 text-center tracking-widest uppercase">こんなイベントで使われています</p>
        <div className="space-y-3 max-w-md mx-auto">
          {[
            { icon: Music, label: "定期演奏会・発表会", desc: "進行管理が複雑な舞台裏に。", color: "bg-pink-50 text-pink-500" },
            { icon: Music, label: "ライブ・フェス", desc: "多数の出演者の出番を管理。", color: "bg-orange-50 text-orange-500" },
            { icon: Heart, label: "結婚式・二次会", desc: "幹事とスタッフの連携に。", color: "bg-red-50 text-red-500" },
            { icon: Clapperboard, label: "映像・スチール撮影", desc: "香盤表をスマホで共有。", color: "bg-blue-50 text-blue-500" },
            { icon: Briefcase, label: "社内イベント・研修", desc: "スムーズな進行のために。", color: "bg-slate-100 text-slate-600" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-white/80 backdrop-blur-sm border border-white/60 rounded-[1.5rem] shadow-sm hover:bg-white transition-colors">
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

    </main>
  );
}