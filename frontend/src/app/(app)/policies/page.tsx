"use client";

import { useEffect, useState } from "react";
import { policiesApi, type Policy, type CustomRule } from "@/lib/api";
import { getLang, saveLang, type Lang } from "@/lib/lang";
import LangToggle from "@/components/LangToggle";

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
  const [lang, setLang] = useState<Lang>("ja");

  useEffect(() => { setLang(getLang()); }, []);
  const changeLang = (l: Lang) => { setLang(l); saveLang(l); };
  const ja = lang === "ja";

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
      alert(ja ? "ポリシーを保存しました" : "Policy saved!");
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
    return <div className="p-8 text-gd-text-muted text-sm">Loading...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl text-gd-text-primary" style={{ fontWeight: 580 }}>{ja ? "ポリシー設定" : "Policies"}</h1>
          <p className="text-gd-text-muted text-sm mt-1">{ja ? "リスクしきい値とカスタム検出ルールの設定" : "Configure risk thresholds and custom detection rules"}</p>
        </div>
        <LangToggle lang={lang} onChange={changeLang} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Policy list */}
        <div className="space-y-3">
          {policies.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className={`w-full text-left bg-gd-surface rounded-xl border p-4 shadow-gd-card hover:border-gd-accent transition-colors ${
                selected?.id === p.id ? "border-gd-accent ring-1 ring-gd-accent" : "border-gd-subtle"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-gd-text-primary text-sm" style={{ fontWeight: 480 }}>{p.name}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs ${p.is_active ? "bg-gd-safe-bg text-gd-safe" : "bg-gd-elevated text-gd-text-muted"}`}>
                  {p.is_active ? (ja ? "有効" : "Active") : (ja ? "無効" : "Inactive")}
                </span>
              </div>
              {p.description && <p className="text-xs text-gd-text-muted mt-1 truncate">{p.description}</p>}
              <div className="flex gap-3 mt-2 text-xs text-gd-text-muted">
                <span>{ja ? "許可" : "Allow"} ≤{p.auto_allow_threshold}</span>
                <span>{ja ? "ブロック" : "Block"} ≥{p.auto_block_threshold}</span>
                <span>SLA {p.review_sla_minutes}m</span>
                <span>{p.custom_rules.length} {ja ? "ルール" : "rules"}</span>
              </div>
            </button>
          ))}
          {policies.length === 0 && (
            <div className="bg-gd-surface rounded-xl border border-gd-subtle p-6 text-center text-gd-text-muted text-sm">
              {ja ? "ポリシーが設定されていません" : "No policies configured"}
            </div>
          )}
        </div>

        {/* Policy editor */}
        {selected && (
          <div className="lg:col-span-2 space-y-6">
            {/* Thresholds */}
            <div className="bg-gd-surface rounded-xl border border-gd-subtle shadow-gd-card p-6 space-y-6">
              <h2 className="text-gd-text-primary" style={{ fontWeight: 540 }}>{selected.name}</h2>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs text-gd-text-secondary" style={{ fontWeight: 480 }}>{ja ? "自動許可しきい値 (0-100)" : "Auto-Allow Threshold (0-100)"}</span>
                  <p className="text-xs text-gd-text-muted mb-1">{ja ? "このスコア以下のリクエストは自動的に許可されます" : "Requests scoring ≤ this are automatically allowed"}</p>
                  <input type="number" min={0} max={100} value={selected.auto_allow_threshold}
                    onChange={(e) => setSelected({ ...selected, auto_allow_threshold: Number(e.target.value) })}
                    className="w-full bg-gd-input border border-gd-standard rounded-lg px-3 py-2 text-sm text-gd-text-primary placeholder-gd-text-dim focus:outline-none focus:border-gd-accent focus:shadow-gd-focus" />
                </label>
                <label className="block">
                  <span className="text-xs text-gd-text-secondary" style={{ fontWeight: 480 }}>{ja ? "自動ブロックしきい値 (0-100)" : "Auto-Block Threshold (0-100)"}</span>
                  <p className="text-xs text-gd-text-muted mb-1">{ja ? "このスコア以上のリクエストは自動的にブロックされます" : "Requests scoring ≥ this are automatically blocked"}</p>
                  <input type="number" min={0} max={100} value={selected.auto_block_threshold}
                    onChange={(e) => setSelected({ ...selected, auto_block_threshold: Number(e.target.value) })}
                    className="w-full bg-gd-input border border-gd-standard rounded-lg px-3 py-2 text-sm text-gd-text-primary placeholder-gd-text-dim focus:outline-none focus:border-gd-accent focus:shadow-gd-focus" />
                </label>
                <label className="block">
                  <span className="text-xs text-gd-text-secondary" style={{ fontWeight: 480 }}>{ja ? "レビューSLA（分）" : "Review SLA (minutes)"}</span>
                  <p className="text-xs text-gd-text-muted mb-1">{ja ? "人間によるレビューの制限時間" : "Time allowed for human review"}</p>
                  <input type="number" min={1} max={1440} value={selected.review_sla_minutes}
                    onChange={(e) => setSelected({ ...selected, review_sla_minutes: Number(e.target.value) })}
                    className="w-full bg-gd-input border border-gd-standard rounded-lg px-3 py-2 text-sm text-gd-text-primary placeholder-gd-text-dim focus:outline-none focus:border-gd-accent focus:shadow-gd-focus" />
                </label>
                <label className="block">
                  <span className="text-xs text-gd-text-secondary" style={{ fontWeight: 480 }}>{ja ? "SLAフォールバック" : "SLA Fallback"}</span>
                  <p className="text-xs text-gd-text-muted mb-1">{ja ? "レビューがタイムアウトした場合のアクション" : "Action when review times out"}</p>
                  <select value={selected.sla_fallback}
                    onChange={(e) => setSelected({ ...selected, sla_fallback: e.target.value })}
                    className="w-full bg-gd-input border border-gd-standard rounded-lg px-3 py-2 text-sm text-gd-text-primary focus:outline-none focus:border-gd-accent focus:shadow-gd-focus">
                    <option value="block">{ja ? "ブロック（Fail-Close）" : "Block (Fail-Close)"}</option>
                    <option value="allow">{ja ? "許可（Fail-Open）" : "Allow (Fail-Open)"}</option>
                    <option value="escalate">{ja ? "エスカレーション" : "Escalate"}</option>
                  </select>
                </label>
              </div>

              {/* Risk zone visualization */}
              <div>
                <p className="text-xs text-gd-text-secondary mb-2" style={{ fontWeight: 480 }}>{ja ? "リスクゾーンの可視化" : "Risk Zone Visualization"}</p>
                <div className="flex rounded-lg overflow-hidden h-6 text-xs" style={{ fontWeight: 480 }}>
                  <div className="bg-gd-safe-bg text-gd-safe flex items-center justify-center" style={{ width: `${selected.auto_allow_threshold}%`, minWidth: 40 }}>{ja ? "許可" : "Allow"}</div>
                  <div className="bg-gd-warn-bg text-gd-warn flex items-center justify-center" style={{ width: `${selected.auto_block_threshold - selected.auto_allow_threshold}%`, minWidth: 40 }}>{ja ? "レビュー" : "Review"}</div>
                  <div className="bg-gd-danger-bg text-gd-danger flex items-center justify-center flex-1">{ja ? "ブロック" : "Block"}</div>
                </div>
                <div className="flex justify-between text-xs text-gd-text-muted mt-1">
                  <span>0</span><span>{selected.auto_allow_threshold}</span><span>{selected.auto_block_threshold}</span><span>100</span>
                </div>
              </div>
            </div>

            {/* Custom Rules */}
            <div className="bg-gd-surface rounded-xl border border-gd-subtle shadow-gd-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-gd-text-primary" style={{ fontWeight: 540 }}>{ja ? "カスタムルール" : "Custom Rules"} ({selected.custom_rules.length})</h3>
                <div className="flex gap-2">
                  <button onClick={() => setShowTemplates(!showTemplates)}
                    className="px-3 py-1.5 text-xs bg-gd-hover text-gd-text-secondary border border-gd-subtle rounded-lg hover:bg-gd-elevated transition-colors"
                    style={{ fontWeight: 480 }}>
                    {showTemplates ? (ja ? "テンプレートを隠す" : "Hide Templates") : (ja ? "テンプレート" : "Templates")}
                  </button>
                  <button onClick={() => setShowRuleBuilder(!showRuleBuilder)}
                    className="px-3 py-1.5 text-xs bg-gd-accent text-white rounded-lg hover:bg-gd-accent-hover shadow-gd-inset transition-colors"
                    style={{ fontWeight: 480 }}>
                    {ja ? "+ ルール追加" : "+ Add Rule"}
                  </button>
                </div>
              </div>

              {/* Rule Templates */}
              {showTemplates && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gd-info-bg rounded-lg border border-gd-subtle">
                  <p className="col-span-full text-xs text-gd-accent mb-1" style={{ fontWeight: 480 }}>{ja ? "コンプライアンステンプレート一覧：" : "Quick-add compliance templates:"}</p>
                  {RULE_TEMPLATES.map((tmpl, i) => (
                    <button key={i} onClick={() => addTemplate(tmpl)}
                      className="text-left p-2 bg-gd-surface rounded-lg border border-gd-subtle hover:border-gd-accent transition-colors text-xs">
                      <p className="text-gd-text-secondary" style={{ fontWeight: 480 }}>{tmpl.name}</p>
                      <p className="text-gd-text-muted mt-0.5">+{tmpl.score_delta} points</p>
                    </button>
                  ))}
                </div>
              )}

              {/* Rule Builder */}
              {showRuleBuilder && (
                <div className="p-4 bg-gd-elevated rounded-lg border border-gd-subtle space-y-3">
                  <p className="text-xs text-gd-text-secondary" style={{ fontWeight: 540 }}>{ja ? "新規カスタムルール" : "New Custom Rule"}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" placeholder={ja ? "ルール名" : "Rule name"} value={newRule.name}
                      onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      className="col-span-2 bg-gd-input border border-gd-standard rounded-lg px-3 py-2 text-sm text-gd-text-primary placeholder-gd-text-dim focus:outline-none focus:border-gd-accent focus:shadow-gd-focus" />
                    <input type="text" placeholder="Regex pattern (e.g., secret_project_\w+)" value={newRule.pattern}
                      onChange={(e) => { setNewRule({ ...newRule, pattern: e.target.value }); setRegexError(""); setTestResult(null); }}
                      className={`col-span-2 bg-gd-input border rounded-lg px-3 py-2 text-sm font-mono text-gd-text-primary placeholder-gd-text-dim focus:outline-none focus:border-gd-accent focus:shadow-gd-focus ${regexError ? "border-gd-danger" : "border-gd-standard"}`} />
                    {regexError && <p className="col-span-2 text-xs text-gd-danger">{regexError}</p>}
                    <label className="block">
                      <span className="text-xs text-gd-text-secondary">{ja ? "スコア加算" : "Score Delta"}</span>
                      <input type="number" min={1} max={100} value={newRule.score_delta}
                        onChange={(e) => setNewRule({ ...newRule, score_delta: Number(e.target.value) })}
                        className="w-full bg-gd-input border border-gd-standard rounded-lg px-3 py-2 text-sm text-gd-text-primary focus:outline-none focus:border-gd-accent focus:shadow-gd-focus" />
                    </label>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-sm text-gd-text-secondary">
                        <input type="checkbox" checked={newRule.enabled}
                          onChange={(e) => setNewRule({ ...newRule, enabled: e.target.checked })}
                          className="rounded border-gd-standard" />
                        {ja ? "有効" : "Enabled"}
                      </label>
                    </div>
                  </div>

                  {/* Regex Tester */}
                  <div className="border-t border-gd-subtle pt-3">
                    <p className="text-xs text-gd-text-secondary mb-2" style={{ fontWeight: 540 }}>{ja ? "パターンをテスト：" : "Test your pattern:"}</p>
                    <div className="flex gap-2">
                      <input type="text" placeholder={ja ? "テストテキストを入力..." : "Enter test text..."} value={testText}
                        onChange={(e) => { setTestText(e.target.value); setTestResult(null); }}
                        className="flex-1 bg-gd-input border border-gd-standard rounded-lg px-3 py-2 text-sm text-gd-text-primary placeholder-gd-text-dim focus:outline-none focus:border-gd-accent focus:shadow-gd-focus" />
                      <button onClick={testRegex}
                        className="px-4 py-2 bg-gd-deep text-gd-text-dim rounded-lg text-sm hover:bg-gd-elevated transition-colors">
                        {ja ? "テスト" : "Test"}
                      </button>
                    </div>
                    {testResult && (
                      <div className={`mt-2 p-2 rounded-lg text-xs ${testResult.matches ? "bg-gd-safe-bg text-gd-safe border border-gd-subtle" : "bg-gd-danger-bg text-gd-danger border border-gd-subtle"}`}>
                        {testResult.matches
                          ? <span>{ja ? "マッチ：" : "Match found: "}<code className="font-mono bg-gd-safe-bg px-1 rounded">{testResult.matchedText}</code></span>
                          : (ja ? "マッチなし" : "No match found")}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={addRule} disabled={!newRule.name || !newRule.pattern}
                      className="px-4 py-2 bg-gd-accent text-white rounded-lg text-sm hover:bg-gd-accent-hover shadow-gd-inset disabled:opacity-50 transition-colors"
                      style={{ fontWeight: 480 }}>
                      {ja ? "ルール追加" : "Add Rule"}
                    </button>
                    <button onClick={() => { setShowRuleBuilder(false); setTestResult(null); setRegexError(""); }}
                      className="px-4 py-2 text-gd-text-secondary text-sm hover:bg-gd-elevated rounded-lg transition-colors">
                      {ja ? "キャンセル" : "Cancel"}
                    </button>
                  </div>
                </div>
              )}

              {/* Existing rules */}
              {selected.custom_rules.length === 0 ? (
                <p className="text-xs text-gd-text-muted">{ja ? "カスタムルールがありません。「+ ルール追加」またはテンプレートを使用してください。" : "No custom rules. Click \"+ Add Rule\" or use a template."}</p>
              ) : (
                <div className="space-y-2">
                  {selected.custom_rules.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-3 p-3 bg-gd-elevated rounded-lg group">
                      <button onClick={() => toggleRule(rule.id)}
                        className={`h-4 w-4 rounded-full flex-shrink-0 border-2 transition-colors ${rule.enabled ? "bg-gd-safe border-gd-safe" : "bg-gd-surface border-gd-standard"}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${rule.enabled ? "text-gd-text-secondary" : "text-gd-text-muted line-through"}`} style={{ fontWeight: 480 }}>{rule.name}</p>
                        <code className="text-xs text-gd-text-muted truncate block font-mono">{rule.pattern}</code>
                      </div>
                      <span className="text-xs text-gd-text-muted flex-shrink-0" style={{ fontWeight: 480 }}>+{rule.score_delta}</span>
                      <button onClick={() => removeRule(rule.id)}
                        className="opacity-0 group-hover:opacity-100 text-gd-danger hover:text-gd-danger text-xs transition-opacity">
                        {ja ? "削除" : "Remove"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={savePolicy} disabled={saving}
              className="px-6 py-2 bg-gd-accent hover:bg-gd-accent-hover text-white rounded-lg text-sm shadow-gd-inset disabled:opacity-50 transition-colors"
              style={{ fontWeight: 480 }}>
              {saving ? (ja ? "保存中..." : "Saving...") : (ja ? "すべての変更を保存" : "Save All Changes")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
