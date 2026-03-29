"""Input filter: analyze incoming LLM request messages."""

from __future__ import annotations

from ai_guardian.filters.patterns import ALL_INPUT_PATTERNS
from ai_guardian.filters.scorer import run_patterns
from ai_guardian.types import MatchedRule, RiskLevel


def extract_text_from_messages(messages: list[dict]) -> str:
    """Concatenate all message content into a single string for pattern matching."""
    parts: list[str] = []
    for msg in messages:
        content = msg.get("content", "")
        if isinstance(content, str):
            parts.append(content)
        elif isinstance(content, list):
            for part in content:
                if isinstance(part, dict) and part.get("type") == "text":
                    parts.append(part.get("text", ""))
    return "\n".join(parts)


def filter_input(
    text: str,
    custom_rules: list[dict] | None = None,
) -> tuple[int, RiskLevel, list[MatchedRule]]:
    """Run input filter on a plain text string."""
    return run_patterns(text, ALL_INPUT_PATTERNS, custom_rules)


def filter_messages(
    messages: list[dict],
    custom_rules: list[dict] | None = None,
) -> tuple[int, RiskLevel, list[MatchedRule]]:
    """Run input filter on OpenAI-style messages array."""
    text = extract_text_from_messages(messages)
    return run_patterns(text, ALL_INPUT_PATTERNS, custom_rules)
