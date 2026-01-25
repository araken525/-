"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function EventQRCode({ url }: { url: string }) {
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    // ブラウザ上でQRコードを生成
    QRCode.toDataURL(url, { margin: 2, width: 100, color: { dark: "#000000", light: "#00000000" } })
      .then(setSrc)
      .catch((err) => console.error("QR Gen Error:", err));
  }, [url]);

  // 生成中はプレースホルダーを表示
  if (!src) return <div className="w-24 h-24 bg-slate-100 rounded animate-pulse" />;

  return (
    <img src={src} alt="QR Code" className="w-24 h-24 border border-slate-200 rounded p-1" />
  );
}