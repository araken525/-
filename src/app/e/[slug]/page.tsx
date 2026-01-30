"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft, Megaphone, Trash2, Send, AlertTriangle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

// 「◯分前」を計算する関数
function getTimeAgo(dateStr?: string | null) {
  if (!dateStr) return "";
  const now = new Date();
  const past = new Date(dateStr);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return "たった今";
  if (diffMins < 60) return `${diffMins}分前`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}時間前`;
  return `${Math.floor(diffHours / 24)}日前`;
}

export default function BroadcastPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [eventData, setEventData] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [timeAgo, setTimeAgo] = useState("");

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

  // プレビュー用の時刻更新
  useEffect(() => {
    if (!eventData?.announcement_updated_at) {
      setTimeAgo("");
      return;
    }
    setTimeAgo(getTimeAgo(eventData.announcement_updated_at));
    const timer = setInterval(() => {
      setTimeAgo(getTimeAgo(eventData.announcement_updated_at));
    }, 60000);
    return () => clearInterval(timer);
  }, [eventData?.announcement_updated_at]);

  const handleUpdate = async () => {
    if (!inputMessage.trim()) return;
    setIsSending(true);

    const now = new Date().toISOString();

    const { error } = await supabase
      .from("events")
      .update({ 
        announcement: inputMessage,
        announcement_updated_at: now 
      })
      .eq("id", eventData.id);

    if (error) {
      alert(`送信失敗: ${error.message}`);
    } else {
      alert("送信しました！");
      setEventData({ 
        ...eventData, 
        announcement: inputMessage,
        announcement_updated_at: now 
      });
    }
    setIsSending(false);
  };

  const handleDelete = async () => {
    if (!confirm("取り下げますか？")) return;
    setIsSending(true);

    const { error } = await supabase
      .from("events")
      .update({ 
        announcement: null,
        announcement_updated_at: null
      })
      .eq("id", eventData.id);

    if (error) {
      alert("削除失敗");
    } else {
      setInputMessage("");
      setEventData({ ...eventData, announcement: null, announcement_updated_at: null });
      alert("取り下げました");
    }
    setIsSending(false);
  };

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-400">読み込み中...</div>;

  return (
    <main className="min-h-screen bg-[#f7f9fb] font-sans selection:bg-[#00c2e8] selection:text-white">
      {/* ヘッダー：青色ベース */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/e/${slug}`} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-[#00c2e8]" />
            放送室
          </h1>
        </div>
      </header>

      <div className="pt-24 px-4 max-w-lg mx-auto pb-12 space-y-8">
        
        {/* プレビューエリア */}
        <div>
          <div className="text-xs font-bold text-slate-400 mb-2 pl-2">現在の状況 (プレビュー)</div>
          {eventData.announcement ? (
            <div className="relative rounded-[1.5rem] overflow-hidden border border-red-100/50 bg-white shadow-sm">
              <div className="absolute inset-0 bg-[conic-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-red-50 via-orange-50/50 to-white opacity-80 pointer-events-none"></div>
              <div className="absolute -bottom-6 -right-2 text-[5rem] font-black text-red-500/5 select-none leading-none z-0 tracking-tighter pointer-events-none">ANNOUNCEMENT</div>
              
              <div className="relative z-10 p-5 pb-3">
                <div className="flex items-center gap-2 mb-3">
                  {/* ここを「アナウンス」に修正 */}
                  <span className="text-xs font-black text-red-600 flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-md border border-red-100">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    アナウンス
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-wrap mb-4 pl-1">
                  {eventData.announcement}
                </div>
                <div className="h-px bg-gradient-to-r from-red-100/50 via-red-100 to-transparent w-full mb-2"></div>
                {timeAgo && (
                  <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-red-400/80">
                    <Clock className="w-3 h-3" />
                    最終更新: {timeAgo}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-slate-200 p-6 rounded-2xl text-center">
              <div className="text-slate-400 font-bold text-sm">現在アナウンスは流れていません</div>
            </div>
          )}
        </div>

        {/* 入力フォーム */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
          <label className="block text-sm font-black text-slate-800 mb-4 pl-1">
            メッセージを作成
          </label>
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="例：13:00のリハーサルはBスタジオに変更になりました。"
            className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00c2e8] focus:border-transparent transition-all resize-none mb-4 leading-relaxed selection:bg-[#00c2e8] selection:text-white"
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
              className="flex-[2] py-3.5 bg-[#00c2e8] text-white rounded-xl font-black shadow-lg shadow-cyan-200 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
            >
              {isSending ? "送信中..." : <><Send className="w-4 h-4" /> アナウンスする</>}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}