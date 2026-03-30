"use client";

import PricingSection from "@/components/PricingSection";
import { useLanguage } from "@/contexts/LanguageContext";

const COMPARISON_ROWS_EN = [
  { feature: "Team members", values: ["Up to 5", "Up to 50", "Unlimited"] },
  { feature: "API requests / month", values: ["500K", "5M", "Unlimited"] },
  { feature: "Cloud dashboard", values: [true, true, true] },
  { feature: "Risk score visualization", values: [true, true, true] },
  { feature: "Playground (prompt testing)", values: [true, true, true] },
  { feature: "Detection patterns (57+)", values: [true, true, true] },
  { feature: "Custom detection rules", values: ["Unlimited", "Unlimited", "Unlimited"] },
  { feature: "Human-in-the-Loop review", values: [false, true, true] },
  { feature: "Data retention", values: ["90 days", "1 year", "Unlimited"] },
  { feature: "Compliance reports (OWASP, SOC2)", values: [false, true, true] },
  { feature: "SSO / SAML", values: [false, true, true] },
  { feature: "Slack / PagerDuty alerts", values: [false, true, true] },
  { feature: "On-premises / VPC", values: [false, false, true] },
  { feature: "SLA guarantee", values: ["99.5%", "99.9%", "99.99%"] },
  { feature: "Support", values: ["Email", "Priority (Chat + Email)", "Dedicated CSM"] },
];

const COMPARISON_ROWS_JA = [
  { feature: "チームメンバー", values: ["最大5名", "最大50名", "無制限"] },
  { feature: "月間APIリクエスト", values: ["50万", "500万", "無制限"] },
  { feature: "クラウドダッシュボード", values: [true, true, true] },
  { feature: "リスクスコア可視化", values: [true, true, true] },
  { feature: "Playground（プロンプトテスト）", values: [true, true, true] },
  { feature: "検出パターン（57種以上）", values: [true, true, true] },
  { feature: "カスタム検出ルール", values: ["無制限", "無制限", "無制限"] },
  { feature: "Human-in-the-Loopレビュー", values: [false, true, true] },
  { feature: "データ保持期間", values: ["90日", "1年", "無制限"] },
  { feature: "コンプラレポート（OWASP, SOC2）", values: [false, true, true] },
  { feature: "SSO / SAML", values: [false, true, true] },
  { feature: "Slack / PagerDuty通知", values: [false, true, true] },
  { feature: "オンプレミス / VPC", values: [false, false, true] },
  { feature: "SLA保証", values: ["99.5%", "99.9%", "99.99%"] },
  { feature: "サポート", values: ["メール", "優先（チャット + メール）", "専任CSM"] },
];

const PLAN_NAMES = ["Pro", "Business", "Enterprise"];
const PLAN_PRICES_EN = ["$49/mo", "$299/mo", "Custom"];
const PLAN_PRICES_JA = ["$49/月", "$299/月", "要相談"];

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
