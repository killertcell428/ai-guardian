"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { t, tx } from "@/lib/translations";

export default function FeaturesSection() {
  const { lang } = useLanguage();

  const features = [
    { mark: "LLM01", title: tx(t.features.f1Title, lang), desc: tx(t.features.f1Desc, lang), tag: "Input · OWASP LLM01", tagColor: "bg-red-50 text-red-700 border border-red-200" },
    { mark: "LLM02", title: tx(t.features.f2Title, lang), desc: tx(t.features.f2Desc, lang), tag: "Output · OWASP LLM02", tagColor: "bg-orange-50 text-orange-700 border border-orange-200" },
    { mark: "SQL",   title: tx(t.features.f3Title, lang), desc: tx(t.features.f3Desc, lang), tag: "Input · CWE-89", tagColor: "bg-red-50 text-red-700 border border-red-200" },
    { mark: "HitL",  title: tx(t.features.f4Title, lang), desc: tx(t.features.f4Desc, lang), tag: lang === "ja" ? "コア · デフォルトSLA 30分" : "Core · 30-min default SLA", tagColor: "bg-guardian-50 text-guardian-700 border border-guardian-200" },
    { mark: "POL",   title: tx(t.features.f5Title, lang), desc: tx(t.features.f5Desc, lang), tag: lang === "ja" ? "設定" : "Configuration", tagColor: "bg-purple-50 text-purple-700 border border-purple-200" },
    { mark: "AUD",   title: tx(t.features.f6Title, lang), desc: tx(t.features.f6Desc, lang), tag: lang === "ja" ? "コンプライアンス · SOC2対応" : "Compliance · SOC2 ready", tagColor: "bg-green-50 text-green-700 border border-green-200" },
  ];

  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-guardian-600 text-sm font-semibold uppercase tracking-widest mb-3">{tx(t.features.label, lang)}</p>
          <h2 className="section-heading">{tx(t.features.heading, lang)}</h2>
          <p className="section-subheading">{tx(t.features.sub, lang)}</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.mark} className="card hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-mono font-bold text-guardian-500 bg-guardian-50 border border-guardian-200 rounded px-2 py-0.5">
                  {f.mark}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${f.tagColor}`}>{f.tag}</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-2 group-hover:text-guardian-600 transition-colors text-[15px] leading-snug">{f.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-10">{tx(t.features.footnote, lang)}</p>
      </div>
    </section>
  );
}
