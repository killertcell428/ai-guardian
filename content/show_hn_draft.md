# Show HN: AI Guardian — Open-source LLM security with remediation, not just blocking

## Title (for HN post)
Show HN: AI Guardian – Open-source LLM security scanner with remediation hints (Python, zero deps)

## URL
https://github.com/killertcell428/ai-guardian

## Text

I built an open-source Python library that scans LLM prompts and responses for security threats. The key difference from existing tools (LLM Guard, Rebuff, etc.) is that it doesn't just block — it explains WHY something was flagged and HOW to fix it.

**What it does:**
- 48 detection patterns (prompt injection, SQL injection, PII, secrets)
- OWASP LLM Top 10 and CWE classification on every detection
- Remediation hints: "Your request matched 'ignore previous instructions'. If you meant to reference earlier content, try 'skip the earlier section' instead."
- Auto-sanitization: `sanitize("Call me at 090-1234-5678")` → `"Call me at [PHONE_REDACTED]"`
- Layer 2 semantic similarity (catches paraphrased attacks that bypass regex)
- RAG context scanning (indirect prompt injection in retrieved documents)
- Multi-turn attack detection

**Zero dependencies** — pure Python stdlib. `pip install aig-guardian`

**Try the Gandalf Challenge:** An interactive game where you try to trick an AI into revealing a secret password. Each level uses progressively harder AI Guardian defenses. [Link]

Built for the Japanese market initially (native My Number / マイナンバー detection, Japanese prompt injection patterns, compliance reporting for Japan's AI regulations), but works for any language.

Would love feedback on the detection patterns and any bypass techniques you find!
