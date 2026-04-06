# AI Guardian — MITRE ATLAS Coverage Matrix

> Last updated: 2026-04-06
> AI Guardian version: v1.0.0
> Reference: [MITRE ATLAS v5.4.0](https://atlas.mitre.org/)

## Overview

MITRE ATLAS (Adversarial Threat Landscape for AI Systems) catalogs adversarial tactics and techniques against AI systems. This document maps AI Guardian's 121 detection patterns to relevant ATLAS techniques, demonstrating coverage of real-world AI attack vectors.

## Coverage Summary

| ATLAS Tactic | Techniques | AI Guardian Coverage |
|-------------|:----------:|:--------------------:|
| Reconnaissance | 8 | Partial (2/8) |
| Resource Development | 5 | — |
| Initial Access | 9 | **Strong (7/9)** |
| ML Model Access | 5 | Partial (2/5) |
| Execution | 5 | **Strong (4/5)** |
| Persistence | 3 | Partial (1/3) |
| Privilege Escalation | 2 | **Full (2/2)** |
| Defense Evasion | 8 | **Strong (5/8)** |
| Credential Access | 3 | **Full (3/3)** |
| Discovery | 5 | Partial (2/5) |
| Collection | 4 | **Strong (3/4)** |
| Exfiltration | 4 | **Full (4/4)** |
| Impact | 6 | **Strong (4/6)** |

**Total: 40/67 applicable techniques covered (~60%)**

---

## Detailed Technique Mapping

### Initial Access

| ATLAS ID | Technique | AI Guardian Coverage | Patterns |
|----------|-----------|:-------------------:|----------|
| AML.T0051 | LLM Prompt Injection — Direct | **Full** | 18 prompt injection patterns (EN/JA/KO/ZH) + 6 jailbreak patterns + similarity detection |
| AML.T0051.001 | LLM Prompt Injection — Stored/Indirect | **Full** | 5 indirect injection patterns (`ii_*`) + `scan_rag_context()` API |
| AML.T0054 | LLM Jailbreak | **Full** | `jb_evil_roleplay`, `jb_no_restrictions`, `jb_fictional_bypass`, `jb_grandma_exploit`, `jb_developer_mode`, `jb_ignore_ethics` |
| AML.T0056 | LLM Prompt Injection via RAG Data Poisoning | **Full** | `ii_context_poisoning`, `ii_hidden_instruction`, `ii_invisible_text` + RAG scanning API |
| AML.T0043 | Adversarial Data in Training | Partial | Indirect detection via content scanning patterns |
| AML.T0052 | Phishing | Partial | Data exfiltration patterns detect phishing-related content |
| AML.T0057 | LLM Plugin Compromise | **Detected** | `ii_tool_abuse` detects tool/function call manipulation |

### Execution

| ATLAS ID | Technique | AI Guardian Coverage | Patterns |
|----------|-----------|:-------------------:|----------|
| AML.T0053 | Command and Control via LLM | **Full** | `cmdi_shell`, `cmdi_path_traversal`, `exfil_send_to_external` |
| AML.T0055 | Unsafe LLM Output Handling | **Full** | 7 output patterns including `out_harmful_instructions`, `out_secret_leak` |
| AML.T0058 | LLM Tool Misuse | **Full** | `ii_tool_abuse` + data exfiltration patterns |
| AML.T0059 | LLM-Assisted Code Execution | **Detected** | `cmdi_shell` detects shell command injection attempts |

### Privilege Escalation

| ATLAS ID | Technique | AI Guardian Coverage | Patterns |
|----------|-----------|:-------------------:|----------|
| AML.T0060 | LLM Privilege Escalation via Prompt | **Full** | `pi_role_switch` (4 languages), `jb_developer_mode`, `pi_system_prompt_leak` |
| AML.T0061 | LLM Guardrail Bypass | **Full** | `pi_encoding_bypass`, `jb_no_restrictions`, `jb_ignore_ethics`, restriction bypass patterns (JA/KO/ZH) |

### Defense Evasion

| ATLAS ID | Technique | AI Guardian Coverage | Patterns |
|----------|-----------|:-------------------:|----------|
| AML.T0015 | Evade ML Model — Adversarial Example | **Mitigated** | NFKC normalization, zero-width character removal, fullwidth→halfwidth conversion |
| AML.T0062 | LLM Prompt Obfuscation | **Full** | `pi_encoding_bypass` + text normalization layer |
| AML.T0063 | Token Manipulation | **Full** | `te_unicode_noise`, `te_null_byte_stuffing`, NFKC normalization |
| AML.T0064 | LLM Prompt Splitting | **Detected** | Similarity detection catches split/paraphrased attacks via sliding window |
| AML.T0065 | Context Window Overflow | **Full** | `te_repetition_flood_en`, `te_repetition_flood_ja`, `te_ignore_prefix_buried`, heuristic detection |

### Credential Access

| ATLAS ID | Technique | AI Guardian Coverage | Patterns |
|----------|-----------|:-------------------:|----------|
| AML.T0024 | Exfiltration via Cyber Means | **Full** | `exfil_send_to_external`, `exfil_keyword`, `ii_exfil_via_markdown` |
| AML.T0066 | LLM System Prompt Theft | **Full** | 12 prompt leak patterns (`pl_*`, `pi_*_system_prompt`) across 4 languages |
| AML.T0067 | LLM Credential Extraction | **Full** | `pii_api_key_input`, `conf_password_literal`, `conf_connection_string`, `out_secret_leak` |

### Collection

| ATLAS ID | Technique | AI Guardian Coverage | Patterns |
|----------|-----------|:-------------------:|----------|
| AML.T0025 | Exfiltration via ML Inference API | **Detected** | `exfil_api_keys`, `exfil_pii_request` |
| AML.T0035 | ML Artifact Collection | Partial | `conf_internal_doc` detects internal document markers |
| AML.T0068 | LLM Data Leakage | **Full** | 17 PII input patterns + 5 PII output patterns + 4 data exfiltration patterns |

### Exfiltration

| ATLAS ID | Technique | AI Guardian Coverage | Patterns |
|----------|-----------|:-------------------:|----------|
| AML.T0024 | Exfiltration via Cyber Means | **Full** | `exfil_send_to_external`, `exfil_keyword` |
| AML.T0069 | LLM Data Exfil via Output | **Full** | `out_pii_ssn`, `out_pii_credit_card`, `out_pii_email_bulk`, `out_secret_leak` |
| AML.T0070 | LLM Exfil via Embedded Links | **Full** | `ii_exfil_via_markdown` (markdown image + HTML img with query params) |
| AML.T0071 | LLM Exfil via Tool Calls | **Full** | `ii_tool_abuse` detects tool/function call manipulation for data exfil |

### Impact

| ATLAS ID | Technique | AI Guardian Coverage | Patterns |
|----------|-----------|:-------------------:|----------|
| AML.T0029 | Denial of ML Service | **Full** | 5 token exhaustion patterns + heuristic |
| AML.T0048 | External Harms — Financial | **Detected** | Financial PII patterns (credit card, bank account, SSN) |
| AML.T0049 | External Harms — Reputational | **Detected** | `out_harmful_instructions` prevents harmful content generation |
| AML.T0072 | LLM Harmful Content Generation | **Full** | `out_harmful_instructions` + jailbreak prevention (6 patterns) |

---

## Agentic AI Threat Coverage

MITRE ATLAS v5.4.0 introduced techniques specific to autonomous AI agents. AI Guardian's coverage:

| Agentic Threat | AI Guardian Mitigation |
|---------------|----------------------|
| Agent prompt injection via tools | `ii_tool_abuse` pattern |
| Agent data exfiltration | `exfil_*` + `ii_exfil_via_markdown` patterns |
| Agent privilege escalation | `pi_role_switch` + `jb_developer_mode` |
| Agent instruction override | `pi_ignore_instructions` (4 languages) |
| RAG poisoning of agent context | `scan_rag_context()` API + `ii_*` patterns |
| Multi-agent coordination attacks | LangGraph `GuardNode` integration |

---

## Detection Architecture vs. ATLAS Kill Chain

```
ATLAS Kill Chain Stage          AI Guardian Defense Layer
──────────────────────────────────────────────────────────
Reconnaissance                  (Limited — pre-interaction)
Resource Development            (Limited — pre-interaction)
Initial Access                  ██████████ Input filter (112 patterns)
ML Model Access                 ████░░░░░░ Policy + auth guidance
Execution                       ████████░░ Command injection + output filter
Persistence                     ███░░░░░░░ Context poisoning detection
Privilege Escalation            ██████████ Role switch + jailbreak detection
Defense Evasion                 ████████░░ Normalization + encoding bypass
Credential Access               ██████████ PII + secret detection
Discovery                       ████░░░░░░ System prompt leak prevention
Collection                      ████████░░ Data exfiltration detection
Exfiltration                    ██████████ Input + output + markdown exfil
Impact                          ████████░░ Token exhaustion + harmful content
```

---

## Compliance Statement

AI Guardian provides technical controls aligned with MITRE ATLAS adversarial techniques for AI systems. Coverage focuses on the most critical attack vectors in LLM/agent deployments:

- **60% of applicable ATLAS techniques** have active detection
- **Strongest coverage** in Initial Access, Privilege Escalation, Credential Access, and Exfiltration (the most common LLM attack paths)
- **Continuously expanding** through weekly research-driven pattern updates

Organizations can use this matrix to demonstrate AI threat coverage in security assessments and compliance documentation.
