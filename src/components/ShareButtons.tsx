"use client";

import { useEffect, useMemo, useState } from "react";

type Tab = { key: string; label: string };

export default function ShareButtons({
  slug,
  currentKey,
  tabs,
}: {
  slug: string;
  currentKey: string;
  tabs: Tab[];
}) {
  const [copied, setCopied] = useState("");

  const base = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.origin;
  }, []);

  function buildUrl(key: string) {
    const path = `/e/${slug}`;
    if (key === "all") return `${base}${path}`;
    return `${base}${path}?t=${encodeURIComponent(key)}`;
  }

  async function copyCurrent() {
    try {
      const url = buildUrl(currentKey);
      await navigator.clipboard.writeText(url);
      setCopied("コピーしました");
    } catch {
      setCopied("コピー失敗（ブラウザ権限）");
    }
  }

  async function copyKey(key: string) {
    try {
      const url = buildUrl(key);
      await navigator.clipboard.writeText(url);
      setCopied(`「${tabs.find((t) => t.key === key)?.label ?? key}」のURLをコピーしました`);
    } catch {
      setCopied("コピー失敗（ブラウザ権限）");
    }
  }

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(""), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
        display: "grid",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ fontWeight: 800 }}>共有</div>
        <button
          onClick={copyCurrent}
          style={{
            marginLeft: "auto",
            padding: "8px 12px",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.15)",
            background: "#fff",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          今の表示URLをコピー
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => copyKey(t.key)}
            style={{
              padding: "6px 10px",
              borderRadius: 999,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            {t.label}URL
          </button>
        ))}
      </div>

      {copied && (
        <div style={{ fontSize: 12, opacity: 0.75 }}>{copied}</div>
      )}
    </div>
  );
}