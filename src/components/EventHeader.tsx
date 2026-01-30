"use client";

import { useState, useEffect } from "react";
import { Phone, X } from "lucide-react";

type Props = {
  title: string;
  slug: string;
  emergencyContacts?: { name: string, tel: string, role: string }[];
};

export default function EventHeader({ title, emergencyContacts = [] }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const hasContacts = emergencyContacts.length > 0;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const btnBase = "w-9 h-9 flex shrink-0 items-center justify-center rounded-full shadow-sm active:scale-95 transition-all relative z-10 border pointer-events-auto";
  const emergencyBtnStyle = scrolled
    ? "bg-red-50 text-red-500 border-red-100"
    : "bg-red-500/80 backdrop-blur-md text-white border-transparent";

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-4 transition-all duration-500 gap-4
          ${scrolled ? "bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm" : "bg-transparent pointer-events-none"}
        `}
      >
        <h1 
          className={`flex-1 text-sm font-black truncate transition-all duration-500 pointer-events-auto min-w-0
            ${scrolled ? "opacity-100 translate-y-0 text-slate-800" : "opacity-0 -translate-y-2"}
          `}
        >
          {title}
        </h1>
        
        {hasContacts && (
          <div className="ml-auto pointer-events-auto">
             <button onClick={() => setShowContact(true)} className={`${btnBase} ${emergencyBtnStyle}`} title="緊急連絡先">
              <Phone className="w-4 h-4" />
            </button>
          </div>
        )}
      </header>

      {/* --- 緊急連絡先モーダル --- */}
      {showContact && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => setShowContact(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col items-center border border-slate-100">
             <button onClick={() => setShowContact(false)} className="absolute top-4 right-4 p-2 text-slate-400 bg-slate-50 rounded-full transition-colors">
               <X className="w-5 h-5" />
             </button>

             <div className="text-center mb-6 mt-2">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Phone className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800">緊急連絡先</h3>
                <p className="text-xs text-slate-400 mt-1">タップして発信できます</p>
             </div>
             
             <div className="space-y-3 w-full">
               {emergencyContacts.map((c, i) => (
                 <a key={i} href={`tel:${c.tel}`} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 transition-colors group">
                    <div>
                       <div className="text-xs font-bold text-slate-400 mb-0.5">{c.role}</div>
                       <div className="text-lg font-black text-slate-800 group-hover:text-red-600">{c.name}</div>
                    </div>
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm text-slate-300 group-hover:text-red-500">
                       <Phone className="w-5 h-5" />
                    </div>
                 </a>
               ))}
             </div>
          </div>
        </div>
      )}
    </>
  );
}