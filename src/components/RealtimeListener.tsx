"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function RealtimeListener({ eventId }: { eventId: string }) {
  const router = useRouter();

  useEffect(() => {
    // チャンネルを作成して監視を開始
    const channel = supabase
      .channel('realtime-schedule')
      .on(
        'postgres_changes',
        {
          event: '*', // 追加・更新・削除すべて
          schema: 'public',
          table: 'schedule_items',
          filter: `event_id=eq.${eventId}`, // このイベントの変更だけ反応する
        },
        () => {
          console.log("変更を検知しました。画面を更新します。");
          router.refresh(); // 画面をリロード（スクロール位置は維持されます）
        }
      )
      .subscribe();

    // ページを離れるときに監視を終了
    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, router]);

  return null; // 画面には何も表示しない「透明な部品」です
}