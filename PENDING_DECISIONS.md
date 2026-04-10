# Pending Design Decisions — v1.4.0 / v1.5.0

> This file tracks design decisions that need the project owner's input
> before finalizing the Phase 1 (Runtime Monitor) and Phase 2 (Memory + Multi-Agent) release.
>
> Status: **ALL IMPLEMENTATION COMPLETE — AWAITING DECISIONS**
> Created: 2026-04-11

---

## Decision 1: Graduated Containment — Auto-escalation Policy

The ContainmentManager escalates through levels: NORMAL → WARN → THROTTLE → RESTRICT → ISOLATE → STOP.

**Question:** Should escalation be fully automatic, or should higher levels (ISOLATE, STOP) require human confirmation?

| Option | Pros | Cons |
|--------|------|------|
| A) Fully automatic (default) | Fastest response, no human bottleneck | Could false-positive and lock out a legitimate session |
| B) Auto up to RESTRICT, human confirmation for ISOLATE/STOP | Balances speed with human oversight | Requires a confirmation mechanism (webhook? CLI prompt?) |
| C) All manual (alerts only, human decides) | Maximum control | Slow response, defeats the purpose of automated defense |

**Current default:** A (fully automatic). Can be changed per-deployment.

---

## Decision 2: Memory TTL — Default Rotation Policy

MemoryIntegrity supports TTL-based auto-expiry of memory entries to reduce persistence of poisoned content.

**Question:** What should the default TTL be?

| Option | Use case |
|--------|----------|
| A) No TTL (never expire) | Long-running projects where memory is valuable |
| B) 7 days | Balance between utility and poisoning risk |
| C) 24 hours | High-security environments |
| D) Configurable, default None (user opts in) | Maximum flexibility, but poisoning persists by default |

**Current default:** D (None, user opts in). Untrusted-source entries get a suggested TTL of 7 days in documentation.

---

## Decision 3: Version Strategy

Phase 1 and Phase 2 are being implemented together. How to version?

| Option | Description |
|--------|-------------|
| A) v1.4.0 = Phase 1 + Phase 2 combined | Single big release |
| B) v1.4.0 = Phase 1 (monitor), v1.5.0 = Phase 2 (memory + multi-agent) | Smaller incremental releases |
| C) v1.4.0 = all features, patch releases for fixes | One version, iterate with patches |

**Current plan:** A (combined release as v1.4.0) since they're being implemented together.

---

## Decision 4: Drift Detection — Statistical Only vs LLM-Assisted

DriftDetector currently uses pure statistical comparison (mean/stddev). An LLM-based intent classifier could catch semantic drift that statistics miss, but the project owner expressed concern about "AI detecting AI" being an arms race.

**Question:** Should we add an optional LLM-based drift classifier?

| Option | Pros | Cons |
|--------|------|------|
| A) Statistical only (current) | Zero deps, no arms race, deterministic | Misses semantic drift (e.g., benign-looking but malicious intent) |
| B) Statistical + optional LLM judge | Best coverage when enabled | Arms race concern, requires API key, adds latency |
| C) Statistical + rule-based heuristics (no LLM) | Better coverage than pure stats, still deterministic | Limited to predefined heuristics |

**Current implementation:** A (statistical only). Option C (heuristics) could be added later without architectural changes.

---

## Decision 5: Multi-Agent Trust Model

AgentTopology assigns trust levels to agents. This affects how strictly their messages are scanned.

**Question:** What should the default trust model be?

| Option | Description |
|--------|-------------|
| A) All agents untrusted by default (zero-trust) | Maximum security, requires explicit trust assignment |
| B) Orchestrator trusted, workers untrusted | Practical for most frameworks (LangGraph, CrewAI) |
| C) All agents trusted by default (opt-in security) | Easiest adoption, but risky |

**Current default:** A (zero-trust). The user can register agents with higher trust levels.

---

## Decision 6: SecurityMonitor Integration into Guard

SecurityMonitor can be integrated into the existing Guard class.

**Question:** How tightly should they be coupled?

| Option | Description |
|--------|-------------|
| A) Guard has optional `monitor` param, auto-records when present | Seamless but adds complexity to Guard |
| B) SecurityMonitor is standalone, wraps Guard | Clean separation, user composes them explicitly |
| C) Both (Guard param + standalone) | Maximum flexibility |

**Current implementation:** C (both). Guard accepts optional monitor, and SecurityMonitor can also be used independently.

---

## Implementation Status

| Module | Status | Agent |
|--------|--------|-------|
| `monitor/tracker.py` | ✅ Done (sliding window, thread-safe) | Phase 1 agent |
| `monitor/baseline.py` | ✅ Done (statistical profiling, JSON persist) | Phase 1 agent |
| `monitor/drift.py` | ✅ Done (4 drift checks, z-score) | Phase 1 agent |
| `monitor/anomaly.py` | ✅ Done (6 escalation chains, rapid-fire) | Phase 1 agent |
| `monitor/containment.py` | ✅ Done (6 levels, auto-escalation) | Phase 1 agent |
| `monitor/monitor.py` | ✅ Done (BehavioralMonitor orchestrator) | Phase 1 agent |
| `memory/scanner.py` | ✅ Done (16 patterns, EN+JA) | Phase 2a agent |
| `memory/integrity.py` | ✅ Done (SHA-256 + TTL) | Phase 2a agent |
| `multi_agent/message_scanner.py` | ✅ Done (18 patterns EN+JA, 3-layer scan) | Phase 2b agent |
| `multi_agent/topology.py` | ✅ Done (trust model, anomaly detection) | Phase 2b agent |
| Guard integration | ✅ Done (optional monitor param) | Phase 1 agent |
| Tests | ✅ 700 passed (144 new) | All agents |
| CHANGELOG + Release | ⏳ Waiting for decisions below | — |

---

## After Decisions

Once all decisions are confirmed:
1. Apply chosen defaults to the implemented code
2. Run full test suite
3. Update CHANGELOG.md
4. Commit, tag, push
5. Create GitHub Release with detailed notes
6. Update README + docs
