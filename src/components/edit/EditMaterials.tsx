"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
// ▼ ChevronDown, ChevronUp を追加
import { AlertCircle, Plus, Phone, Trash2, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  eventId: string;
  contacts: any[];
  setContacts: (contacts: any[]) => void;
  setStatus: (s: string) => void;
};

export default function EditEmergencyContacts({ eventId, contacts, setContacts, setStatus }: Props) {
  const [contactForm, setContactForm] = useState({ role: "", name: "", tel: "" });
  const [contactLoading, setContactLoading] = useState(false);
  
  // ★追加: 開閉状態 (デフォルトは閉じる)
  const [isOpen, setIsOpen] = useState(false);

  async function addContact() {
    if (!contactForm.name || !contactForm.tel) return;
    setContactLoading(true);
    const newContacts = [...contacts, contactForm];
    const { error } = await supabase.from("events").update({ emergency_contacts: newContacts }).eq("id", eventId);
    setContactLoading(false);
    if(error) {
      setStatus("エラー: " + error.message);
    } else {
      setContacts(newContacts);
      setContactForm({ role: "", name: "", tel: "" });
      setStatus("連絡先を追加しました");
      setTimeout(() => setStatus(""), 2000);
    }
  }

  async function removeContact(index: number) {
    if (!confirm("削除しますか？")) return;
    setContactLoading(true);
    const newContacts = contacts.filter((_, i) => i !== index);
    const { error } = await supabase.from("events").update({ emergency_contacts: newContacts }).eq("id", eventId);
    setContactLoading(false);
    if(error) {
      setStatus("エラー: " + error.message);
    } else {
      setContacts(newContacts);
    }
  }

  return (
    <section className="bg-white rounded-[1.5rem] shadow-sm border border-slate-50 overflow-hidden">
       {/* ▼ ヘッダーをクリック可能に変更 */}
       <button 
         onClick={() => setIsOpen(!isOpen)}
         className="w-full p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100 transition-colors"
       >
          <div className="flex items-center gap-2">
             <AlertCircle className="w-4 h-4 text-red-500" />
             <h3 className="text-sm font-black text-slate-700">緊急連絡先</h3>
          </div>
          <div className="flex items-center gap-2">
             <div className="text-[10px] font-bold text-slate-400">{contacts.length}件</div>
             {/* 矢印アイコン */}
             {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400"/> : <ChevronDown className="w-4 h-4 text-slate-400"/>}
          </div>
       </button>

       {/* ▼ 開閉エリア */}
       <div className={`transition-all duration-300 ease-in-out ${isOpen ? "block" : "hidden"}`}>
          <div className="p-4 bg-white space-y-3">
             <div className="grid grid-cols-12 gap-2">
                <input type="text" value={contactForm.role} onChange={e => setContactForm({...contactForm, role: e.target.value})} placeholder="役割 (例: 舞台)" className="col-span-3 h-10 px-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-100"/>
                <input type="text" value={contactForm.name} onChange={e => setContactForm({...contactForm, name: e.target.value})} placeholder="名前 (例: 田中)" className="col-span-4 h-10 px-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-100"/>
                <input type="text" value={contactForm.tel} onChange={e => setContactForm({...contactForm, tel: e.target.value})} placeholder="番号 (090...)" className="col-span-5 h-10 px-3 bg-slate-50 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-100"/>
             </div>
             <button onClick={addContact} disabled={!contactForm.name || !contactForm.tel || contactLoading} className="w-full h-10 bg-red-50 text-red-500 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-red-100 disabled:opacity-50 transition-all">
                {contactLoading ? "追加中..." : <><Plus className="w-3.5 h-3.5" /> 連絡先を追加</>}
             </button>
          </div>

          <div className="bg-slate-50/50 p-2 space-y-1 border-t border-slate-100 min-h-[50px]">
             {contacts.length > 0 ? contacts.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-red-50 text-red-500"><Phone className="w-4 h-4"/></div>
                      <div>
                         <div className="text-[10px] text-slate-400 font-bold">{c.role}</div>
                         <div className="text-xs font-black text-slate-700">{c.name} <span className="font-normal text-slate-400 text-[10px] ml-1">{c.tel}</span></div>
                      </div>
                   </div>
                   <button onClick={() => removeContact(i)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                </div>
             )) : (
                <div className="text-center py-4 text-xs font-bold text-slate-300">連絡先がありません</div>
             )}
          </div>
       </div>
    </section>
  );
}