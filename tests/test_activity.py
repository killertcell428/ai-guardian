"""Tests for Activity Stream."""
import json
import tempfile
from pathlib import Path

from ai_guardian.activity import ActivityStream, ActivityEvent


class TestActivityEvent:
    def test_default_fields(self):
        e = ActivityEvent(action="shell:exec", target="ls")
        assert e.action == "shell:exec"
        assert e.target == "ls"
        assert e.timestamp  # auto-set
        assert e.event_id  # auto-set
        assert e.user_id  # auto-set from getpass
        assert e.policy_decision == "allow"
        assert e.risk_score == 0

    def test_to_dict(self):
        e = ActivityEvent(action="file:read", target="/etc/passwd")
        d = e.to_dict()
        assert d["action"] == "file:read"
        assert d["target"] == "/etc/passwd"
        assert "timestamp" in d
        assert "event_id" in d

    def test_agi_fields(self):
        e = ActivityEvent(
            action="agent:spawn",
            target="sub_agent_1",
            autonomy_level=3,
            delegation_chain=["agent_a", "agent_b"],
            estimated_cost=0.05,
            memory_scope="department:sales",
        )
        assert e.autonomy_level == 3
        assert len(e.delegation_chain) == 2
        assert e.estimated_cost == 0.05
        assert e.memory_scope == "department:sales"


class TestActivityStream:
    def test_record_and_query(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            stream = ActivityStream(log_dir=tmpdir)
            event = ActivityEvent(action="shell:exec", target="ls -la")
            stream.record(event)

            events = stream.query(days=1)
            assert len(events) == 1
            assert events[0].action == "shell:exec"
            assert events[0].target == "ls -la"

    def test_query_filter_action(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            stream = ActivityStream(log_dir=tmpdir)
            stream.record(ActivityEvent(action="shell:exec", target="ls"))
            stream.record(ActivityEvent(action="file:read", target="/etc/passwd"))
            stream.record(ActivityEvent(action="shell:exec", target="pwd"))

            events = stream.query(days=1, action="shell:exec")
            assert len(events) == 2
            assert all(e.action == "shell:exec" for e in events)

    def test_query_filter_risk(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            stream = ActivityStream(log_dir=tmpdir)
            stream.record(ActivityEvent(action="shell:exec", target="ls", risk_score=0))
            stream.record(ActivityEvent(action="shell:exec", target="rm -rf", risk_score=90))

            events = stream.query(days=1, risk_above=50)
            assert len(events) == 1
            assert events[0].risk_score == 90

    def test_summary(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            stream = ActivityStream(log_dir=tmpdir)
            stream.record(ActivityEvent(action="shell:exec", target="ls", agent_type="claude_code"))
            stream.record(ActivityEvent(action="file:read", target="f.py", agent_type="claude_code"))
            stream.record(ActivityEvent(action="shell:exec", target="rm", policy_decision="deny"))

            summary = stream.summary(days=1)
            assert summary["total_events"] == 3
            assert summary["by_action"]["shell:exec"] == 2
            assert summary["by_agent"]["claude_code"] == 2
            assert summary["blocked_count"] == 1

    def test_export_jsonl(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            stream = ActivityStream(log_dir=tmpdir)
            stream.record(ActivityEvent(action="shell:exec", target="ls"))
            stream.record(ActivityEvent(action="file:read", target="f.py"))

            export_path = Path(tmpdir) / "export.jsonl"
            count = stream.export_jsonl(str(export_path), days=1)
            assert count == 2
            lines = export_path.read_text().strip().split("\n")
            assert len(lines) == 2

    def test_empty_stream(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            stream = ActivityStream(log_dir=tmpdir)
            events = stream.query(days=1)
            assert events == []
            summary = stream.summary(days=1)
            assert summary["total_events"] == 0
