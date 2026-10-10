"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleAlert } from "lucide-react";
import { WinlaMark } from "@/components/winlaos/brand";

const stepLabels = ["Business details", "Your focus", "Review"];
const focusOptions = ["Customer conversations", "Sales and payments", "Products and stock", "Team coordination"];

export function SetupPreview() {
  const [step, setStep] = useState(0);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [focus, setFocus] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState("");

  function next() {
    setError("");
    if (step === 0 && (!businessName.trim() || !businessType)) { setError("Add your business name and type to continue."); return; }
    if (step === 1 && focus.length === 0) { setError("Choose at least one area to focus on."); return; }
    if (step < 2) setStep(step + 1); else setComplete(true);
  }

  return <main className="winla-page min-h-screen bg-[#faf9f5] px-5 py-6 text-[#173b32] sm:px-8"><header className="mx-auto flex max-w-5xl items-center justify-between"><WinlaMark/><Link href="/winlaos/preview" className="inline-flex items-center gap-2 text-sm text-[#647269]"><ArrowLeft size={15}/> Exit setup preview</Link></header><section className="mx-auto max-w-2xl pb-16 pt-12 sm:pt-16"><div className="flex items-center justify-between"><p className="winla-eyebrow">Workspace setup · UI preview</p><span className="rounded-full bg-[#f3e9de] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#906349]">Not saved</span></div><h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{complete ? "Your setup preview is complete" : "Let’s make this yours."}</h1><p className="mt-3 text-sm leading-6 text-[#6c7a70]">{complete ? "The details below only exist in this browser session. Persistence and workspace creation are not connected." : "A few simple details help shape a workspace around your business."}</p><div className="mt-8 grid grid-cols-3 gap-2" aria-label={`Step ${step+1} of 3`}>{stepLabels.map((label,i)=><div key={label}><div className={`h-1.5 rounded-full ${i<=step||complete?"bg-[#6f9375]":"bg-[#e7e5dc]"}`}/><p className={`mt-2 text-[10px] ${i===step?"font-semibold text-[#375c43]":"text-[#8a948c]"}`}>{label}</p></div>)}</div>
      <div className="mt-8 rounded-[24px] border border-[#e6e3d9] bg-white p-5 shadow-[0_12px_32px_rgba(28,52,41,.05)] sm:p-8">
        {complete ? <div className="rounded-2xl bg-[#edf5eb] p-5"><span className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#4a7854]"><Check size={19}/></span><h2 className="mt-4 font-semibold">Looks good, {businessName}</h2><p className="mt-2 text-sm text-[#617367]">Focus areas: {focus.join(", ")}</p></div> : step===0 ? <div className="space-y-5"><div><label htmlFor="business-name" className="mb-2 block text-sm font-medium">Business or workspace name</label><input id="business-name" value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder="e.g. Lumwana Traders" className="winla-input"/></div><div><label htmlFor="business-type" className="mb-2 block text-sm font-medium">What kind of business is it?</label><select id="business-type" value={businessType} onChange={e=>setBusinessType(e.target.value)} className="winla-input"><option value="">Choose a business type</option>{["Retail & trade","Food & hospitality","Professional services","Health & wellness","Other"].map(x=><option key={x}>{x}</option>)}</select></div><div><label htmlFor="location" className="mb-2 block text-sm font-medium">City or town <span className="font-normal text-[#89938b]">(optional)</span></label><input id="location" placeholder="e.g. Lusaka" className="winla-input"/></div></div> : step===1 ? <fieldset><legend className="text-sm font-semibold">What would you like to bring together first?</legend><p className="mt-1 text-xs text-[#7a867d]">Choose one or more. You can change this later.</p><div className="mt-5 space-y-2">{focusOptions.map(option=><label key={option} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#e8e6de] p-4 text-sm transition hover:bg-[#fbfaf6]"><input type="checkbox" checked={focus.includes(option)} onChange={e=>setFocus(e.target.checked?[...focus,option]:focus.filter(x=>x!==option))} className="h-4 w-4 accent-[#315c42]"/>{option}</label>)}</div></fieldset> : <div><h2 className="text-sm font-semibold">Review your workspace details</h2><dl className="mt-4 divide-y divide-[#efede6] rounded-xl border border-[#ebe9e1] px-4">{[["Workspace",businessName],["Business type",businessType],["Focus areas",focus.join(", ")]].map(([term,definition])=><div key={term} className="grid gap-1 py-3 sm:grid-cols-[140px_1fr]"><dt className="text-xs text-[#879188]">{term}</dt><dd className="text-sm">{definition}</dd></div>)}</dl><p className="mt-4 text-xs text-[#8a7560]">Completing this preview does not create an organization or save these details.</p></div>}
        {error&&<p role="alert" className="mt-5 flex items-center gap-2 text-sm text-red-700"><CircleAlert size={16}/>{error}</p>}
        <div className="mt-7 flex items-center justify-between border-t border-[#efede6] pt-5">{step>0&&!complete?<button onClick={()=>{setError("");setStep(step-1)}} className="rounded-lg px-3 py-2 text-sm text-[#67766b] hover:bg-[#f6f5ef]">Back</button>:<span/>}{!complete?<button onClick={next} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#173b32] px-5 text-sm font-semibold text-white">{step===2?"Finish preview":"Continue"}<ArrowRight size={15}/></button>:<button onClick={()=>{setComplete(false);setStep(0)}} className="rounded-lg px-3 py-2 text-sm font-medium text-[#a65435]">Start again</button>}</div>
      </div><p className="mt-5 text-center text-xs text-[#89938b]">UI-only prototype. No network request is sent and no data is stored.</p></section></main>;
}
