"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";

export default function RefreshBadge({ dateText }: { dateText: string }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // 画面を再読み込みして最新データを取得
    window.location.reload();
  };

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col items-end gap-1.5 pointer-events-none">
      {/* ▼▼ 押せる「更新ボタン」 ▼▼ */}
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="w-14 h-14 bg-[#00c2e8] text-white rounded-full shadow-lg flex items-center justify-center active:scale-90 transition-all hover:scale-105 pointer-events-auto"
        aria-label="ページを更新"
      >
        <RefreshCw className={`w-6 h-6 ${isRefreshing ? "animate-spin" : ""}`} />
      </button>

      {/* ▼▼ 押せない「情報表示」 ▼▼ */}
      <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm border border-slate-100 text-[10px] font-black text-slate-400">
        {isRefreshing ? "更新中..." : `${dateText} 更新`}
      </div>
    </div>
  );
}