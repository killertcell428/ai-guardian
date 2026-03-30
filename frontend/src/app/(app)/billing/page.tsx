"use client";

import { useEffect, useState } from "react";
import { billingApi, SubscriptionStatus, UsageStats } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  trialing: "bg-sky-100 text-sky-800",
  past_due: "bg-red-100 text-red-800",
  canceled: "bg-slate-100 text-slate-600",
  none: "bg-slate-100 text-slate-600",
};

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"en" | "ja">("en");

  useEffect(() => {
    Promise.all([billingApi.getStatus(), billingApi.getUsage()])
      .then(([s, u]) => {
        setSub(s);
        setUsage(u);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: string) => {
    try {
      const { url } = await billingApi.createCheckout(
        plan,
        `${window.location.origin}/billing?success=true`,
        `${window.location.origin}/billing`
      );
      window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
    }
  };

  const handleManage = async () => {
    try {
      const { url } = await billingApi.createPortal();
      window.location.href = url;
    } catch (err) {
      console.error("Portal error:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500">Loading billing info...</p>
      </div>
    );
  }

  const trialDaysLeft =
    sub?.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(sub.trial_ends_at).getTime() - Date.now()) / 86_400_000))
      : null;

  const requestPct =
    usage?.monthly_requests_limit
      ? Math.min(100, Math.round((usage.monthly_requests_used / usage.monthly_requests_limit) * 100))
      : 0;

  const t = {
    en: {
      title: "Billing & Subscription",
      plan: "Current Plan",
      status: "Status",
      trialEnds: "Trial ends in",
      days: "days",
      usage: "API Usage This Month",
      team: "Team Members",
      retention: "Log Retention",
      upgrade: "Upgrade Plan",
      manage: "Manage Subscription",
      ofLimit: "of",
      requests: "requests",
      users: "users",
      unlimited: "Unlimited",
      proDesc: "Dashboard, logs, team up to 5 — $49/mo",
      bizDesc: "Compliance reports, SSO, team up to 50 — $299/mo",
    },
    ja: {
      title: "課金・サブスクリプション",
      plan: "現在のプラン",
      status: "ステータス",
      trialEnds: "トライアル残り",
      days: "日",
      usage: "今月の API 使用量",
      team: "チームメンバー",
      retention: "ログ保存期間",
      upgrade: "プランをアップグレード",
      manage: "サブスクリプション管理",
      ofLimit: "/",
      requests: "リクエスト",
      users: "名",
      unlimited: "無制限",
      proDesc: "ダッシュボード、ログ、5名まで — $49/月",
      bizDesc: "コンプラレポート、SSO、50名まで — $299/月",
    },
  }[lang];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <button
          onClick={() => setLang(lang === "en" ? "ja" : "en")}
          className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-500 hover:bg-slate-50"
        >
          {lang === "en" ? "日本語" : "English"}
        </button>
      </div>

      {/* Plan & Status */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{t.plan}</p>
            <p className="text-3xl font-bold text-slate-900 capitalize mt-1">
              {sub?.plan || "free"}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${
              STATUS_COLORS[sub?.status || "none"]
            }`}
          >
            {sub?.status || "none"}
          </span>
        </div>

        {trialDaysLeft !== null && sub?.status === "trialing" && (
          <div className="mt-3 text-sm text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-4 py-2">
            {t.trialEnds} <strong>{trialDaysLeft}</strong> {t.days}
          </div>
        )}

        {sub?.status === "past_due" && (
          <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            Payment failed. Please update your payment method.
          </div>
        )}
      </div>

      {/* Usage */}
      {usage && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
          {/* Requests */}
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">{t.usage}</span>
              <span className="font-medium text-slate-700">
                {usage.monthly_requests_used.toLocaleString()}
                {usage.monthly_requests_limit
                  ? ` ${t.ofLimit} ${usage.monthly_requests_limit.toLocaleString()} ${t.requests}`
                  : ` ${t.requests}`}
              </span>
            </div>
            {usage.monthly_requests_limit && (
              <div className="mt-2 w-full bg-slate-100 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    requestPct >= 90
                      ? "bg-red-500"
                      : requestPct >= 80
                      ? "bg-yellow-500"
                      : "bg-sky-500"
                  }`}
                  style={{ width: `${requestPct}%` }}
                />
              </div>
            )}
          </div>

          {/* Team */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{t.team}</span>
            <span className="font-medium text-slate-700">
              {usage.team_size} {t.ofLimit}{" "}
              {usage.team_limit ? `${usage.team_limit} ${t.users}` : t.unlimited}
            </span>
          </div>

          {/* Retention */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">{t.retention}</span>
            <span className="font-medium text-slate-700">
              {usage.retention_days ? `${usage.retention_days} days` : t.unlimited}
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {sub?.plan === "free" || sub?.plan === "pro" ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-slate-800 mb-4">{t.upgrade}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sub?.plan === "free" && (
                <button
                  onClick={() => handleUpgrade("pro")}
                  className="p-4 border-2 border-sky-200 rounded-xl text-left hover:border-sky-400 transition-colors"
                >
                  <p className="font-semibold text-slate-900">Pro</p>
                  <p className="text-xs text-slate-500 mt-1">{t.proDesc}</p>
                </button>
              )}
              <button
                onClick={() => handleUpgrade("business")}
                className="p-4 border-2 border-purple-200 rounded-xl text-left hover:border-purple-400 transition-colors"
              >
                <p className="font-semibold text-slate-900">Business</p>
                <p className="text-xs text-slate-500 mt-1">{t.bizDesc}</p>
              </button>
            </div>
          </div>
        ) : null}

        {sub?.stripe_customer_id !== undefined && sub?.plan !== "free" && (
          <button
            onClick={handleManage}
            className="w-full py-3 px-4 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            {t.manage}
          </button>
        )}
      </div>
    </div>
  );
}
