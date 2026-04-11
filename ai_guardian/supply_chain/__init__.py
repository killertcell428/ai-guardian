"""Supply Chain Security — defend against supply-chain attacks on AI tooling.

Covers three attack surfaces:

1. **MCP Tool Hash Pinning** (``hash_pin``) — detect unauthorized changes
   ("rug pulls") to MCP tool definitions after initial approval.
2. **AI Dependency SBOM** (``sbom``) — generate a Software Bill of Materials
   for Python packages, MCP tools, and models.
3. **Dependency Verification** (``verify``) — cross-reference installed
   packages against known-vulnerable versions (e.g. litellm malware) and
   pinned hashes.

Quick start::

    from ai_guardian.supply_chain import ToolPinManager, SBOMGenerator, DependencyVerifier

    # Pin MCP tools
    mgr = ToolPinManager()
    mgr.pin_tools(my_mcp_tools)
    mgr.save()

    # Generate SBOM
    sbom = SBOMGenerator()
    sbom.scan_python_packages()
    sbom.save()

    # Check for known-bad dependencies
    verifier = DependencyVerifier(sbom)
    for alert in verifier.verify_all():
        print(alert)
"""

from ai_guardian.supply_chain.hash_pin import (
    PinnedTool,
    ToolPinManager,
    ToolVerificationResult,
)
from ai_guardian.supply_chain.sbom import SBOMEntry, SBOMGenerator
from ai_guardian.supply_chain.verify import DependencyAlert, DependencyVerifier

__all__ = [
    # Hash pinning
    "ToolPinManager",
    "PinnedTool",
    "ToolVerificationResult",
    # SBOM
    "SBOMGenerator",
    "SBOMEntry",
    # Verification
    "DependencyVerifier",
    "DependencyAlert",
]
