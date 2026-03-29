"use client";

import Link from "next/link";
import clsx from "clsx";
import { useLanguage } from "@/contexts/LanguageContext";
import { t, tx } from "@/lib/translations";

export default function PricingSection() {
  const { lang } = useLanguage();

  const PLANS = [
    {
      name: tx(t.pricing.free.name, lang),
      price: "$0",
      period: tx(t.pricing.free.period, lang),
      tagline: tx(t.pricing.free.tagline, lang),
      features: [
        tx(t.pricing.free.f1, lang),
        tx(t.pricing.free.f2, lang),
        tx(t.pricing.free.f3, lang),
        tx(t.pricing.free.f4, lang),
        tx(t.pricing.free.f5, lang),
      ],
      cta: tx(t.pricing.free.cta, lang),
      ctaHref: "/docs/quickstart",
      highlight: false,
    },
    {
      name: tx(t.pricing.pro.name, lang),
      price: "$49",
      period: tx(t.pricing.pro.period, lang),
      tagline: tx(t.pricing.pro.tagline, lang),
      features: [
        tx(t.pricing.pro.f1, lang),
        tx(t.pricing.pro.f2, lang),
        tx(t.pricing.pro.f3, lang),
        tx(t.pricing.pro.f4, lang),
        tx(t.pricing.pro.f5, lang),
        tx(t.pricing.pro.f6, lang),
      ],
      cta: tx(t.pricing.pro.cta, lang),
      ctaHref: "/docs/quickstart",
      highlight: true,
      badge: tx(t.pricing.pro.badge, lang),
    },
    {
      name: tx(t.pricing.enterprise.name, lang),
      price: lang === "ja" ? "要相談" : "Custom",
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

        <p className="text-center text-sm text-gray-400 mt-10">
          {tx(t.pricing.footnote, lang)}
        </p>
      </div>
    </section>
  );
}
