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
          <h1 className="text-2xl text-gd-text-primary" style={{ fontWeight: 580 }}>Review Queue</h1>
          <p className="text-gd-text-muted text-sm mt-1">
            Human-in-the-Loop: review flagged requests
          </p>
        </div>
        <div className="flex gap-2">
          {["pending", "approved", "rejected", "escalated", "timed_out"].map(
            (s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setSelected(null); }}
                className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                  statusFilter === s
                    ? "bg-gd-accent text-white shadow-gd-inset"
                    : "bg-gd-hover border border-gd-subtle text-gd-text-secondary hover:bg-gd-elevated"
                }`}
                style={{ fontWeight: 480 }}
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
            <p className="text-gd-text-muted text-sm">Loading...</p>
          ) : items.length === 0 ? (
            <div className="bg-gd-surface rounded-xl border border-gd-subtle shadow-gd-card p-8 text-center text-gd-text-muted text-sm">
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
                  className={`w-full text-left bg-gd-surface rounded-xl border shadow-gd-card p-4 hover:border-gd-accent transition-colors ${
                    selected?.id === item.id
                      ? "border-gd-accent ring-1 ring-gd-accent"
                      : "border-gd-subtle"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      {detail && (
                        <RiskBadge level={detail.input_risk_level} score={detail.input_risk_score} />
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`text-xs ${isOverdue ? "text-gd-danger" : "text-gd-text-muted"}`} style={{ fontWeight: 480 }}>
                        {isOverdue ? "OVERDUE " : ""}
                        SLA: {formatDistanceToNow(deadline, { addSuffix: true })}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          item.status === "pending"
                            ? "bg-gd-warn-bg text-gd-warn"
                            : item.status === "approved"
                            ? "bg-gd-safe-bg text-gd-safe"
                            : item.status === "rejected"
                            ? "bg-gd-danger-bg text-gd-danger"
                            : "bg-gd-elevated text-gd-text-secondary"
                        }`}
                        style={{ fontWeight: 540 }}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gd-text-secondary line-clamp-2 mt-1">
                    {prompt || `Request ${item.request_id.slice(0, 8)}...`}
                  </p>
                  {detail && detail.input_matched_rules.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {detail.input_matched_rules.map((r) => (
                        <span key={r.rule_id} className="text-[10px] px-1.5 py-0.5 rounded bg-gd-danger-bg text-gd-danger border border-gd-subtle">
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
        <div className="lg:col-span-2 bg-gd-surface rounded-xl border border-gd-subtle shadow-gd-card p-6 h-fit">
          {selected ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-gd-text-primary text-lg" style={{ fontWeight: 540 }}>Review Decision</h2>
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
                  <h3 className="text-xs text-gd-text-muted uppercase mb-2" style={{ fontWeight: 540 }}>User Prompt</h3>
                  <div className="bg-gd-elevated border border-gd-subtle rounded-lg p-4 text-sm font-mono text-gd-text-primary whitespace-pre-wrap">
                    {userPrompt}
                  </div>
                </div>
              )}

              {/* Matched Rules */}
              {selected.request_detail && selected.request_detail.input_matched_rules.length > 0 && (
                <div>
                  <h3 className="text-xs text-gd-text-muted uppercase mb-2" style={{ fontWeight: 540 }}>Matched Threat Rules</h3>
                  <div className="space-y-2">
                    {selected.request_detail.input_matched_rules.map((rule) => (
                      <div key={rule.rule_id} className="flex items-center justify-between bg-gd-danger-bg border border-gd-subtle rounded-lg px-3 py-2">
                        <div>
                          <span className="text-sm text-gd-danger" style={{ fontWeight: 480 }}>{rule.rule_name}</span>
                          <span className="text-xs text-gd-danger ml-2">({rule.category})</span>
                        </div>
                        <span className="text-xs font-mono text-gd-danger" style={{ fontWeight: 580 }}>+{rule.score_delta}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Meta info */}
              <div className="text-xs text-gd-text-muted space-y-1 border-t border-gd-subtle pt-3">
                <p><span style={{ fontWeight: 480 }}>Model:</span> {selected.request_detail?.model ?? "—"}</p>
                <p><span style={{ fontWeight: 480 }}>SLA Deadline:</span> {new Date(selected.sla_deadline).toLocaleString()}</p>
                <p><span style={{ fontWeight: 480 }}>Client IP:</span> {selected.request_detail?.client_ip ?? "—"}</p>
              </div>

              {/* Decision buttons */}
              {selected.status === "pending" && (
                <>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a review note (optional)..."
                    className="w-full bg-gd-input border border-gd-standard rounded-lg p-3 text-sm text-gd-text-primary placeholder-gd-text-dim resize-none h-20 focus:outline-none focus:border-gd-accent focus:shadow-gd-focus"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => decide("approve")}
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-gd-safe-bg hover:bg-gd-elevated text-gd-safe border border-gd-subtle rounded-lg text-sm disabled:opacity-50 transition-colors"
                      style={{ fontWeight: 540 }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => decide("reject")}
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-gd-danger-bg hover:bg-gd-elevated text-gd-danger border border-gd-subtle rounded-lg text-sm disabled:opacity-50 transition-colors"
                      style={{ fontWeight: 540 }}
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => decide("escalate")}
                      disabled={submitting}
                      className="flex-1 py-2.5 bg-gd-warn-bg hover:bg-gd-elevated text-gd-warn border border-gd-subtle rounded-lg text-sm disabled:opacity-50 transition-colors"
                      style={{ fontWeight: 540 }}
                    >
                      Escalate
                    </button>
                  </div>
                </>
              )}
              {selected.status !== "pending" && (
                <p className="text-sm text-gd-text-muted">
                  This item has been <span style={{ fontWeight: 480 }}>{selected.status}</span>.
                  {selected.reviewer_note && (
                    <span className="block mt-1 italic">Note: {selected.reviewer_note}</span>
                  )}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gd-text-muted text-sm">Select an item from the queue to review</p>
              <p className="text-gd-text-dim text-xs mt-1">You'll see the full prompt, matched rules, and risk score</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
