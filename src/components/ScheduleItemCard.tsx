"use client";

import { useState } from "react";
import { Clock, MapPin, ChevronDown, ChevronUp } from "lucide-react";

// page.tsx で計算されたデータを受け取る型定義
type ScheduleItemCardProps = {
  it: any;
  now: boolean;
  emoji: string;
  duration: string | null;
  badgeColor: string;
  startHhmm: string;
  endHhmm: string | null;
};

export default function ScheduleItemCard({
  it,
  now,
  emoji,
  duration,
  badgeColor,
  startHhmm,
  endHhmm,
}: ScheduleItemCardProps) {
  // メモが開いているかどうかの状態
  const [isExpanded, setIsExpanded] = useState(false);

  // メモが長いかどうかを判定（80文字以上、または改行が3回以上ある場合にボタンを表示）
  const hasLongNote =
    it.note && (it.note.length > 80 || it.note.split("\n").length > 3);

  return (
    <div
      className={`
        relative bg-white rounded-[1.5rem] p-6 flex gap-4 items-start overflow-hidden transition-all hover:shadow-xl h-full flex-col
        ${now 
          ? "shadow-2xl ring-4 ring-[#00c2e8]/20 border-2 border-[#00c2e8] scale-[1.02] z-10" 
          : "shadow-wolt border border-transparent"}
      `}
    >
      {now && (
        <div className="absolute -top-3 -left-2 bg-[#00c2e8] text-white px-3 py-1 rounded-full text-[10px] font-black shadow-md border-2 border-white z-20">
          NOW
        </div>
      )}

      <div className="absolute -bottom-4 -right-2 text-[5rem] font-black text-slate-50/80 select-none watermark-text leading-none z-0 pointer-events-none">
        {startHhmm}
      </div>

      <div className="relative z-10 flex items-start gap-4 w-full">
        <div className="shrink-0 text-[3rem] leading-none drop-shadow-sm filter grayscale-[0.1]">
          {emoji}
        </div>

        <div className="flex-1 min-w-0 flex flex-col h-full">
          <div className="mb-2">
            <div className="flex flex-wrap items-start gap-2 mb-1">
              <h3 className={`text-xl font-black leading-tight tracking-tight ${now ? "text-[#00c2e8]" : "text-slate-900"}`}>
                {it.title}
              </h3>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black ${badgeColor}`}>
              {it.target && it.target !== "all" ? it.target.replace(/,/g, "・") : "全員"}
            </span>
          </div>

          {endHhmm && (
            <div className="flex items-center text-sm font-bold text-[#00c2e8] mb-3">
              <Clock className="w-4 h-4 mr-1.5" />
              <span>~{endHhmm} まで</span>
            </div>
          )}

          {/* ▼▼▼ 修正ポイント：メモの表示部分 ▼▼▼ */}
          {it.note && (
            <div className="mb-4">
              <div
                className={`text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap break-words ${
                  !isExpanded ? "line-clamp-3" : ""
                }`}
              >
                {it.note}
              </div>
              {hasLongNote && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 flex items-center gap-1 text-xs font-bold text-[#00c2e8] hover:text-cyan-700 transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" /> 閉じる
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" /> もっと見る
                    </>
                  )}
                </button>
              )}
            </div>
          )}
          {/* ▲▲▲ 修正ポイント：メモの表示部分 ▲▲▲ */}

          <div className="flex items-center gap-3 pt-3 border-t border-slate-50 mt-auto">
            {it.location ? (
              <div className="flex items-center text-xs font-bold text-slate-500 truncate max-w-[70%]">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-300 shrink-0" />
                <span className="truncate">{it.location}</span>
              </div>
            ) : <div className="flex-1"></div>}
            
            {it.location && <div className="w-px h-3 bg-slate-200 shrink-0"></div>}

            {duration && (
              <div className="text-xs font-bold text-slate-400 shrink-0">
                ⏳ {duration}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}