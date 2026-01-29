"use client";

import { useState } from "react";
import { 
  Clock, MapPin, ChevronDown, ChevronUp, Link2, 
  Youtube, Video, FileText, Image as ImageIcon, 
  User, Hourglass, StickyNote, Paperclip 
} from "lucide-react";

type ScheduleItemCardProps = {
  it: any;
  now: boolean;
  emoji: string;
  duration: string | null;
  startHhmm: string;
  endHhmm: string | null;
  materials: any[];
};

function getMaterialIcon(url: string) {
  const u = url.toLowerCase();
  if (u.includes("youtube") || u.includes("youtu.be")) return Youtube;
  if (u.endsWith(".mp4") || u.endsWith(".mov") || u.includes("vimeo")) return Video;
  if (u.endsWith(".pdf")) return FileText;
  if (u.match(/\.(jpg|jpeg|png|gif|webp)$/)) return ImageIcon;
  return Link2;
}

export default function ScheduleItemCard({
  it,
  now,
  emoji,
  duration,
  startHhmm,
  endHhmm,
  materials,
}: ScheduleItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // メモが長いかどうかの判定 (60文字以上 or 3行以上)
  const hasLongNote = it.note && (it.note.length > 60 || it.note.split("\n").length > 2);

  const linkedMaterials = materials.filter((m) => {
    if (!it.material_ids) return false;
    const ids = it.material_ids.split(",");
    return ids.includes(String(m.id));
  });

  const targets = (!it.target || it.target === "all" || it.target === "全員")
    ? ["全員"]
    : it.target.split(",").map((t: string) => t.trim());

  const assignees = it.assignee
    ? it.assignee.split(",").map((a: string) => a.trim())
    : [];

  return (
    <div
      className={`
        relative bg-white rounded-[1.5rem] p-6 flex gap-4 items-start overflow-hidden h-full flex-col
        ${now 
          ? "shadow-lg border-2 border-[#00c2e8] z-10" 
          : "shadow-sm border border-slate-50"}
      `}
    >
      {/* NOWバッジ */}
      {now && (
        <div className="absolute -top-3 -left-2 bg-[#00c2e8] text-white px-3 py-1 rounded-full text-[10px] font-black shadow-md border-2 border-white z-20">
          NOW
        </div>
      )}

      {/* 背景の透かし文字 (開始時間) */}
      <div className="absolute -bottom-4 -right-2 text-[5rem] font-black text-slate-50/80 select-none watermark-text leading-none z-0 pointer-events-none">
        {startHhmm}
      </div>

      <div className="relative z-10 flex items-start gap-4 w-full">
        {/* 左側: 絵文字 */}
        <div className="shrink-0 text-[3rem] leading-none drop-shadow-sm filter grayscale-[0.1]">
          {emoji}
        </div>

        {/* 右側: 情報エリア */}
        <div className="flex-1 min-w-0 flex flex-col h-full space-y-2">
          
          {/* 1. タイトル */}
          <h3 className={`text-xl font-black leading-tight tracking-tight ${now ? "text-[#00c2e8]" : "text-slate-900"}`}>
            {it.title}
          </h3>

          {/* 2. 終了時間 (グレー) */}
          {endHhmm && (
            <div className="flex items-center text-xs font-bold text-slate-500">
              <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
              <span>~{endHhmm} まで</span>
            </div>
          )}

          {/* 3. タグ (色付きバッジ) */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {targets.map((tag: string, i: number) => {
              const isAll = tag === "全員";
              // "全員"以外はシアン色、"全員"はグレー
              const colorClass = isAll ? "bg-slate-100 text-slate-500" : "bg-cyan-50 text-[#00c2e8]";
              return (
                <span key={`target-${i}`} className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black ${colorClass}`}>
                  {tag}
                </span>
              );
            })}
          </div>

          {/* 4. メモ (グレー・アイコン・開閉あり) */}
          {it.note && (
            <div className="pt-1">
              <div className="flex items-start gap-1.5 text-sm text-slate-500 font-medium">
                <StickyNote className="w-3.5 h-3.5 shrink-0 mt-1 text-slate-400" />
                <div className={`leading-relaxed whitespace-pre-wrap break-words ${!isExpanded ? "line-clamp-2" : ""}`}>
                  {it.note}
                </div>
              </div>
              {hasLongNote && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="ml-5 mt-1 flex items-center gap-1 text-xs font-bold text-[#00c2e8] hover:underline"
                >
                  {isExpanded ? (
                    <><ChevronUp className="w-3 h-3" /> 閉じる</>
                  ) : (
                    <><ChevronDown className="w-3 h-3" /> もっと見る</>
                  )}
                </button>
              )}
            </div>
          )}

          {/* 5. 担当スタッフ (グレー・アイコン・カンマ区切り) */}
          {assignees.length > 0 && (
            <div className="flex items-start gap-1.5 pt-1 text-xs text-slate-500 font-medium">
              <User className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
              <span className="leading-relaxed">
                {assignees.join(", ")}
              </span>
            </div>
          )}

          {/* 6. フッター情報 (場所・添付・時間) */}
          <div className="flex flex-wrap items-center gap-4 pt-3 mt-2 border-t border-slate-50 text-xs font-bold text-slate-400">
            {/* 場所 */}
            {it.location && (
              <div className="flex items-center gap-1 text-slate-500 max-w-[40%] truncate">
                <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                <span className="truncate">{it.location}</span>
              </div>
            )}

            {/* 添付ファイル (リンク) */}
            {linkedMaterials.length > 0 && linkedMaterials.map((m) => {
               const Icon = getMaterialIcon(m.url);
               return (
                 <a 
                   key={m.id} 
                   href={m.url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="flex items-center gap-1 text-[#00c2e8] hover:opacity-70 transition-opacity max-w-[30%] truncate"
                 >
                   <Icon className="w-3.5 h-3.5 shrink-0"/>
                   <span className="truncate">{m.title}</span>
                 </a>
               );
            })}

            {/* 所要時間 */}
            {duration && (
              <div className="flex items-center gap-1 ml-auto">
                <Hourglass className="w-3.5 h-3.5 text-slate-300" />
                {duration}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}