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

from ai_guardian.scanner import scan, scan_output, scan_messages, ScanResult
from ai_guardian.patterns import DetectionPattern

__version__ = "0.1.0"
__all__ = ["scan", "scan_output", "scan_messages", "ScanResult", "DetectionPattern"]
