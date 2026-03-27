"""Activity Stream — unified event log for all AI agent operations.

Records every tool call, policy decision, and session lifecycle event
across any agent type (Claude Code, Cursor, custom agents, etc.).

Usage:
    from ai_guardian.activity import ActivityStream, ActivityEvent

    stream = ActivityStream()
    event = ActivityEvent(
        action="shell:exec",
        target="rm -rf /tmp/test",
        agent_type="claude_code",
    )
    stream.record(event)

    # Query recent events
    events = stream.query(action="shell:exec", limit=10)

    # Get summary
    summary = stream.summary(days=7)
"""

import json
import os
import getpass
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone, timedelta
from pathlib import Path


@dataclass
class ActivityEvent:
    """A single agent operation event.

    Captures who/what/when/where/why for every operation an AI agent
    performs. Designed to be agent-agnostic and extensible for AGI-era
    governance (memory, delegation, cost, autonomy levels).
    """
    # What happened
    action: str                     # "file:read" | "file:write" | "shell:exec" |
                                    # "llm:prompt" | "network:fetch" | "agent:spawn" |
                                    # "mcp:tool_call" | "session:start" | "session:end"
    target: str = ""                # filepath, command, URL, agent ID

    # Who did it
    agent_type: str = "unknown"     # "claude_code" | "cursor" | "custom" | ...
    user_id: str = ""               # OS user or API key owner
    session_id: str = ""            # Agent session identifier

    # Context
    event_type: str = "tool_call"   # "tool_call" | "policy_block" | "policy_review" |
                                    # "session_start" | "session_end" | "scan_alert"
    cwd: str = ""                   # Working directory
    details: dict = field(default_factory=dict)  # Agent/tool-specific details

    # Security assessment
    risk_score: int = 0             # AI Guardian scan result (0-100)
    risk_level: str = "low"         # "low" | "medium" | "high" | "critical"
    matched_rules: list[str] = field(default_factory=list)  # IDs of triggered rules

    # Policy decision
    policy_decision: str = "allow"  # "allow" | "deny" | "review"
    policy_rule_id: str = ""        # Which policy rule matched

    # Metadata (auto-populated)
    timestamp: str = ""             # ISO 8601, auto-set if empty
    event_id: str = ""              # Unique ID, auto-set if empty

    # === AGI-era extension fields (stubs) ===
    # These are populated by future governance layers but the schema
    # supports them from day one.
    autonomy_level: int = 0         # 0=unset, 1=human-all, 5=fully-autonomous
    delegation_chain: list[str] = field(default_factory=list)
                                    # ["agent_a", "agent_b"] — who delegated to whom
    estimated_cost: float = 0.0     # Estimated API/compute cost in USD
    memory_scope: str = ""          # "session" | "persistent" | "department:sales"

    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()
        if not self.event_id:
            import uuid
            self.event_id = uuid.uuid4().hex[:12]
        if not self.user_id:
            try:
                self.user_id = getpass.getuser()
            except Exception:
                self.user_id = "unknown"

    def to_dict(self) -> dict:
        """Convert to JSON-serializable dict."""
        return asdict(self)


class ActivityStream:
    """Append-only event log stored as JSONL files.

    One file per day: .ai-guardian/logs/2026-03-28.jsonl
    Designed for grep, tail -f, and streaming ingestion.
    """

    def __init__(self, log_dir: str = ".ai-guardian/logs"):
        self.log_dir = Path(log_dir)
        self.log_dir.mkdir(parents=True, exist_ok=True)

    def _log_path(self, date: str | None = None) -> Path:
        if date is None:
            date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        return self.log_dir / f"{date}.jsonl"

    def record(self, event: ActivityEvent) -> None:
        """Append an event to the daily log file (atomic append)."""
        log_path = self._log_path()
        line = json.dumps(event.to_dict(), ensure_ascii=False, default=str)
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(line + "\n")

    def query(
        self,
        days: int = 7,
        action: str | None = None,
        agent_type: str | None = None,
        user_id: str | None = None,
        risk_above: int | None = None,
        policy_decision: str | None = None,
        limit: int = 100,
    ) -> list[ActivityEvent]:
        """Query events with filters across multiple days."""
        events: list[ActivityEvent] = []
        today = datetime.now(timezone.utc).date()

        for i in range(days):
            date = (today - timedelta(days=i)).isoformat()
            log_path = self._log_path(date)
            if not log_path.exists():
                continue
            with open(log_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    # Apply filters
                    if action and data.get("action") != action:
                        continue
                    if agent_type and data.get("agent_type") != agent_type:
                        continue
                    if user_id and data.get("user_id") != user_id:
                        continue
                    if risk_above is not None and data.get("risk_score", 0) <= risk_above:
                        continue
                    if policy_decision and data.get("policy_decision") != policy_decision:
                        continue

                    events.append(_dict_to_event(data))

                    if len(events) >= limit:
                        return events

        return events

    def summary(self, days: int = 7) -> dict:
        """Aggregate statistics over a time period."""
        events = self.query(days=days, limit=10000)
        if not events:
            return {
                "period_days": days,
                "total_events": 0,
                "by_action": {},
                "by_agent": {},
                "by_decision": {},
                "risk_distribution": {},
                "blocked_count": 0,
            }

        by_action: dict[str, int] = {}
        by_agent: dict[str, int] = {}
        by_decision: dict[str, int] = {}
        risk_dist: dict[str, int] = {"low": 0, "medium": 0, "high": 0, "critical": 0}

        for e in events:
            by_action[e.action] = by_action.get(e.action, 0) + 1
            by_agent[e.agent_type] = by_agent.get(e.agent_type, 0) + 1
            by_decision[e.policy_decision] = by_decision.get(e.policy_decision, 0) + 1
            if e.risk_level in risk_dist:
                risk_dist[e.risk_level] += 1

        return {
            "period_days": days,
            "total_events": len(events),
            "by_action": by_action,
            "by_agent": by_agent,
            "by_decision": by_decision,
            "risk_distribution": risk_dist,
            "blocked_count": by_decision.get("deny", 0),
        }

    def export_jsonl(self, output_path: str, days: int = 30) -> int:
        """Export events to a single JSONL file."""
        events = self.query(days=days, limit=100000)
        with open(output_path, "w", encoding="utf-8") as f:
            for e in events:
                f.write(json.dumps(e.to_dict(), ensure_ascii=False, default=str) + "\n")
        return len(events)


def _dict_to_event(data: dict) -> ActivityEvent:
    """Reconstruct ActivityEvent from dict (tolerant of missing fields)."""
    known_fields = {f.name for f in ActivityEvent.__dataclass_fields__.values()}
    filtered = {k: v for k, v in data.items() if k in known_fields}
    return ActivityEvent(**filtered)
