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
    <button
      onClick={handleRefresh}
      className="fixed bottom-6 right-6 z-30 bg-white/90 backdrop-blur px-4 py-2.5 rounded-full shadow-lg border border-slate-100 text-xs font-black text-slate-500 flex items-center transition-all hover:bg-white"
    >
      <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRefreshing ? "animate-spin text-[#00c2e8]" : ""}`} />
      {isRefreshing ? "更新中..." : `${dateText} 更新`}
    </button>
  );
}