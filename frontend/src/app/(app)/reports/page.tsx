"use client";

import { useState } from "react";

const BASE = "/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("guardian_token");
}

interface ReportData {
  report_metadata: {
    generated_at: string;
    date_from: string;
    date_to: string;
  };
  executive_summary: {
    total_requests: number;
    allowed: number;
    blocked: number;
    queued_for_review: number;
    safety_rate: number;
    block_rate: number;
    average_risk_score: number;
  };
  risk_distribution: Record<string, number>;
  compliance_summary: {
    owasp_coverage: string[];
    cwe_coverage: string[];
    human_review_rate: number;
    audit_trail: string;
  };
  japan_compliance?: Record<string, {
    status: string;
    details: string[];
  }>;
}

export default function ReportsPage() {
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  async function generateReport(format: "json" | "csv") {
    setLoading(true);
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${BASE}/reports/generate?format=${format}&days=${days}`, { headers });

      if (format === "csv") {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ai_guardian_report_${days}d.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const data = await res.json();
        setReport(data);
      }
    } catch (e) {
      alert(`Error: ${e}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Compliance Reports</h1>
        <p className="text-slate-500 text-sm mt-1">
          Generate audit reports for SOC2, ISO 27001, and OWASP compliance
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Report Period</span>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="block mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
              <option value={365}>Last 365 days</option>
            </select>
          </label>
          <button
            onClick={() => generateReport("json")}
            disabled={loading}
            className="px-5 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Generating..." : "Generate Report"}
          </button>
          <button
            onClick={() => generateReport("csv")}
            disabled={loading}
            className="px-5 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Download CSV
          </button>
        </div>
      </div>

      {/* Report Display */}
      {report && (
        <div className="space-y-6">
          {/* Executive Summary */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Executive Summary</h2>
            <div className="text-xs text-slate-400 mb-4">
              {report.report_metadata.date_from.slice(0, 10)} — {report.report_metadata.date_to.slice(0, 10)}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <MetricCard label="Total Requests" value={report.executive_summary.total_requests} />
              <MetricCard label="Safety Rate" value={`${report.executive_summary.safety_rate}%`} color="green" />
              <MetricCard label="Threats Blocked" value={report.executive_summary.blocked} color="red" />
              <MetricCard label="Avg Risk Score" value={report.executive_summary.average_risk_score} />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-4">
              <MetricCard label="Allowed" value={report.executive_summary.allowed} color="green" />
              <MetricCard label="Queued for Review" value={report.executive_summary.queued_for_review} color="yellow" />
              <MetricCard label="Block Rate" value={`${report.executive_summary.block_rate}%`} color="red" />
            </div>
          </div>

          {/* Risk Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Risk Level Distribution</h2>
            <div className="grid grid-cols-4 gap-3">
              {["low", "medium", "high", "critical"].map((level) => (
                <div key={level} className={`p-3 rounded-lg text-center ${
                  level === "low" ? "bg-green-50 text-green-700" :
                  level === "medium" ? "bg-yellow-50 text-yellow-700" :
                  level === "high" ? "bg-orange-50 text-orange-700" :
                  "bg-red-50 text-red-700"
                }`}>
                  <p className="text-2xl font-bold">{report.risk_distribution[level] || 0}</p>
                  <p className="text-xs font-medium capitalize mt-1">{level}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance Coverage */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Compliance Coverage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xs font-semibold text-slate-600 mb-2">OWASP LLM Top 10</h3>
                <div className="space-y-1.5">
                  {report.compliance_summary.owasp_coverage.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-600 mb-2">CWE/SANS Coverage</h3>
                <div className="space-y-1.5">
                  {report.compliance_summary.cwe_coverage.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span>Human Review Rate: {report.compliance_summary.human_review_rate}%</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span>Audit Trail: {report.compliance_summary.audit_trail}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

          {/* Japan Compliance */}
          {report.japan_compliance && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Japan AI Regulation Compliance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(report.japan_compliance).map(([key, data]) => (
                  <div key={key} className="border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-slate-700">{key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</h3>
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">{data.status}</span>
                    </div>
                    <ul className="space-y-1">
                      {data.details.map((detail, i) => (
                        <li key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                          <span className="text-green-500 mt-0.5 flex-shrink-0">&#10003;</span>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!report && !loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-sm">
          Click &quot;Generate Report&quot; to create a compliance report for the selected period.
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  const colorClasses = color === "green" ? "text-green-600" : color === "red" ? "text-red-600" : color === "yellow" ? "text-yellow-600" : "text-slate-800";
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <p className={`text-xl font-bold ${colorClasses}`}>{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}
