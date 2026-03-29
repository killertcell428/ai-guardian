"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import RiskBadge from "@/components/RiskBadge";
import { reviewApi, type ReviewItem } from "@/lib/api";

export default function ReviewQueuePage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReviewItem | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending");

  const load = () => {
    setLoading(true);
    reviewApi
      .list(statusFilter)
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  async function decide(decision: "approve" | "reject" | "escalate") {
    if (!selected) return;
    setSubmitting(true);
    try {
      await reviewApi.decide(selected.id, decision, note || undefined);
      setSelected(null);
      setNote("");
      load();
    } catch (e) {
      alert(`Error: ${e}`);
    } finally {
      setSubmitting(false);
    }
  }

  const userPrompt = selected?.request_detail?.messages
    ?.filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Review Queue</h1>
          <p className="text-slate-500 text-sm mt-1">
            Human-in-the-Loop: review flagged requests
          </p>
        </div>
        <div className="flex gap-2">
          {["pending", "approved", "rejected", "escalated", "timed_out"].map(
            (s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setSelected(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s
                    ? "bg-sky-600 text-white"
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            )
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue list */}
        <div className="lg:col-span-1 space-y-3">
          {loading ? (
            <p className="text-slate-400 text-sm">Loading...</p>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400 text-sm">
              No {statusFilter} items
            </div>
          ) : (
            items.map((item) => {
              const deadline = new Date(item.sla_deadline);
              const isOverdue = deadline < new Date() && item.status === "pending";
              const detail = item.request_detail;
              const prompt = detail?.messages
                ?.filter((m) => m.role === "user")
                .map((m) => m.content)
                .join(" ") ?? "";
              return (
                <button
                  key={item.id}
                  onClick={() => { setSelected(item); setNote(""); }}
                  className={`w-full text-left bg-white rounded-xl border shadow-sm p-4 hover:border-sky-300 transition-colors ${
                    selected?.id === item.id
                      ? "border-sky-500 ring-1 ring-sky-200"
                      : "border-slate-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      {detail && (
                        <RiskBadge level={detail.input_risk_level} score={detail.input_risk_score} />
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs font-medium ${isOverdue ? "text-red-600" : "text-slate-400"}`}>
                        {isOverdue ? "OVERDUE " : ""}
                        SLA: {formatDistanceToNow(deadline, { addSuffix: true })}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          item.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : item.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : item.status === "rejected"
                            ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 line-clamp-2 mt-1">
                    {prompt || `Request ${item.request_id.slice(0, 8)}...`}
                  </p>
                  {detail && detail.input_matched_rules.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {detail.input_matched_rules.map((r) => (
                        <span key={r.rule_id} className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                          {r.rule_name}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Decision panel */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-fit">
          {selected ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-800 text-lg">Review Decision</h2>
                {selected.request_detail && (
                  <RiskBadge
                    level={selected.request_detail.input_risk_level}
                    score={selected.request_detail.input_risk_score}
                  />
                )}
              </div>

              {/* Prompt content */}
              {userPrompt && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">User Prompt</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm font-mono text-slate-800 whitespace-pre-wrap">
                    {userPrompt}
                  </div>
                </div>
              )}

              {/* Matched Rules */}
              {selected.request_detail && selected.request_detail.input_matched_rules.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Matched Threat Rules</h3>
                  <div className="space-y-2">
                    {selected.request_detail.input_matched_rules.map((rule) => (
                      <div key={rule.rule_id} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        <div>
                          <span className="text-sm font-medium text-red-700">{rule.rule_name}</span>
                          <span className="text-xs text-red-500 ml-2">({rule.category})</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-red-600">+{rule.score_delta}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta info */}
              <div className="text-xs text-slate-500 space-y-1 border-t border-slate-100 pt-3">
                <p><span className="font-medium">Model:</span> {selected.request_detail?.model ?? "—"}</p>
                <p><span className="font-medium">SLA Deadline:</span> {new Date(selected.sla_deadline).toLocaleString()}</p>
                <p><span className="font-medium">Client IP:</span> {selected.request_detail?.client_ip ?? "—"}</p>
              </div>

              {/* Decision buttons */}
              {selected.status === "pending" && (
                <>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a review note (optional)..."
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => decide("approve")}
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decide("reject")}
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => decide("escalate")}
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
                    >
                      Escalate
                    </button>
                  </div>
                </>
              )}
              {selected.status !== "pending" && (
                <p className="text-sm text-slate-500">
                  This item has been <span className="font-medium">{selected.status}</span>.
                  {selected.reviewer_note && (
                    <span className="block mt-1 italic">Note: {selected.reviewer_note}</span>
                  )}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">Select an item from the queue to review</p>
              <p className="text-slate-300 text-xs mt-1">You'll see the full prompt, matched rules, and risk score</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
