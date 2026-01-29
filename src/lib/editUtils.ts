import { Youtube, Video, FileText, Image as ImageIcon, Link2 } from "lucide-react";

export const EMOJI_PRESETS = ["🎵", "🎻", "🍱", "🎤", "🚌", "🚽", "🚬", "☕", "🍻", "🏨", "🎫", "✨", "🧹", "🚩"];

export function hhmm(t: string) { return String(t).slice(0, 5); }

export function getDuration(start: string, end?: string | null) {
  if (!end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diffMin = (eh * 60 + em) - (sh * 60 + sm);
  if (diffMin <= 0) return null;
  const h = Math.floor(diffMin / 60);
  const m = diffMin % 60;
  
  if (h === 0) return `${m}分`;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
}

export function detectEmoji(title: string) {
  const t = title.toLowerCase();
  if (t.includes("休憩") || t.includes("昼") || t.includes("ランチ") || t.includes("ご飯")) return "🍱";
  if (t.includes("リハ") || t.includes("練習") || t.includes("合わせ") || t.includes("gp")) return "🎻";
  if (t.includes("開場") || t.includes("受付")) return "🎫";
  if (t.includes("開演") || t.includes("本番") || t.includes("ステージ")) return "✨";
  if (t.includes("終演") || t.includes("片付け") || t.includes("撤収")) return "🧹";
  if (t.includes("移動")) return "🚌";
  if (t.includes("トイレ")) return "🚽";
  if (t.includes("喫煙") || t.includes("タバコ")) return "🚬";
  if (t.includes("乾杯") || t.includes("打ち上げ") || t.includes("飲み")) return "🍻";
  if (t.includes("ホテル") || t.includes("宿")) return "🏨";
  return "🎵";
}

export function getTargetColor(t: string) {
  if (!t || t === "all" || t === "全員") return "bg-slate-100 text-slate-500";
  return "bg-cyan-50 text-[#00c2e8]";
}

export function getMaterialInfo(url: string) {
  const u = url.toLowerCase();
  const style = { color: "text-[#00c2e8]", bg: "bg-cyan-50" };
  if (u.includes("youtube") || u.includes("youtu.be")) return { icon: Youtube, ...style, label: "YouTube" };
  if (u.endsWith(".mp4") || u.endsWith(".mov") || u.includes("vimeo")) return { icon: Video, ...style, label: "Video" };
  if (u.endsWith(".pdf")) return { icon: FileText, ...style, label: "PDF" };
  if (u.match(/\.(jpg|jpeg|png|gif|webp)$/)) return { icon: ImageIcon, ...style, label: "Image" };
  return { icon: Link2, ...style, label: "Link" };
}