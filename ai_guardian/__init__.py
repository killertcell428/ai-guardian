"""AI Guardian — Scan, score, and filter LLM requests for security threats.

Usage:
    from ai_guardian import scan, scan_output

    # Scan user input before sending to LLM
    result = scan("What is the capital of France?")
    print(result.risk_score)   # 0
    print(result.risk_level)   # "low"
    print(result.is_safe)      # True

    # Scan with custom rules
    result = scan(
        "Delete all records from the database",
        custom_rules=[{
            "id": "custom_001",
            "name": "Database deletion",
            "pattern": "delete.*records.*database",
            "score_delta": 50,
            "enabled": True,
        }]
    )

    # Scan LLM output before returning to user
    output_result = scan_output({"choices": [{"message": {"content": "..."}}]})
"""

from ai_guardian.scanner import scan, scan_output, scan_messages, scan_rag_context, sanitize, ScanResult
from ai_guardian.patterns import DetectionPattern
from ai_guardian.similarity import check_similarity
from ai_guardian.compliance import get_compliance_report, get_compliance_summary
from ai_guardian.activity import ActivityStream, ActivityEvent
from ai_guardian.policy import Policy, PolicyRule, load_policy, evaluate

__version__ = "0.3.0"
__all__ = [
    # Core scanning (v0.1.0)
    "scan", "scan_output", "scan_messages", "scan_rag_context", "sanitize",
    "ScanResult", "DetectionPattern", "check_similarity",
    # Compliance (v0.2.0)
    "get_compliance_report", "get_compliance_summary",
    # Agent Governance (v0.3.0)
    "ActivityStream", "ActivityEvent",
    "Policy", "PolicyRule", "load_policy", "evaluate",
]
