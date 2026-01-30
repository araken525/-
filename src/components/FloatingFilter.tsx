"use client";

import { useState } from "react";
import Link from "next/link";
import { Filter, X, Check, Tag, User, RotateCcw } from "lucide-react";

type Props = {
  slug: string;
  tags: string[];
  assignees: string[];
  selectedTags: string[];
};

export default function FloatingFilter({ slug, tags, assignees, selectedTags }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // タグのトグルロジック (URL生成用)
  const getNextUrl = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    
    if (newTags.length === 0) return `/e/${slug}`;
    return `/e/${slug}?t=${encodeURIComponent(newTags.join(","))}`;
  };

  const isActive = selectedTags.length > 0;

  return (
    <>
      {/* フローティングボタン (右下) */}
      <button
        onClick={() => setIsOpen(true)}
        className={`
          fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all active:scale-90
          ${isActive 
            ? "bg-[#00c2e8] text-white shadow-cyan-200/50" 
            : "bg-white text-slate-500 shadow-slate-200/50"}
        `}
      >
        <Filter className="w-6 h-6" />
        {isActive && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
            {selectedTags.length}
          </span>
        )}
      </button>

      {/* フィルターメニュー (モーダル) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
          {/* 背景 (クリックで閉じる) */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity pointer-events-auto"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* コンテンツ */}
          <div className="relative w-full max-w-md bg-white rounded-t-[2rem] shadow-2xl pointer-events-auto animate-in slide-in-from-bottom-10 duration-300 flex flex-col max-h-[85vh]">
            
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#00c2e8]" />
                <h3 className="text-lg font-black text-slate-800">表示を絞り込む</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 bg-slate-50 text-slate-400 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* スクロールエリア */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* 1. パート・グループ */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <Tag className="w-4 h-4" />
                  <span>パート・グループ</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <Link
                        key={tag}
                        href={getNextUrl(tag)}
                        scroll={false}
                        onClick={() => { if(window.innerWidth < 640) setIsOpen(false); }} // スマホなら閉じる(任意)
                        className={`
                          px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border
                          ${active 
                            ? "bg-cyan-50 border-cyan-200 text-[#00c2e8]" 
                            : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}
                        `}
                      >
                        {active && <Check className="w-4 h-4" />}
                        {tag}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* 2. 担当スタッフ (存在する場合のみ) */}
              {assignees.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <User className="w-4 h-4" />
                    <span>担当スタッフ</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assignees.map((staff) => {
                      const active = selectedTags.includes(staff);
                      return (
                        <Link
                          key={staff}
                          href={getNextUrl(staff)}
                          scroll={false}
                          className={`
                            px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border
                            ${active 
                              ? "bg-indigo-50 border-indigo-200 text-indigo-500" 
                              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}
                          `}
                        >
                          {active && <Check className="w-4 h-4" />}
                          {staff}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* フッター (クリアボタン) */}
            {isActive && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-[2rem]">
                <Link
                  href={`/e/${slug}`}
                  scroll={false}
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  絞り込みを解除してすべて表示
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}