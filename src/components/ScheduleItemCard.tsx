"use client";

import { useState } from "react";
// ▼ アイコンを追加
import { Clock, MapPin, ChevronDown, ChevronUp, Link2, Youtube, Video, FileText, Image as ImageIcon } from "lucide-react";

type ScheduleItemCardProps = {
  it: any;
  now: boolean;
  emoji: string;
  duration: string | null;
  badgeColor: string;
  startHhmm: string;
  endHhmm: string | null;
  materials: any[];
};

// ★追加: URLからアイコンと色を自動判定するロジック
function getMaterialInfo(url: string) {
  const u = url.toLowerCase();
  if (u.includes("youtube") || u.includes("youtu.be")) {
    return { icon: Youtube, color: "text-red-500", border: "group-hover:border-red-500" };
  }
  if (u.endsWith(".mp4") || u.endsWith(".mov") || u.includes("vimeo")) {
    return { icon: Video, color: "text-pink-500", border: "group-hover:border-pink-500" };
  }
  if (u.endsWith(".pdf")) {
    return { icon: FileText, color: "text-orange-500", border: "group-hover:border-orange-500" };
  }
  if (u.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
    return { icon: ImageIcon, color: "text-green-500", border: "group-hover:border-green-500" };
  }
  return { icon: Link2, color: "text-[#00c2e8]", border: "group-hover:border-[#00c2e8]" };
}

export default function ScheduleItemCard({
  it,
  now,
  emoji,
  duration,
  badgeColor,
  startHhmm,
  endHhmm,
  materials,
}: ScheduleItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasLongNote =
    it.note && (it.note.length > 80 || it.note.split("\n").length > 3);

  // 紐付いている資料を抽出
  const linkedMaterials = materials.filter((m) => {
    if (!it.material_ids) return false;
    const ids = it.material_ids.split(",");
    return ids.includes(String(m.id));
  });

  return (
    <div
      className={`
        relative bg-white rounded-[1.5rem] p-6 flex gap-4 items-start overflow-hidden h-full flex-col
        ${now 
          ? "shadow-lg border-2 border-[#00c2e8] z-10" 
          : "shadow-sm border border-slate-50"}
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
                  className="mt-2 flex items-center gap-1 text-xs font-bold text-[#00c2e8]"
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

          {/* ★修正: アイコン自動判定を適用 */}
          {linkedMaterials.length > 0 && (
            <div className="flex flex-col gap-1 mb-4 mt-1">
              {linkedMaterials.map((m) => {
                const { icon: Icon, color, border } = getMaterialInfo(m.url);
                return (
                  <a
                    key={m.id}
                    href={m.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-2 w-fit"
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${color}`} />
                    <span className={`text-xs font-bold ${color} border-b border-transparent ${border} transition-all truncate max-w-[200px]`}>
                      {m.title}
                    </span>
                  </a>
                );
              })}
            </div>
          )}

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