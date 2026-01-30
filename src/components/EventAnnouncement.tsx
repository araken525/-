"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Megaphone, X } from "lucide-react";

type Props = {
  eventId: string;
  initialAnnouncement?: string | null;
};

export default function EventAnnouncement({ eventId, initialAnnouncement }: Props) {
  const [message, setMessage] = useState<string | null>(initialAnnouncement ?? null);
  const [isVisible, setIsVisible] = useState(false);

  // 表示チェックロジック（既読なら出さない）
  const checkVisibility = (msg: string | null) => {
    if (!msg) return false;
    
    // ブラウザに保存された「最後に閉じたメッセージ」を確認
    const lastRead = localStorage.getItem(`announcement-read-${eventId}`);
    
    // 「まだ読んでない」または「内容が変わった」なら表示
    return lastRead !== msg;
  };

  useEffect(() => {
    // 1. 初回ロード時のチェック
    if (initialAnnouncement && checkVisibility(initialAnnouncement)) {
      setIsVisible(true);
    }

    // 2. リアルタイム更新の監視
    const channel = supabase
      .channel(`event-announcement-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "events",
          filter: `id=eq.${eventId}`,
        },
        (payload) => {
          const newMsg = payload.new.announcement;
          
          // メッセージ内容が変わった時だけ処理
          if (newMsg !== message) {
            setMessage(newMsg);
            // 新しいメッセージが来たら、強制的に表示（既読リセット）
            if (newMsg) {
              setIsVisible(true);
              // ※ここではまだlocalStorageは更新しない（閉じた時に更新）
            } else {
              setIsVisible(false);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, initialAnnouncement, message]);

  // 閉じるボタンを押した時の処理
  const handleClose = () => {
    setIsVisible(false);
    if (message) {
      // 「このメッセージは読んだ」と記録する
      localStorage.setItem(`announcement-read-${eventId}`, message);
    }
  };

  if (!message || !isVisible) return null;

  return (
    <div className="w-full bg-slate-900 text-amber-400 px-4 py-3 shadow-md animate-in slide-in-from-top duration-300 relative z-40 border-b border-amber-400/30">
      <div className="max-w-7xl mx-auto flex items-start gap-3">
        {/* アイコン */}
        <Megaphone className="w-5 h-5 shrink-0 animate-pulse mt-0.5" />
        
        {/* メッセージ本文 */}
        <div className="flex-1 text-sm font-bold leading-relaxed tracking-wide">
          {message}
        </div>

        {/* 閉じるボタン */}
        <button 
          onClick={handleClose}
          className="shrink-0 text-slate-500 hover:text-white transition-colors -mr-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}