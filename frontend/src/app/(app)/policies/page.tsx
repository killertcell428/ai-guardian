"use client";

import { useEffect, useState } from "react";
import { policiesApi, type Policy, type CustomRule } from "@/lib/api";

const RULE_TEMPLATES = [
  { name: "HIPAA: Medical Record Number", pattern: "\\b(MRN|medical\\s+record)\\s*[:#]?\\s*\\d{6,10}\\b", score_delta: 70, category: "compliance" },
  { name: "PCI-DSS: CVV Code", pattern: "\\b(cvv|cvc|cvv2|cvc2)\\s*[:#]?\\s*\\d{3,4}\\b", score_delta: 80, category: "compliance" },
  { name: "GDPR: EU Passport", pattern: "\\b[A-Z]{2}\\d{7,9}\\b", score_delta: 60, category: "pii" },
  { name: "Competitor Mention", pattern: "(competitor_name|rival_company)", score_delta: 30, category: "business" },
  { name: "Internal Project Code", pattern: "PROJECT[-_]?(ALPHA|BETA|GAMMA|CONFIDENTIAL)", score_delta: 50, category: "confidential" },
  { name: "AWS Account ID", pattern: "\\b\\d{12}\\b", score_delta: 40, category: "infrastructure" },
];

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Policy | null>(null);
  const [saving, setSaving] = useState(false);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Rule builder state
  const [newRule, setNewRule] = useState({ name: "", pattern: "", score_delta: 50, enabled: true });
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<{ matches: boolean; matchedText: string } | null>(null);
  const [regexError, setRegexError] = useState("");

  useEffect(() => {
    policiesApi.list().then(setPolicies).catch(console.error).finally(() => setLoading(false));
  }, []);

  async function savePolicy() {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await policiesApi.update(selected.id, {
        auto_allow_threshold: selected.auto_allow_threshold,
        auto_block_threshold: selected.auto_block_threshold,
        review_sla_minutes: selected.review_sla_minutes,
        sla_fallback: selected.sla_fallback,
        is_active: selected.is_active,
        custom_rules: selected.custom_rules,
      });
      setPolicies((p) => p.map((pol) => (pol.id === updated.id ? updated : pol)));
      setSelected(updated);
      alert("Policy saved!");
    } catch (e) {
      alert(`Error: ${e}`);
    } finally {
      setSaving(false);
    }
  }

  function testRegex() {
    if (!newRule.pattern || !testText) return;
    try {
      const regex = new RegExp(newRule.pattern, "gi");
      const match = regex.exec(testText);
      setRegexError("");
      setTestResult(match ? { matches: true, matchedText: match[0] } : { matches: false, matchedText: "" });
    } catch (e) {
      setRegexError(`Invalid regex: ${e instanceof Error ? e.message : String(e)}`);
      setTestResult(null);
    }
  }

  function addRule() {
    if (!selected || !newRule.name || !newRule.pattern) return;
    try {
      new RegExp(newRule.pattern);
    } catch {
      setRegexError("Invalid regex pattern");
      return;
    }
    const rule: CustomRule = {
      id: `custom_${Date.now()}`,
      name: newRule.name,
      pattern: newRule.pattern,
      score_delta: newRule.score_delta,
      enabled: newRule.enabled,
    };
    setSelected({ ...selected, custom_rules: [...selected.custom_rules, rule] });
    setNewRule({ name: "", pattern: "", score_delta: 50, enabled: true });
    setTestResult(null);
    setTestText("");
    setShowRuleBuilder(false);
  }

  function addTemplate(tmpl: typeof RULE_TEMPLATES[0]) {
    if (!selected) return;
    const rule: CustomRule = {
      id: `tmpl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: tmpl.name,
      pattern: tmpl.pattern,
      score_delta: tmpl.score_delta,
      enabled: true,
    };
    setSelected({ ...selected, custom_rules: [...selected.custom_rules, rule] });
  }

  function removeRule(ruleId: string) {
    if (!selected) return;
    setSelected({ ...selected, custom_rules: selected.custom_rules.filter((r) => r.id !== ruleId) });
  }

  function toggleRule(ruleId: string) {
    if (!selected) return;
    setSelected({
      ...selected,
      custom_rules: selected.custom_rules.map((r) =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      ),
    });
  }

  if (loading) {
    return <div className="p-8 text-slate-400 text-sm">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Policies</h1>
        <p className="text-slate-500 text-sm mt-1">Configure risk thresholds and custom detection rules</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy list */}
        <div className="space-y-3">
          {policies.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`w-full text-left bg-white rounded-xl border p-4 shadow-sm hover:border-sky-300 transition-colors ${
                selected?.id === p.id ? "border-sky-500 ring-1 ring-sky-200" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-800 text-sm">{p.name}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs ${p.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                  {p.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              {p.description && <p className="text-xs text-slate-400 mt-1 truncate">{p.description}</p>}
              <div className="flex gap-3 mt-2 text-xs text-slate-500">
                <span>Allow ≤{p.auto_allow_threshold}</span>
                <span>Block ≥{p.auto_block_threshold}</span>
                <span>SLA {p.review_sla_minutes}m</span>
                <span>{p.custom_rules.length} rules</span>
              </div>
            </button>
          ))}
          {policies.length === 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400 text-sm">
              No policies configured
            </div>
          )}
        </div>

        {/* Policy editor */}
        {selected && (
          <div className="lg:col-span-2 space-y-6">
            {/* Thresholds */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h2 className="font-semibold text-slate-800">{selected.name}</h2>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Auto-Allow Threshold (0-100)</span>
                  <p className="text-xs text-slate-400 mb-1">Requests scoring ≤ this are automatically allowed</p>
                  <input type="number" min={0} max={100} value={selected.auto_allow_threshold}
                    onChange={(e) => setSelected({ ...selected, auto_allow_threshold: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Auto-Block Threshold (0-100)</span>
                  <p className="text-xs text-slate-400 mb-1">Requests scoring ≥ this are automatically blocked</p>
                  <input type="number" min={0} max={100} value={selected.auto_block_threshold}
                    onChange={(e) => setSelected({ ...selected, auto_block_threshold: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">Review SLA (minutes)</span>
                  <p className="text-xs text-slate-400 mb-1">Time allowed for human review</p>
                  <input type="number" min={1} max={1440} value={selected.review_sla_minutes}
                    onChange={(e) => setSelected({ ...selected, review_sla_minutes: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-600">SLA Fallback</span>
                  <p className="text-xs text-slate-400 mb-1">Action when review times out</p>
                  <select value={selected.sla_fallback}
                    onChange={(e) => setSelected({ ...selected, sla_fallback: e.target.value })}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-300">
                    <option value="block">Block (Fail-Close)</option>
                    <option value="allow">Allow (Fail-Open)</option>
                    <option value="escalate">Escalate</option>
                  </select>
                </label>
              </div>

              {/* Risk zone visualization */}
              <div>
                <p className="text-xs font-medium text-slate-600 mb-2">Risk Zone Visualization</p>
                <div className="flex rounded-lg overflow-hidden h-6 text-xs font-medium">
                  <div className="bg-green-500 flex items-center justify-center text-white" style={{ width: `${selected.auto_allow_threshold}%`, minWidth: 40 }}>Allow</div>
                  <div className="bg-yellow-400 flex items-center justify-center text-white" style={{ width: `${selected.auto_block_threshold - selected.auto_allow_threshold}%`, minWidth: 40 }}>Review</div>
                  <div className="bg-red-500 flex items-center justify-center text-white flex-1">Block</div>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-1">
                  <span>0</span><span>{selected.auto_allow_threshold}</span><span>{selected.auto_block_threshold}</span><span>100</span>
                </div>
              </div>
            </div>

            {/* Custom Rules */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Custom Rules ({selected.custom_rules.length})</h3>
                <div className="flex gap-2">
                  <button onClick={() => setShowTemplates(!showTemplates)}
                    className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    {showTemplates ? "Hide Templates" : "Templates"}
                  </button>
                  <button onClick={() => setShowRuleBuilder(!showRuleBuilder)}
                    className="px-3 py-1.5 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
                    + Add Rule
                  </button>
                </div>
              </div>

              {/* Rule Templates */}
              {showTemplates && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-sky-50 rounded-lg border border-sky-200">
                  <p className="col-span-full text-xs font-medium text-sky-700 mb-1">Quick-add compliance templates:</p>
                  {RULE_TEMPLATES.map((tmpl, i) => (
                    <button key={i} onClick={() => addTemplate(tmpl)}
                      className="text-left p-2 bg-white rounded-lg border border-sky-100 hover:border-sky-300 transition-colors text-xs">
                      <p className="font-medium text-slate-700">{tmpl.name}</p>
                      <p className="text-slate-400 mt-0.5">+{tmpl.score_delta} points</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Rule Builder */}
              {showRuleBuilder && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <p className="text-xs font-semibold text-slate-700">New Custom Rule</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder="Rule name" value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      className="col-span-2 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    <input type="text" placeholder="Regex pattern (e.g., secret_project_\w+)" value={newRule.pattern}
                      onChange={(e) => { setNewRule({ ...newRule, pattern: e.target.value }); setRegexError(""); setTestResult(null); }}
                      className={`col-span-2 border rounded-lg px-3 py-2 text-sm font-mono ${regexError ? "border-red-300" : "border-slate-200"}`} />
                    {regexError && <p className="col-span-2 text-xs text-red-500">{regexError}</p>}
                    <label className="block">
                      <span className="text-xs text-slate-600">Score Delta</span>
                      <input type="number" min={1} max={100} value={newRule.score_delta}
                        onChange={(e) => setNewRule({ ...newRule, score_delta: Number(e.target.value) })}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                    </label>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input type="checkbox" checked={newRule.enabled}
                          onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                          className="rounded border-slate-300" />
                        Enabled
                      </label>
                    </div>
                  </div>

                  {/* Regex Tester */}
                  <div className="border-t border-slate-200 pt-3">
                    <p className="text-xs font-semibold text-slate-600 mb-2">Test your pattern:</p>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Enter test text..." value={testText}
                        onChange={(e) => { setTestText(e.target.value); setTestResult(null); }}
                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" />
                      <button onClick={testRegex}
                        className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition-colors">
                        Test
                      </button>
                    </div>
                    {testResult && (
                      <div className={`mt-2 p-2 rounded-lg text-xs ${testResult.matches ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                        {testResult.matches
                          ? <span>Match found: <code className="font-mono bg-green-100 px-1 rounded">{testResult.matchedText}</code></span>
                          : "No match found"}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={addRule} disabled={!newRule.name || !newRule.pattern}
                      className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-medium hover:bg-sky-700 disabled:opacity-50 transition-colors">
                      Add Rule
                    </button>
                    <button onClick={() => { setShowRuleBuilder(false); setTestResult(null); setRegexError(""); }}
                      className="px-4 py-2 text-slate-600 text-sm hover:bg-slate-100 rounded-lg transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Existing rules */}
              {selected.custom_rules.length === 0 ? (
                <p className="text-xs text-slate-400">No custom rules. Click &quot;+ Add Rule&quot; or use a template.</p>
              ) : (
                <div className="space-y-2">
                  {selected.custom_rules.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg group">
                      <button onClick={() => toggleRule(rule.id)}
                        className={`h-4 w-4 rounded-full flex-shrink-0 border-2 transition-colors ${rule.enabled ? "bg-green-500 border-green-500" : "bg-white border-slate-300"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${rule.enabled ? "text-slate-700" : "text-slate-400 line-through"}`}>{rule.name}</p>
                        <code className="text-xs text-slate-400 truncate block font-mono">{rule.pattern}</code>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0 font-medium">+{rule.score_delta}</span>
                      <button onClick={() => removeRule(rule.id)}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs transition-opacity">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={savePolicy} disabled={saving}
              className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
