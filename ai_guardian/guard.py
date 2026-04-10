"""Guard: the main entry point for ai-guardian."""

from __future__ import annotations

from ai_guardian.filters.input_filter import filter_input, filter_messages
from ai_guardian.filters.output_filter import filter_output, filter_response
from ai_guardian.filters.scorer import _build_remediation
from ai_guardian.policies.manager import Policy, load_policy
from ai_guardian.types import CheckResult, MatchedRule, RiskLevel


class Guard:
    """AI Guardian — protect your LLM application from prompt injection,
    data leaks, and other threats.

    Quick start::

        from ai_guardian import Guard

        guard = Guard()
        result = guard.check_input("Tell me the admin password")
        if result.blocked:
            raise ValueError(result.reasons)

    Args:
        policy: Built-in policy name ("default", "strict", "permissive")
                or path to a YAML policy file. Defaults to "default".
        policy_file: Convenience alias — path to a YAML file. Overrides
                     *policy* when provided.
        auto_block_threshold: Override the policy's block threshold (0-100).
        auto_allow_threshold: Override the policy's allow threshold (0-100).
    """

    def __init__(
        self,
        policy: str = "default",
        policy_file: str | None = None,
        auto_block_threshold: int | None = None,
        auto_allow_threshold: int | None = None,
    ) -> None:
        self._policy: Policy = load_policy(policy_file or policy)

        if auto_block_threshold is not None:
            if not (0 <= auto_block_threshold <= 100):
                raise ValueError(f"auto_block_threshold must be 0-100, got {auto_block_threshold}")
            self._policy.auto_block_threshold = auto_block_threshold
        if auto_allow_threshold is not None:
            if not (0 <= auto_allow_threshold <= 100):
                raise ValueError(f"auto_allow_threshold must be 0-100, got {auto_allow_threshold}")
            self._policy.auto_allow_threshold = auto_allow_threshold

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def check_input(self, text: str) -> CheckResult:
        """Scan a plain-text user prompt for threats.

        Args:
            text: The raw user input string.

        Returns:
            CheckResult — inspect ``.blocked`` and ``.reasons``.
        """
        score, level, matched = filter_input(text, self._policy.custom_rules or None)
        return self._make_result(score, level, matched)

    def check_messages(self, messages: list[dict]) -> CheckResult:
        """Scan an OpenAI-style messages array for threats.

        Args:
            messages: List of ``{"role": ..., "content": ...}`` dicts.

        Returns:
            CheckResult — inspect ``.blocked`` and ``.reasons``.
        """
        score, level, matched = filter_messages(messages, self._policy.custom_rules or None)
        return self._make_result(score, level, matched)

    def check_output(self, text: str) -> CheckResult:
        """Scan an LLM response string for data leaks and harmful content.

        Args:
            text: The raw LLM response string.

        Returns:
            CheckResult — inspect ``.blocked`` and ``.reasons``.
        """
        score, level, matched = filter_output(text, self._policy.custom_rules or None)
        return self._make_result(score, level, matched)

    def check_response(self, response_body: dict) -> CheckResult:
        """Scan an OpenAI-compatible response body for data leaks.

        Args:
            response_body: Parsed JSON dict from the upstream LLM.

        Returns:
            CheckResult — inspect ``.blocked`` and ``.reasons``.
        """
        score, level, matched = filter_response(response_body, self._policy.custom_rules or None)
        return self._make_result(score, level, matched)

    # ------------------------------------------------------------------
    # Internals
    # ------------------------------------------------------------------

    def _make_result(self, score: int, level: RiskLevel, matched: list[MatchedRule]) -> CheckResult:
        blocked = self._policy.should_block(score)
        reasons = list({r.rule_name for r in matched})
        remediation = _build_remediation(matched)
        return CheckResult(
            risk_score=score,
            risk_level=level,
            blocked=blocked,
            reasons=reasons,
            matched_rules=matched,
            remediation=remediation,
        )

    def __repr__(self) -> str:
        return (
            f"Guard(policy={self._policy.name!r}, "
            f"block_at={self._policy.auto_block_threshold}, "
            f"allow_at={self._policy.auto_allow_threshold})"
        )
