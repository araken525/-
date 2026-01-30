"use client";

import { useState, useEffect, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { ArrowLeft, Megaphone, Trash2, Send, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

// 全角→半角変換
const toHalfWidth = (str: string) => {
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => {
    return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
  });
};

export default function BroadcastPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [inputMessage, setInputMessage] = useState("");
  // eventDataにはパスワードを含めない（どうせ取れないので）
  const [eventData, setEventData] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      // 1. イベント情報を取得（パスワード以外の公開情報のみ）
      const { data: event, error } = await supabase
        .from("events")
        .select("id, title, announcement") 
        .eq("slug", slug)
        .single();

      if (error || !event) {
        alert("イベントが見つかりません");
        router.push(`/e/${slug}`);
        return;
      }

      setEventData(event);
      setInputMessage(event.announcement || "");

      // 2. 自動ログイン試行 (RPCを使って答え合わせ)
      const savedPass = localStorage.getItem(`admin-pass-${slug}`);
      if (savedPass) {
        const { data: isValid } = await supabase.rpc("verify_event_password", {
          event_slug: slug,
          input_password: savedPass,
        });

        if (isValid) {
          setIsAuthenticated(true);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [slug, router]);

  // ★修正: RPCを使ってDB側で答え合わせをする
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // 入力を整形
    const cleanInput = toHalfWidth(password).trim();
    
    // DBの「答え合わせ係（verify_event_password）」に聞く
    // 生の入力と、半角変換後の両方で試す
    const { data: isMatchRaw } = await supabase.rpc("verify_event_password", {
      event_slug: slug,
      input_password: password.trim(),
    });
    
    const { data: isMatchClean } = await supabase.rpc("verify_event_password", {
      event_slug: slug,
      input_password: cleanInput,
    });

    if (isMatchRaw || isMatchClean) {
      // 正解！
      setIsAuthenticated(true);
      // 正解だったほう（あるいは整形後）を保存
      localStorage.setItem(`admin-pass-${slug}`, isMatchRaw ? password.trim() : cleanInput);
      setErrorMsg("");
    } else {
      // 不正解
      console.error("Password verification failed");
      setErrorMsg("パスワードが違います");
    }
  };

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

  // 削除
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

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-sm p-8 rounded-3xl shadow-xl text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Megaphone className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-black text-slate-800 mb-2">放送室へ入室</h1>
          <p className="text-xs text-slate-500 mb-6 font-bold">パスワードを入力してください</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
              <input 
                type="text" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="パスワード"
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all"
                autoFocus
              />
            </div>
            {errorMsg && <p className="text-xs font-bold text-red-500">{errorMsg}</p>}
            <button 
              type="submit"
              className="w-full py-3 bg-slate-800 text-white rounded-xl font-black shadow-lg shadow-slate-200 active:scale-95 transition-all"
            >
              入室する
            </button>
          </form>
          <div className="mt-6">
            <Link href={`/e/${slug}`} className="text-xs font-bold text-slate-400 hover:text-slate-600">
              キャンセルして戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 font-sans">
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 z-50 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/e/${slug}`} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <h1 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-amber-500" />
            放送室
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