"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft, Megaphone, Trash2, Send } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BroadcastPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [eventData, setEventData] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);

  // 初期ロード (パスワードチェックなしでデータだけ取る)
  useEffect(() => {
    const fetchEvent = async () => {
      const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error || !event) {
        alert("イベントが見つかりません");
        return;
      }

      setEventData(event);
      setInputMessage(event.announcement || "");
      setLoading(false);
    };
    fetchEvent();
  }, [slug]);

  // アナウンス送信
  const handleUpdate = async () => {
    if (!inputMessage.trim()) return;
    setIsSending(true);

    const { error } = await supabase
      .from("events")
      .update({ announcement: inputMessage })
      .eq("id", eventData.id);

    if (error) {
      alert(`送信失敗: ${error.message}`);
    } else {
      alert("送信しました！");
      setEventData({ ...eventData, announcement: inputMessage });
    }
    setIsSending(false);
  };

  // アナウンス削除
  const handleDelete = async () => {
    if (!confirm("取り下げますか？")) return;
    setIsSending(true);

    const { error } = await supabase
      .from("events")
      .update({ announcement: null })
      .eq("id", eventData.id);

    if (error) {
      alert("削除失敗");
    } else {
      setInputMessage("");
      setEventData({ ...eventData, announcement: null });
      alert("取り下げました");
    }
    setIsSending(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">読み込み中...</div>;

  // 認証画面をスキップして、いきなり操作画面を表示
  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/e/${slug}`} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-500" />
            放送室 (テストモード)
          </h1>
        </div>
      </header>

      <div className="pt-24 px-4 max-w-lg mx-auto pb-12">
        <div className="mb-8">
          <div className="text-xs font-bold text-slate-400 mb-2 pl-2">現在の状況</div>
          {eventData.announcement ? (
            <div className="bg-slate-800 text-amber-400 p-4 rounded-2xl shadow-lg flex items-start gap-3 animate-pulse">
              <Megaphone className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-sm font-bold leading-relaxed">{eventData.announcement}</div>
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 p-6 rounded-2xl text-center">
              <div className="text-slate-400 font-bold text-sm">現在アナウンスは流れていません</div>
              <p className="text-[10px] text-slate-300 mt-1">下のフォームから送信できます</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <label className="block text-sm font-black text-slate-800 mb-4 pl-1">
            メッセージを作成
          </label>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="例：13:00のリハーサルはBスタジオに変更になりました。"
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all resize-none mb-4 leading-relaxed"
          ></textarea>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDelete}
              disabled={!eventData.announcement || isSending}
              className="flex-1 py-3.5 rounded-xl border border-slate-200 text-slate-400 font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all disabled:opacity-50 disabled:pointer-events-none"
            >
              <Trash2 className="w-4 h-4" />
              取り下げ
            </button>
            <button
              onClick={handleUpdate}
              disabled={!inputMessage.trim() || isSending}
              className="flex-[2] py-3.5 bg-amber-500 text-white rounded-xl font-black shadow-lg shadow-amber-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
            >
              {isSending ? (
                "送信中..."
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  アナウンスする
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}