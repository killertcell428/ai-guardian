"use client";

import PricingSection from "@/components/PricingSection";
import { useLanguage } from "@/contexts/LanguageContext";

const COMPARISON_ROWS_EN = [
  { feature: "Reviewer seats", values: ["1", "Unlimited", "Unlimited"] },
  { feature: "Requests / month", values: ["10K", "500K", "Unlimited"] },
  { feature: "Built-in threat rules", values: [true, true, true] },
  { feature: "Custom policy rules", values: [false, true, true] },
  { feature: "Audit logs", values: [true, true, true] },
  { feature: "Webhook alerts", values: [false, true, true] },
  { feature: "CSV export", values: [false, true, true] },
  { feature: "Priority support", values: [false, "24h SLA", "Dedicated"] },
  { feature: "SSO / SAML", values: [false, false, true] },
  { feature: "On-premises deployment", values: [false, false, true] },
  { feature: "SLA guarantee", values: [false, false, "Custom"] },
  { feature: "SOC2 / GDPR DPA", values: [false, false, true] },
];

const COMPARISON_ROWS_JA = [
  { feature: "レビュアー席数", values: ["1名", "無制限", "無制限"] },
  { feature: "月間リクエスト数", values: ["1万", "50万", "無制限"] },
  { feature: "組み込み脅威ルール", values: [true, true, true] },
  { feature: "カスタムポリシールール", values: [false, true, true] },
  { feature: "監査ログ", values: [true, true, true] },
  { feature: "Webhookアラート", values: [false, true, true] },
  { feature: "CSVエクスポート", values: [false, true, true] },
  { feature: "優先サポート", values: [false, "24時間SLA", "専任担当"] },
  { feature: "SSO / SAML", values: [false, false, true] },
  { feature: "オンプレミス対応", values: [false, false, true] },
  { feature: "SLA保証", values: [false, false, "カスタム"] },
  { feature: "SOC2 / GDPR DPA", values: [false, false, true] },
];

const PLAN_NAMES = ["Free", "Pro", "Enterprise"];

export default function PricingPage() {
  const { lang } = useLanguage();
  const ja = lang === "ja";
  const rows = ja ? COMPARISON_ROWS_JA : COMPARISON_ROWS_EN;

  return (
    <>
      {/* Page header */}
      <div className="bg-gray-950 text-white py-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">
          {ja ? "料金プラン" : "Pricing"}
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          {ja ? "無料スタート。成長に合わせてスケール。いつでも解約できます。" : "Start free. Pay as you grow. Cancel anytime."}
        </p>
      </div>

      <PricingSection />

      {/* Comparison table */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            {ja ? "プラン別機能比較" : "Full Feature Comparison"}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    {ja ? "機能" : "Feature"}
                  </th>
                  {PLAN_NAMES.map((name) => (
                    <th key={name} className="text-center py-3 px-4 font-bold text-gray-900">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.feature} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-700">{row.feature}</td>
                    {row.values.map((val, i) => (
                      <td key={i} className="py-3 px-4 text-center text-gray-600">
                        {val === true ? <span className="text-green-600 font-bold">✓</span>
                          : val === false ? <span className="text-gray-300">—</span>
                          : val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="py-16 bg-gray-50 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {ja ? "カスタムプランが必要ですか？" : "Need something custom?"}
        </h2>
        <p className="text-gray-500 mb-6 max-w-lg mx-auto">
          {ja
            ? "オンプレミス対応・コンプライアンス要件・カスタム契約など、エンタープライズチームのご要望に対応します。"
            : "We work with enterprise teams on custom contracts, on-premises deployments, and compliance requirements."}
        </p>
        <a href="mailto:ueda.bioinfo.base01@gmail.com" className="btn-primary px-8 py-3">
          {ja ? "営業チームに問い合わせる" : "Contact Sales"}
        </a>
      </section>
    </>
  );
}
