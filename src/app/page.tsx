import { redirect } from "next/navigation";

export default function Home() {
  async function jumpToEvent(formData: FormData) {
    "use server";
    const slug = formData.get("slug");
    if (slug) redirect(`/e/${slug}`);
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50 text-slate-900">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
        {/* ロゴ代わりのタイトル */}
        <h1 className="text-4xl font-black mb-2 tracking-tighter">Takt</h1>
        <p className="text-sm text-slate-500 mb-8 font-medium">舞台・イベントタイムスケジュール共有</p>
        
        {/* 移動用フォーム */}
        <form action={jumpToEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 text-left px-1">
              イベントID (Slug)
            </label>
            <input 
              name="slug" 
              type="text" 
              placeholder="例: demo" 
              defaultValue="demo"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-center focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all placeholder:text-slate-300"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all shadow-md"
          >
            スケジュールを見る
          </button>
        </form>
      </div>
    </main>
  );
}