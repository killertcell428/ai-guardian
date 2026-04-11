"""Cryptographic Audit Log — tamper-evident logging for AI agents.

Provides HMAC-SHA256 signed log entries with hash chaining, so AI agents
cannot modify or delete their own audit trail. Based on the Immutable
Logging Kernel concept from Aegis (arxiv 2603.16938).

Usage::

    from ai_guardian.audit import SignedAuditLog, AuditVerifier

    # Create and populate a signed log
    log = SignedAuditLog(secret_key="my-secret")
    log.append(event_type="tool_call", actor="agent",
               action="shell:exec", target="/bin/ls")
    log.save("audit.jsonl")

    # Verify integrity later
    verifier = AuditVerifier(secret_key="my-secret")
    result = verifier.verify_file("audit.jsonl")
    assert result.valid
"""

from ai_guardian.audit.chain import HashChain
from ai_guardian.audit.signed_log import SignedAuditLog, SignedLogEntry
from ai_guardian.audit.verify import AuditVerifier, VerificationResult

__all__ = [
    "SignedLogEntry",
    "SignedAuditLog",
    "HashChain",
    "AuditVerifier",
    "VerificationResult",
]
