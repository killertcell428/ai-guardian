"use client";

import Link from "next/link";
import clsx from "clsx";
import { useLanguage } from "@/contexts/LanguageContext";
import { t, tx } from "@/lib/translations";

export default function PricingSection() {
  const { lang } = useLanguage();
  const ja = lang === "ja";

  const PLANS = [
    {
      name: tx(t.pricing.starter.name, lang),
      price: ja ? "¥2,000" : "$15",
      period: tx(t.pricing.starter.period, lang),
      tagline: tx(t.pricing.starter.tagline, lang),
      features: [
        tx(t.pricing.starter.f1, lang),
        tx(t.pricing.starter.f2, lang),
        tx(t.pricing.starter.f3, lang),
        tx(t.pricing.starter.f4, lang),
        tx(t.pricing.starter.f5, lang),
        tx(t.pricing.starter.f6, lang),
      ],
      cta: tx(t.pricing.starter.cta, lang),
      ctaHref: "/docs/quickstart",
      highlight: false,
    },
    {
      name: tx(t.pricing.business.name, lang),
      price: ja ? "¥5,000" : "$38",
      period: tx(t.pricing.business.period, lang),
      tagline: tx(t.pricing.business.tagline, lang),
      features: [
        tx(t.pricing.business.f1, lang),
        tx(t.pricing.business.f2, lang),
        tx(t.pricing.business.f3, lang),
        tx(t.pricing.business.f4, lang),
        tx(t.pricing.business.f5, lang),
        tx(t.pricing.business.f6, lang),
        tx(t.pricing.business.f7, lang),
      ],
      cta: tx(t.pricing.business.cta, lang),
      ctaHref: "/docs/quickstart",
      highlight: true,
      badge: tx(t.pricing.business.badge, lang),
    },
    {
      name: tx(t.pricing.enterprise.name, lang),
      price: ja ? "要相談" : "Custom",
      period: tx(t.pricing.enterprise.period, lang),
      tagline: tx(t.pricing.enterprise.tagline, lang),
      features: [
        tx(t.pricing.enterprise.f1, lang),
        tx(t.pricing.enterprise.f2, lang),
        tx(t.pricing.enterprise.f3, lang),
        tx(t.pricing.enterprise.f4, lang),
        tx(t.pricing.enterprise.f5, lang),
        tx(t.pricing.enterprise.f6, lang),
      ],
      cta: tx(t.pricing.enterprise.cta, lang),
      ctaHref: "mailto:ueda.bioinfo.base01@gmail.com",
      highlight: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-guardian-600 text-sm font-semibold uppercase tracking-widest mb-3">
            {tx(t.pricing.label, lang)}
          </p>
          <h2 className="section-heading">{tx(t.pricing.heading, lang)}</h2>
          <p className="section-subheading">{tx(t.pricing.sub, lang)}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto items-start">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={clsx(
                "rounded-2xl border p-8 relative",
                plan.highlight
                  ? "bg-guardian-600 border-guardian-500 text-white shadow-xl shadow-guardian-200 scale-105"
                  : "bg-white border-gray-200"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-guardian-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={clsx("text-xl font-bold mb-1", plan.highlight ? "text-white" : "text-gray-900")}>
                  {plan.name}
                </h3>
                <p className={clsx("text-sm", plan.highlight ? "text-guardian-200" : "text-gray-500")}>
                  {plan.tagline}
                </p>
              </div>

              <div className="mb-6">
                <span className={clsx("text-4xl font-extrabold", plan.highlight ? "text-white" : "text-gray-900")}>
                  {plan.price}
                </span>
                <span className={clsx("text-sm ml-2", plan.highlight ? "text-guardian-200" : "text-gray-500")}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <span className={plan.highlight ? "text-guardian-200" : "text-guardian-600"}>✓</span>
                    <span className={plan.highlight ? "text-guardian-100" : "text-gray-700"}>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={clsx(
                  "block w-full text-center py-2.5 rounded-lg font-semibold text-sm transition-colors",
                  plan.highlight
                    ? "bg-white text-guardian-700 hover:bg-guardian-50"
                    : "btn-primary"
                )}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* 3-Layer Value Proposition */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-3">
            {ja ? "3層の価値で、導入から定着まで" : "Three layers of value, from adoption to retention"}
          </h3>
          <p className="text-center text-gray-500 mb-10 max-w-xl mx-auto text-sm">
            {ja
              ? "議事録で入り口を開き、意思決定追跡で差別化し、ナレッジ基盤で定着する"
              : "Start with meeting notes, differentiate with decision tracking, retain with knowledge base"}
          </p>
          <div className="space-y-4">
            <ValueLayer
              number="1"
              title={ja ? "セキュア議事録" : "Secure Meeting Notes"}
              desc={ja
                ? "ai-guardian内蔵のエンドツーエンド暗号化議事録。PII自動マスキング、業界別コンプライアンス対応。既存ツールより安全なAI議事録で導入のドアを開く。"
                : "End-to-end encrypted meeting notes powered by ai-guardian. Auto PII masking, industry compliance. Open the door with safer AI meeting notes."}
              plan="Starter"
              color="bg-guardian-50 border-guardian-200"
            />
            <ValueLayer
              number="2"
              title={ja ? "意思決定追跡" : "Decision Tracking"}
              desc={ja
                ? "誰が・いつ・なぜ決めたかを自動記録。アクションアイテムの抽出と履行追跡。会議間の意思決定フローを可視化し。競合にない価値で定着を図る。"
                : "Auto-track who decided what, when, and why. Extract and follow up on action items. Visualize decision flows across meetings."}
              plan="Business"
              color="bg-blue-50 border-blue-200"
            />
            <ValueLayer
              number="3"
              title={ja ? "組織ナレッジ基盤" : "Organization Knowledge Base"}
              desc={ja
                ? "会議の集合知を検索可能なナレッジグラフに。新メンバーのオンボーディング支援、組織の意思決定パターン分析。使うほどデータが蓄積され、組織の競争力になる。"
                : "Turn collective meeting intelligence into a searchable knowledge graph. Support onboarding, analyze organizational decision patterns."}
              plan="Enterprise"
              color="bg-purple-50 border-purple-200"
            />
          </div>
        </div>

        {/* Target Industries */}
        <div className="mt-20 max-w-4xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {ja ? "規制産業に最適化" : "Optimized for Regulated Industries"}
          </h3>
          <p className="text-gray-500 mb-8 text-sm max-w-xl mx-auto">
            {ja
              ? "情シス部門がGOを出せるセキュリティ。業界別のコンプライアンス要件に対応。"
              : "Security that IT departments can approve. Industry-specific compliance built in."}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: "🏦", label: ja ? "金融" : "Finance", sub: ja ? "SOC2 / FISC" : "SOC2 / FISC" },
              { icon: "🏥", label: ja ? "ヘルスケア" : "Healthcare", sub: ja ? "HIPAA対応" : "HIPAA ready" },
              { icon: "🏛️", label: ja ? "政府・自治体" : "Government", sub: ja ? "ISMAP準拠" : "ISMAP aligned" },
              { icon: "🏭", label: ja ? "製造業" : "Manufacturing", sub: ja ? "IP保護" : "IP protection" },
              { icon: "⚦️", label: ja ? "法律" : "Legal", sub: ja ? "守秘義務対応" : "Confidentiality" },
            ].map((industry) => (
              <div key={industry.label} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">{industry.icon}</div>
                <div className="font-semibold text-gray-900 text-sm">{industry.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{industry.sub}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-gray-400 mt-10">
          {tx(t.pricing.footnote, lang)}
        </p>
      </div>
    </section>
  );
}

function ValueLayer({
  number,
  title,
  desc,
  plan,
  color,
}: {
  number: string;
  title: string;
  desc: string;
  plan: string;
  color: string;
}) {
  return (
    <div className={`border rounded-xl p-6 ${color} flex gap-5 items-start`}>
      <div className="w-10 h-10 rounded-full bg-guardian-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h4 className="font-bold text-gray-900">{title}</h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-300 text-gray-600 font-medium">
            {plan}+
          </span>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
