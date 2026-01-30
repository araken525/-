"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Megaphone, X, Clock, AlertTriangle } from "lucide-react";

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
    const lastRead = localStorage.getItem(`announcement-read-${eventId}`);
    return lastRead !== msg;
  };

  useEffect(() => {
    if (initialAnnouncement && checkVisibility(initialAnnouncement)) {
      setIsVisible(true);
    }
  }, [initialAnnouncement]);

  // 時刻表示の自動更新
  useEffect(() => {
    if (!timeStr) return;
    setTimeAgo(getTimeAgo(timeStr));
    const timer = setInterval(() => { setTimeAgo(getTimeAgo(timeStr)); }, 60000);
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
            setIsVisible(!!newMsg);
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
    // 上下に少し余白を持たせる
    <div className="py-2 animate-in slide-in-from-top duration-300">
      {/* 赤を基調としたリッチなカードデザイン */}
      <div className="relative bg-white rounded-2xl p-4 shadow-lg shadow-red-100/50 border border-red-100 overflow-hidden flex items-start gap-4">
        
        {/* 左側の赤い装飾バー（グラデーションで高級感を） */}
        <div className="absolute top-0 bottom-0 left-0 w-1.5 bg-gradient-to-b from-red-400 to-red-600"></div>

        {/* アイコン（赤背景、赤文字、ゆっくり脈打つアニメーション） */}
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 text-red-500 mt-0.5 animate-[pulse_3s_ease-in-out_infinite]">
          <Megaphone className="w-5 h-5" />
        </div>

        {/* コンテンツ */}
        <div className="flex-1 min-w-0 py-0.5">
           <div className="flex items-center gap-2 mb-1">
             {/* タイトル変更と赤色化 */}
             <span className="text-xs font-black text-red-600 flex items-center gap-1">
               <AlertTriangle className="w-3 h-3" />
               アナウンス
             </span>
             {/* 時刻表示 */}
             {timeAgo && (
               <div className="flex items-center gap-1 text-[10px] font-bold text-red-300/80">
                 <Clock className="w-3 h-3" />
                 {timeAgo}
               </div>
             )}
           </div>
           {/* メッセージ本文 */}
           <div className="text-sm font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
             {message}
           </div>
        </div>

        {/* 閉じるボタン (ホバー時に赤くなる) */}
        <button 
          onClick={handleClose}
          className="shrink-0 -mr-1 -mt-1 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-full"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}