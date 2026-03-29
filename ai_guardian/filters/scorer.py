"""Risk scoring engine.

Aggregates matched pattern scores into a single risk score and level.
"""
from __future__ import annotations

import re

from ai_guardian.filters.patterns import DetectionPattern
from ai_guardian.types import MatchedRule, RiskLevel


def _score_to_level(score: int) -> RiskLevel:
    if score <= 30:
        return RiskLevel.LOW
    elif score <= 60:
        return RiskLevel.MEDIUM
    elif score <= 80:
        return RiskLevel.HIGH
    else:
        return RiskLevel.CRITICAL


def _build_remediation(matched: list[MatchedRule]) -> dict:
    if not matched:
        return {}
    hints: list[str] = []
    refs: list[str] = []
    for r in matched:
        if r.remediation_hint and r.remediation_hint not in hints:
            hints.append(r.remediation_hint)
        if r.owasp_ref and r.owasp_ref not in refs:
            refs.append(r.owasp_ref)
    top = max(matched, key=lambda r: r.score_delta)
    return {
        "primary_threat": top.rule_name,
        "primary_category": top.category,
        "owasp_refs": refs,
        "hints": hints,
    }


def run_patterns(
    text: str,
    patterns: list[DetectionPattern],
    custom_rules: list[dict] | None = None,
) -> tuple[int, RiskLevel, list[MatchedRule]]:
    """Run all patterns against text.

    Returns:
        (risk_score, risk_level, matched_rules)

    Scoring strategy:
      - Each matching pattern contributes its base_score.
      - Multiple matches from the same category are capped (diminishing returns).
      - Final score is clamped to [0, 100].
    """
    matched: list[MatchedRule] = []
    category_scores: dict[str, int] = {}

    for pattern in patterns:
        if not pattern.enabled:
            continue
        m = pattern.pattern.search(text)
        if m:
            matched_text = m.group(0)[:200]
            matched.append(
                MatchedRule(
                    rule_id=pattern.id,
                    rule_name=pattern.name,
                    category=pattern.category,
                    score_delta=pattern.base_score,
                    matched_text=matched_text,
                    owasp_ref=pattern.owasp_ref,
                    remediation_hint=pattern.remediation_hint,
                )
            )
            prev = category_scores.get(pattern.category, 0)
            category_scores[pattern.category] = min(
                prev + pattern.base_score, pattern.base_score * 2
            )

    if custom_rules:
        for rule in custom_rules:
            if not rule.get("enabled", True):
                continue
            try:
                compiled = re.compile(rule["pattern"], re.IGNORECASE | re.DOTALL)
                m = compiled.search(text)
                if m:
                    score_delta = int(rule.get("score_delta", 20))
                    matched.append(
                        MatchedRule(
                            rule_id=rule["id"],
                            rule_name=rule["name"],
                            category="custom",
                            score_delta=score_delta,
                            matched_text=m.group(0)[:200],
                            owasp_ref=rule.get("owasp_ref", ""),
                            remediation_hint=rule.get("remediation_hint", ""),
                        )
                    )
                    prev = category_scores.get("custom", 0)
                    category_scores["custom"] = min(prev + score_delta, score_delta * 2)
            except re.error:
                continue

    total_score = min(sum(category_scores.values()), 100)
    level = _score_to_level(total_score)
    return total_score, level, matched
