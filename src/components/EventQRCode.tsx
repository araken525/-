"use client";

import { useEffect, useState } from "react";
// ❌ ここでの import QRCode ... は削除します（これがサーバーエラーの原因）

export default function EventQRCode({ url }: { url: string }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    // ⭕️ ここでライブラリを読み込む（ブラウザだけで動く）
    import("qrcode").then((QRCode) => {
      QRCode.toDataURL(url, { margin: 2, width: 100, color: { dark: "#000000", light: "#00000000" } })
        .then(setSrc)
        .catch((err) => console.error("QR Error:", err));
    });
  }, [url]);

  if (!src) return <div className="w-24 h-24 bg-slate-100 rounded animate-pulse" />;

  return (
    <img src={src} alt="QR Code" className="w-24 h-24 border border-slate-200 rounded p-1" />
  );
}