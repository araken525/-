import { redirect } from "next/navigation";
import { ArrowRight, Calendar, Smartphone, Zap } from "lucide-react";

export default function Home() {
  async function jumpToEvent(formData: FormData) {
    "use server";
    const slug = formData.get("slug");
    if (slug) redirect(`/e/${slug}`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-900 p-6 relative overflow-hidden">
      {/* 背景の装飾（薄い円） */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-100 rounded-full blur-3xl opacity-50 pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* ロゴエリア */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl mb-4 shadow-xl rotate-3">
            <span className="text-3xl">🎵</span>
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-slate-900 mb-2">
            Takt
          </h1>
          <p className="text-slate-500 font-medium">
            舞台・イベント タイムスケジュール共有
          </p>
        </div>

        {/* 入力カード */}
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <form action={jumpToEvent} className="space-y-4">
            <div>
              <label 
                htmlFor="slug" 
                className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider"
              >
                Event ID
              </label>
              <input
                id="slug"
                name="slug"
                type="text"
                placeholder="shinyuri-sample"
                className="w-full h-14 px-4 bg-slate-50 border-2 border-slate-100 rounded-xl text-lg font-bold text-slate-900 text-center focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal"
                required
                autoComplete="off"
              />
            </div>
            <button
              type="submit"
              className="group w-full h-14 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              スケジュールを見る
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-center text-slate-400 font-medium">
              合言葉を知っている人のみ閲覧できます
            </p>
          </div>
        </div>

        {/* 特徴リスト */}
        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-600">
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-500">ログイン不要</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-500">スマホ最適化</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-600">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-500">当日進行特化</span>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-6 text-xs text-slate-300 font-medium">
        © Takt - Time Schedule Sharing
      </div>
    </main>
  );
}