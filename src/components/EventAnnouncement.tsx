"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Clock, AlertTriangle } from "lucide-react";

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
  const [timeAgo, setTimeAgo] = useState("");

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
          setMessage(newMsg);
          setTimeStr(newTime);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  if (!message) return null;

  return (
    <div className="py-2 animate-in slide-in-from-top duration-300">
      <div className="relative rounded-[1.5rem] overflow-hidden border border-red-100/50 bg-white shadow-sm">
        
        {/* 背景グラデーション */}
        <div className="absolute inset-0 bg-[conic-gradient(at_bottom_right,_var(--tw-gradient-stops))] from-red-50 via-orange-50/50 to-white opacity-80 pointer-events-none"></div>
        
        {/* 透かし文字 */}
        <div className="absolute -bottom-6 -right-2 text-[5rem] font-black text-red-500/5 select-none leading-none z-0 tracking-tighter pointer-events-none">
          ANNOUNCEMENT
        </div>

        {/* コンテンツ */}
        <div className="relative z-10 p-5 pb-3">
          {/* ヘッダー: 囲みを外してシンプルに */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-black text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              アナウンス
            </span>
          </div>

          {/* メッセージ本文 */}
          <div className="text-sm font-bold text-slate-900 leading-relaxed whitespace-pre-wrap mb-4 pl-1">
            {message}
          </div>
          
          {/* 薄い区切り線 */}
          <div className="h-px bg-gradient-to-r from-red-100/50 via-red-100 to-transparent w-full mb-2"></div>

          {/* 下部の時間情報 */}
          {timeAgo && (
            <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-red-400/80">
              <Clock className="w-3 h-3" />
              最終更新: {timeAgo}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}