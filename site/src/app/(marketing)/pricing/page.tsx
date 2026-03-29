"use client";

import PricingSection from "@/components/PricingSection";
import { useLanguage } from "@/contexts/LanguageContext";

const COMPARISON_ROWS_EN = [
  { feature: "Users", values: ["Up to 10", "Unlimited", "Unlimited"] },
  { feature: "Meeting hours / month", values: ["30 hrs", "Unlimited", "Unlimited"] },
  { feature: "Secure meeting notes (AI)", values: [true, true, true] },
  { feature: "PII detection & masking", values: ["Basic", "Industry-specific", "Custom rules"] },
  { feature: "Decision tracking", values: [false, true, true] },
  { feature: "Action item extraction", values: [false, true, true] },
  { feature: "Organization knowledge base", values: [false, false, true] },
  { feature: "Data retention", values: ["90 days", "1 year", "Unlimited"] },
  { feature: "SSO / SAML", values: [false, true, true] },
  { feature: "Audit logs", values: ["Basic", "Detailed", "Custom"] },
  { feature: "Compliance reports", values: [false, "Standard", "Custom"] },
  { feature: "SLA guarantee", values: [false, "99.9%", "99.99%"] },
  { feature: "On-premises / VPC", values: [false, false, true] },
  { feature: "SOC2 / GDPR / HIPAA", values: [false, false, true] },
  { feature: "Support", values: ["Email", "Priority (Chat + Email)", "Dedicated CSM"] },
];

const COMPARISON_ROWS_JA = [
  { feature: "ユーザー数", values: ["最大10名", "無制限", "無制限"] },
  { feature: "月間会議時間", values: ["30時間", "無制限", "無制限"] },
  { feature: "セキュア議事録（AI）", values: [true, true, true] },
  { feature: "PII検出・マスキング", values: ["基本", "業界別ルール", "カスタムルール"] },
  { feature: "意思決定追跡", values: [false, true, true] },
  { feature: "アクションアイテム抽出", values: [false, true, true] },
  { feature: "組織ナレッジ基盤", values: [false, false, true] },
  { feature: "データ保持期間", values: ["90日", "1年", "無制限"] },
  { feature: "SSO / SAML", values: [false, true, true] },
  { feature: "監査ログ", values: ["基本", "詳細", "カスタム"] },
  { feature: "コンプライアンスレポート", values: [false, "標準", "カスタム"] },
  { feature: "SLA保証", values: [false, "99.9%", "99.99%"] },
  { feature: "オンプレミス / VPC", values: [false, false, true] },
  { feature: "SOC2 / GDPR / HIPAA", values: [false, false, true] },
  { feature: "サポート", values: ["メール", "優先（チャット + メール）", "専任CSM"] },
];

const PLAN_NAMES = ["Starter", "Business", "Enterprise"];
const PLAN_PRICES_EN = ["$15/user/mo", "$38/user/mo", "Custom"];
const PLAN_PRICES_JA = ["¥2,000/ユーザー/月", "¥5,000/ユーザー/月", "要相談"];

export default function PricingPage() {
  const { lang } = useLanguage();
  const ja = lang === "ja";
  const rows = ja ? COMPARISON_ROWS_JA : COMPARISON_ROWS_EN;
  const planPrices = ja ? PLAN_PRICES_JA : PLAN_PRICES_EN;

  return (
    <>
      {/* Page header */}
      <div className="bg-gray-950 text-white py-16 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight mb-3">
          {ja ? "料金プラン" : "Pricing"}
        </h1>
        <p className="text-gray-400 text-lg max-w-xl mx-auto">
          {ja
            ? "無料トライアルで始めて、ビジネスの成長に合わせてスケール。年間契約で20%OFF。"
            : "Start with a free trial. Scale as your business grows. Save 20% with annual billing."}
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
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">
                    {ja ? "機能" : "Feature"}
                  </th>
                  {PLAN_NAMES.map((name, i) => (
                    <th key={name} className="text-center py-3 px-4">
                      <div className="font-bold text-gray-900">{name}</div>
                      <div className="text-xs text-gray-500 font-normal mt-0.5">{planPrices[i]}</div>
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
          {ja ? "規制産業向けのカスタムプラン" : "Custom plans for regulated industries"}
        </h2>
        <p className="text-gray-500 mb-6 max-w-lg mx-auto">
          {ja
            ? "金融・ヘルスケア・政府向けのオンプレミス対応、コンプライアンス要件、カスタム契約に対応します。"
            : "On-premises deployment, compliance requirements, and custom contracts for finance, healthcare, and government."}
        </p>
        <a href="mailto:ueda.bioinfo.base01@gmail.com" className="btn-primary px-8 py-3">
          {ja ? "営業チームに問い合わせる" : "Contact Sales"}
        </a>
      </section>
    </>
  );
}
