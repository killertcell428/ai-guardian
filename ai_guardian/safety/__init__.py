"""Safety Specification & Verifier (Layer 6).

Implements the "Guaranteed Safe AI" approach: define allowed effects as
formal specs, verify planned actions before execution, and produce
cryptographic-style proof certificates.

Quick start::

    from ai_guardian.safety import SafetyVerifier, DEFAULT_SAFETY_SPEC

    verifier = SafetyVerifier([DEFAULT_SAFETY_SPEC])
    cert = verifier.verify("file:write", "output.py")
    assert cert.verdict == "proven_safe"

    cert = verifier.verify("file:write", ".env.production")
    assert cert.verdict == "violation_found"
"""

from ai_guardian.safety.builtin_specs import DEFAULT_SAFETY_SPEC, STRICT_SAFETY_SPEC
from ai_guardian.safety.spec import EffectSpec, Invariant, SafetySpec
from ai_guardian.safety.verifier import ProofCertificate, SafetyVerifier

__all__ = [
    "EffectSpec",
    "Invariant",
    "SafetySpec",
    "ProofCertificate",
    "SafetyVerifier",
    "DEFAULT_SAFETY_SPEC",
    "STRICT_SAFETY_SPEC",
]
