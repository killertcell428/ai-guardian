"use client";

import { useEffect, useState } from "react";
import { auditApi, type AuditLog } from "@/lib/api";

const SEVERITY_BADGE: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-yellow-100 text-yellow-700",
  critical: "bg-red-100 text-red-700",
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventFilter, setEventFilter] = useState("");
  const [severityFilter, setSeverityFilter] = useState("");
  const [page, setPage] = useState(0);
  const PER_PAGE = 50;

  const load = () => {
    setLoading(true);
    auditApi
      .list({
        event_type: eventFilter || undefined,
        severity: severityFilter || undefined,
        limit: PER_PAGE,
        offset: page * PER_PAGE,
      })
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [eventFilter, severityFilter, page]);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Audit Logs</h1>
        <p className="text-slate-500 text-sm mt-1">
          Immutable record of all filter decisions and review actions
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Filter by event type..."
          value={eventFilter}
          onChange={(e) => {
            setEventFilter(e.target.value);
            setPage(0);
          }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-sky-300"
        />
        <select
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value);
            setPage(0);
          }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          <option value="">All severities</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <button
          onClick={() => {
            setEventFilter("");
            setSeverityFilter("");
            setPage(0);
          }}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Event
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Severity
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Summary
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                      {log.event_type}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        SEVERITY_BADGE[log.severity] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {log.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700 max-w-sm truncate">
                    {log.summary}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Showing {page * PER_PAGE + 1}–{page * PER_PAGE + logs.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={logs.length < PER_PAGE}
              className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
