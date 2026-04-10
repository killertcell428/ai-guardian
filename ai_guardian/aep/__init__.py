"""Atomic Execution Pipeline (AEP) -- Layer 5 of ai-guardian v2.0.

Implements the **Scan -> Execute -> Vaporize** pattern as an indivisible
security primitive.

Public API::

    from ai_guardian.aep import AtomicPipeline, AEPResult

    pipe = AtomicPipeline()
    result: AEPResult = pipe.execute("echo hello")
"""

from ai_guardian.aep.pipeline import AEPResult, AtomicPipeline
from ai_guardian.aep.sandbox import ProcessSandbox, Sandbox, SandboxResult
from ai_guardian.aep.vaporizer import Vaporizer, VaporizeResult

__all__ = [
    "AtomicPipeline",
    "AEPResult",
    "Sandbox",
    "SandboxResult",
    "ProcessSandbox",
    "Vaporizer",
    "VaporizeResult",
]
