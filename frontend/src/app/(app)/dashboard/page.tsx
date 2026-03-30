"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import StatCard from "@/components/StatCard";
import { auditApi, billingApi, type AuditLog, type UsageStats } from "@/lib/api";

interface Stats {
  total: number;
  blocked: number;
  queued: number;
  allowed: number;
  blockRate: string;
  safeRate: string;
}

export default function DashboardPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"en" | "ja">("ja");

  useEffect(() => {
    Promise.all([
      auditApi.list({ limit: 200 }),
      billingApi.getUsage().catch(() => null),
    ])
      .then(([l, u]) => {
        setLogs(l);
        setUsage(u);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const ja = lang === "ja";

  const stats: Stats = (() => {
    const blocked = logs.filter((l) => l.event_type.includes("blocked")).length;
    const queued = logs.filter((l) => l.event_type === "request.queued").length;
    const allowed = logs.filter((l) => l.event_type === "request.allowed").length;
    const total = logs.length;
    return {
      total,
      blocked,
      queued,
      allowed,
      blockRate: total > 0 ? ((blocked / total) * 100).toFixed(1) + "%" : "—",
      safeRate: total > 0 ? ((allowed / total) * 100).toFixed(1) + "%" : "—",
    };
  })();

  // Event breakdown
  const eventCounts: Record<string, number> = {};
  for (const log of logs) {
    eventCounts[log.event_type] = (eventCounts[log.event_type] ?? 0) + 1;
  }
  const eventLabels: Record<string, string> = ja ? {
    "request.allowed": "許可",
    "request.blocked": "ブロック",
    "request.queued": "レビュー待ち",
    "response.blocked": "出力ブロック",
    "review.approved": "承認",
    "review.rejected": "却下",
    "review.escalated": "エスカレ",
    "review.timed_out": "タイムアウト",
  } : {};
  const barData = Object.entries(eventCounts).map(([name, count]) => ({
    name: eventLabels[name] ?? name.replace("request.", "").replace("review.", "rev."),
    count,
  }));

  // Severity pie
  const severityLabels: Record<string, string> = ja ? {
    info: "情報",
    warning: "警告",
    critical: "重大",
  } : {};
  const severityCounts: Record<string, number> = {};
  for (const log of logs) {
    severityCounts[log.severity] = (severityCounts[log.severity] ?? 0) + 1;
  }
  const pieData = Object.entries(severityCounts).map(([name, value]) => ({
    name: severityLabels[name] ?? name,
    value,
  }));
  const PIE_COLORS = ["#22c55e", "#eab308", "#ef4444"];

  if (loading) {
    return (
      <div className="p-8">
        <p className="text-slate-500">{ja ? "読み込み中..." : "Loading dashboard..."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {ja ? "ダッシュボード" : "Dashboard"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {ja
              ? "すべてのAIリクエストは監視下にあります"
              : "Security filter overview — all AI requests are monitored"}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
          <button onClick={() => setLang("en")} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${lang === "en" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>EN</button>
          <button onClick={() => setLang("ja")} className={`px-2 py-1 rounded text-xs font-medium transition-colors ${lang === "ja" ? "bg-white shadow text-slate-900" : "text-slate-500"}`}>JA</button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={ja ? "AI利用の安全率" : "AI Safety Rate"}
          value={stats.safeRate}
          subtitle={ja ? `${stats.total}件中${stats.allowed}件が安全に処理` : `${stats.allowed} of ${stats.total} requests safe`}
          color="green"
        />
        <StatCard
          title={ja ? "脅威をブロック" : "Threats Blocked"}
          value={stats.blocked}
          subtitle={ja ? `ブロック率 ${stats.blockRate}` : `${stats.blockRate} block rate`}
          color="red"
        />
        <StatCard
          title={ja ? "あなたの判断を待っています" : "Pending Review"}
          value={stats.queued}
          color="yellow"
        />
        <StatCard
          title={ja ? "安全に通過" : "Allowed"}
          value={stats.allowed}
        />
      </div>

      {/* Plan usage */}
      {usage && usage.plan !== "free" && (
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">💳</span>
            <div>
              <p className="text-sm font-semibold text-slate-800 capitalize">
                {usage.plan} Plan
              </p>
              <p className="text-xs text-slate-500">
                {usage.monthly_requests_used.toLocaleString()}
                {usage.monthly_requests_limit
                  ? ` / ${usage.monthly_requests_limit.toLocaleString()} requests`
                  : " requests"}
              </p>
            </div>
          </div>
          {usage.monthly_requests_limit && (
            <div className="w-32">
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    usage.monthly_requests_used / usage.monthly_requests_limit >= 0.9
                      ? "bg-red-500"
                      : usage.monthly_requests_used / usage.monthly_requests_limit >= 0.8
                      ? "bg-yellow-500"
                      : "bg-sky-500"
                  }`}
                  style={{
                    width: `${Math.min(100, (usage.monthly_requests_used / usage.monthly_requests_limit) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Governance message */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 flex items-center gap-3">
        <span className="text-xl">🛡️</span>
        <div>
          <p className="text-sm font-semibold text-blue-800">
            {ja ? "AI Guardian が稼働中" : "AI Guardian Active"}
          </p>
          <p className="text-xs text-blue-600 mt-0.5">
            {ja
              ? "すべてのAIリクエストは自動スキャンされ、リスクに応じて許可・レビュー・ブロックされます。判断の最終責任は常に人間にあります。"
              : "All AI requests are automatically scanned and routed based on risk. Final decisions always rest with your team."}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            {ja ? "イベント内訳" : "Event Breakdown"}
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">
            {ja ? "重要度分布" : "Severity Distribution"}
          </h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-slate-400 text-sm">
              {ja ? "データがありません" : "No data yet"}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent events */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-700">
            {ja ? "最近のイベント" : "Recent Events"}
          </h2>
        </div>
        <div className="divide-y divide-slate-50">
          {logs.slice(0, 10).map((log) => (
            <div key={log.id} className="px-6 py-3 flex items-start gap-4">
              <span
                className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                  log.severity === "critical"
                    ? "bg-red-500"
                    : log.severity === "warning"
                    ? "bg-yellow-400"
                    : "bg-green-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 truncate">{log.summary}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {eventLabels[log.event_type] ?? log.event_type}
                </p>
              </div>
              <time className="text-xs text-slate-400 flex-shrink-0">
                {new Date(log.created_at).toLocaleTimeString()}
              </time>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-400 text-sm">
              {ja
                ? "イベントはまだありません。Playgroundからプロンプトを送信してみてください。"
                : "No events yet. Send a request through the Playground to get started."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
