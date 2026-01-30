"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Megaphone, X, Clock } from "lucide-react";

type Props = {
  eventId: string;
  initialAnnouncement?: string | null;
  updatedAt?: string | null;
};

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

export default function EventAnnouncement({ eventId, initialAnnouncement, updatedAt }: Props) {
  const [message, setMessage] = useState<string | null>(initialAnnouncement ?? null);
  const [timeStr, setTimeStr] = useState<string | null>(updatedAt ?? null);
  const [isVisible, setIsVisible] = useState(false);
  const [timeAgo, setTimeAgo] = useState("");

  // 表示チェック（既読管理）
  const checkVisibility = (msg: string | null) => {
    if (!msg) return false;
    // メッセージの内容が変わっていたら表示する
    const lastRead = localStorage.getItem(`announcement-read-${eventId}`);
    return lastRead !== msg;
  };

  useEffect(() => {
    if (initialAnnouncement && checkVisibility(initialAnnouncement)) {
      setIsVisible(true);
    }
  }, [initialAnnouncement]);

  // 時刻表示の自動更新（1分ごとに書き換え）
  useEffect(() => {
    if (!timeStr) return;
    setTimeAgo(getTimeAgo(timeStr)); // 初回実行

    const timer = setInterval(() => {
      setTimeAgo(getTimeAgo(timeStr));
    }, 60000);
    return () => clearInterval(timer);
  }, [timeStr]);

  // リアルタイム受信
  useEffect(() => {
    const channel = supabase
      .channel(`event-announcement-${eventId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "events", filter: `id=eq.${eventId}` },
        (payload) => {
          const newMsg = payload.new.announcement;
          const newTime = payload.new.announcement_updated_at;

          if (newMsg !== message) {
            setMessage(newMsg);
            setTimeStr(newTime);
            if (newMsg) {
              setIsVisible(true);
            } else {
              setIsVisible(false);
            }
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId, message]);

  const handleClose = () => {
    setIsVisible(false);
    if (message) {
      localStorage.setItem(`announcement-read-${eventId}`, message);
    }
  };

  if (!message || !isVisible) return null;

  return (
    <div className="px-4 pb-4 animate-in slide-in-from-top duration-300">
      <div className="relative bg-white rounded-2xl p-4 shadow-lg shadow-cyan-100/50 border border-cyan-100 overflow-hidden flex items-start gap-4">
        
        {/* 左側の青い装飾バー */}
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-[#00c2e8]"></div>

        {/* アイコン */}
        <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center shrink-0 text-[#00c2e8] mt-0.5">
          <Megaphone className="w-5 h-5" />
        </div>

        {/* コンテンツ */}
        <div className="flex-1 min-w-0 py-0.5">
           <div className="flex items-center gap-2 mb-1">
             <span className="text-xs font-black text-[#00c2e8]">お知らせ</span>
             {timeAgo && (
               <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                 <Clock className="w-3 h-3" />
                 {timeAgo}
               </div>
             )}
           </div>
           <div className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
             {message}
           </div>
        </div>

        {/* 閉じるボタン */}
        <button 
          onClick={handleClose}
          className="shrink-0 -mr-1 -mt-1 p-2 text-slate-300 hover:text-slate-500 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}