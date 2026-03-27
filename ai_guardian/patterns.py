"""Built-in detection patterns for AI Guardian.

Covers:
  - Prompt injection (EN + JA)
  - SQL injection
  - Data exfiltration
  - Command injection
  - PII detection (JP + international)
  - Confidential data markers
  - Output safety (PII leaks, secret leaks, harmful content)
"""

import re
from dataclasses import dataclass


@dataclass
class DetectionPattern:
    """A single detection rule."""
    id: str
    name: str
    category: str
    pattern: re.Pattern
    base_score: int
    description: str
    enabled: bool = True


def _p(pattern: str, flags: int = re.IGNORECASE | re.DOTALL) -> re.Pattern:
    return re.compile(pattern, flags)


# === Prompt Injection (English) ===
PROMPT_INJECTION_PATTERNS: list[DetectionPattern] = [
    DetectionPattern(
        id="pi_ignore_instructions",
        name="Ignore Previous Instructions",
        category="prompt_injection",
        pattern=_p(
            r"(ignore|disregard|forget|override|bypass)\s+(previous|prior|all|the|above|your|any)"
            r"\s+(instructions?|rules?|guidelines?|prompts?|constraints?|directions?|system)"
        ),
        base_score=40,
        description="Classic 'ignore previous instructions' prompt injection.",
    ),
    DetectionPattern(
        id="pi_jailbreak_dan",
        name="DAN / Jailbreak Persona",
        category="prompt_injection",
        pattern=_p(
            r"\b(DAN|jailbreak|do\s+anything\s+now|you\s+are\s+now\s+a|pretend\s+you\s+are"
            r"|act\s+as\s+if\s+you\s+have\s+no\s+restrictions|roleplay\s+as\s+an\s+ai\s+without)"
        ),
        base_score=50,
        description="DAN or jailbreak persona injection.",
    ),
    DetectionPattern(
        id="pi_system_prompt_leak",
        name="System Prompt Extraction",
        category="prompt_injection",
        pattern=_p(
            r"(print|show|reveal|output|repeat|tell\s+me|what\s+is|display)\s+"
            r"(your\s+)?(system\s+prompt|initial\s+prompt|original\s+instructions?|"
            r"base\s+prompt|full\s+prompt|hidden\s+instructions?)"
        ),
        base_score=45,
        description="Attempt to extract the system prompt.",
    ),
    DetectionPattern(
        id="pi_new_instructions",
        name="Instruction Override",
        category="prompt_injection",
        pattern=_p(
            r"(from\s+now\s+on|henceforth|starting\s+now|new\s+instructions?:"
            r"|your\s+new\s+task\s+is|you\s+must\s+now|your\s+only\s+goal\s+is)"
        ),
        base_score=35,
        description="Attempts to override AI behavior with new instructions.",
    ),
    DetectionPattern(
        id="pi_role_switch",
        name="Malicious Role Switch",
        category="prompt_injection",
        pattern=_p(
            r"(you\s+are\s+now|you\s+will\s+act\s+as|switch\s+to\s+mode|enter\s+"
            r"(dev|developer|god|admin|root|unrestricted|uncensored)\s+mode)"
        ),
        base_score=45,
        description="Attempts to switch AI to an unrestricted role.",
    ),
    DetectionPattern(
        id="pi_encoding_bypass",
        name="Encoding/Obfuscation Bypass",
        category="prompt_injection",
        pattern=_p(
            r"(base64|rot13|hex\s+encoded?|unicode\s+escape|url\s+encoded?)\s+"
            r"(instruction|command|prompt|message)"
        ),
        base_score=55,
        description="Attempts to use encoding to bypass filters.",
    ),
]

# === Prompt Injection (Japanese) ===
JAPANESE_INJECTION_PATTERNS: list[DetectionPattern] = [
    DetectionPattern(
        id="pi_jp_ignore",
        name="Ignore Instructions (JA)",
        category="prompt_injection",
        pattern=_p(
            r"(前の|以前の|上記の|これまでの|すべての)(指示|命令|ルール|制約|ガイドライン)を"
            r"(無視|忘れ|破棄|取り消|リセット)"
        ),
        base_score=40,
        description="Japanese: ignore previous instructions.",
    ),
    DetectionPattern(
        id="pi_jp_system_prompt",
        name="System Prompt Extraction (JA)",
        category="prompt_injection",
        pattern=_p(
            r"(システムプロンプト|初期設定|最初の指示|隠された指示|内部指示)"
            r".{0,10}(見せて|教えて|表示|出力|印刷|公開)"
        ),
        base_score=45,
        description="Japanese: system prompt extraction.",
    ),
    DetectionPattern(
        id="pi_jp_role_switch",
        name="Role Switch (JA)",
        category="prompt_injection",
        pattern=_p(
            r"(今から|これから)あなたは.{1,20}(として|になって|のふりをして|に切り替えて)"
        ),
        base_score=35,
        description="Japanese: role switch injection.",
    ),
    DetectionPattern(
        id="pi_jp_restriction_bypass",
        name="Restriction Bypass (JA)",
        category="prompt_injection",
        pattern=_p(
            r"(制限|制約|フィルター?|安全|セーフティ).{0,10}"
            r"(解除|無効|オフ|外して|なくして|無視)"
        ),
        base_score=45,
        description="Japanese: safety restriction bypass.",
    ),
]

# === SQL Injection ===
SQL_INJECTION_PATTERNS: list[DetectionPattern] = [
    DetectionPattern(id="sqli_union_select", name="UNION SELECT", category="sql_injection",
                     pattern=_p(r"(union\s+(all\s+)?select)"), base_score=70,
                     description="UNION-based SQL injection."),
    DetectionPattern(id="sqli_drop_table", name="DROP TABLE", category="sql_injection",
                     pattern=_p(r"\b(drop\s+table|drop\s+database|truncate\s+table)\b"), base_score=80,
                     description="Destructive DDL SQL injection."),
    DetectionPattern(id="sqli_boolean_blind", name="Boolean-based Blind SQLi", category="sql_injection",
                     pattern=_p(r"(\'\s*(or|and)\s*[\'\d].*=.*[\'\d]|\b(or|and)\s+\d+\s*=\s*\d+)"), base_score=65,
                     description="Boolean-based blind SQL injection."),
    DetectionPattern(id="sqli_comment", name="SQL Comment Injection", category="sql_injection",
                     pattern=_p(r"(--|#|\/\*|\*\/)\s*(or|and|select|insert|update|delete|drop)"), base_score=55,
                     description="SQL comment-based injection."),
    DetectionPattern(id="sqli_stacked", name="Stacked Queries", category="sql_injection",
                     pattern=_p(r";\s*(select|insert|update|delete|drop|create|alter|exec)\b"), base_score=70,
                     description="Stacked query SQL injection."),
    DetectionPattern(id="sqli_sleep_benchmark", name="Time-based Blind SQLi", category="sql_injection",
                     pattern=_p(r"\b(sleep\s*\(\d+\)|benchmark\s*\(\d+|waitfor\s+delay)\b"), base_score=75,
                     description="Time-based blind SQL injection."),
]

# === Data Exfiltration ===
DATA_EXFIL_PATTERNS: list[DetectionPattern] = [
    DetectionPattern(id="exfil_pii_request", name="PII Extraction Request", category="data_exfiltration",
                     pattern=_p(r"(list|extract|export|dump|retrieve)\s+(all\s+)?(user(s|\s+data)?|customer(s|\s+data)?|employee(s|\s+records?)?|personal\s+data|private\s+information|credentials?)"),
                     base_score=50, description="Attempts to extract PII."),
    DetectionPattern(id="exfil_api_keys", name="API Key / Secret Extraction", category="data_exfiltration",
                     pattern=_p(r"(show|give|tell|print|reveal)\s+(me\s+)?(the\s+)?(api\s+key|secret\s+key|private\s+key|access\s+token|password|credentials?)"),
                     base_score=60, description="Attempts to extract API keys or secrets."),
]

# === Command Injection ===
COMMAND_INJECTION_PATTERNS: list[DetectionPattern] = [
    DetectionPattern(id="cmdi_shell", name="Shell Command Injection", category="command_injection",
                     pattern=_p(r"(\b(exec|system|shell_exec|popen|subprocess|os\.system|eval)\s*\(|\$\(.*\)|`[^`]+`|\|\s*(bash|sh|cmd|powershell)\b)"),
                     base_score=70, description="Shell command injection."),
    DetectionPattern(id="cmdi_path_traversal", name="Path Traversal", category="command_injection",
                     pattern=_p(r"(\.\.\/|\.\.\\|%2e%2e%2f|%252e%252e%252f)"),
                     base_score=60, description="Path traversal attempt."),
]

# === PII Detection (Input) ===
PII_INPUT_PATTERNS: list[DetectionPattern] = [
    DetectionPattern(id="pii_jp_phone", name="Japanese Phone Number", category="pii_input",
                     pattern=_p(r"(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}|0[789]0[-\s]?\d{4}[-\s]?\d{4})"),
                     base_score=40, description="Japanese phone number in input."),
    DetectionPattern(id="pii_jp_my_number", name="Japanese My Number", category="pii_input",
                     pattern=_p(r"\b\d{4}\s?\d{4}\s?\d{4}\b"), base_score=70,
                     description="Japanese My Number (12 digits) in input."),
    DetectionPattern(id="pii_jp_postal_code", name="Japanese Postal Code", category="pii_input",
                     pattern=_p(r"〒?\s?\d{3}[-ー]\d{4}"), base_score=25,
                     description="Japanese postal code in input."),
    DetectionPattern(id="pii_jp_address", name="Japanese Address", category="pii_input",
                     pattern=_p(r"(東京都|北海道|(?:京都|大阪)府|.{2,3}県).{1,6}[市区町村郡].{1,10}[0-9０-９\-ー]+"),
                     base_score=40, description="Japanese address pattern in input."),
    DetectionPattern(id="pii_jp_bank_account", name="Japanese Bank Account", category="pii_input",
                     pattern=_p(r"(銀行|信用金庫|信金|ゆうちょ).{0,10}(支店|本店).{0,10}(普通|当座|貯蓄).{0,5}\d{6,8}"),
                     base_score=65, description="Japanese bank account details in input."),
    DetectionPattern(id="pii_credit_card_input", name="Credit Card in Input", category="pii_input",
                     pattern=_p(r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b"),
                     base_score=70, description="Credit card number in input."),
    DetectionPattern(id="pii_ssn_input", name="SSN in Input", category="pii_input",
                     pattern=_p(r"\b\d{3}-\d{2}-\d{4}\b"), base_score=65,
                     description="US Social Security Number in input."),
    DetectionPattern(id="pii_api_key_input", name="API Key in Input", category="pii_input",
                     pattern=_p(r"(sk-[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z\-_]{35}|ghp_[0-9A-Za-z]{36}|xox[baprs]-[0-9a-zA-Z\-]+|AKIA[0-9A-Z]{16})"),
                     base_score=80, description="API key or secret in input."),
]

# === Confidential Data ===
CONFIDENTIAL_DATA_PATTERNS: list[DetectionPattern] = [
    DetectionPattern(id="conf_internal_doc", name="Internal Document Markers", category="confidential",
                     pattern=_p(r"(社外秘|部外秘|極秘|confidential|internal\s+only|do\s+not\s+distribute|not\s+for\s+external)"),
                     base_score=50, description="Content marked as confidential."),
    DetectionPattern(id="conf_password_literal", name="Plaintext Password", category="confidential",
                     pattern=_p(r"(password|パスワード|pwd|passwd)\s*[:=]\s*\S{4,}"),
                     base_score=60, description="Plaintext password in input."),
    DetectionPattern(id="conf_connection_string", name="Database Connection String", category="confidential",
                     pattern=_p(r"(postgresql|mysql|mongodb|redis|mssql)://\S+:\S+@\S+"),
                     base_score=75, description="Database connection string with credentials."),
]

# === Output Safety ===
OUTPUT_PATTERNS: list[DetectionPattern] = [
    DetectionPattern(id="out_pii_ssn", name="SSN in Output", category="pii_leak",
                     pattern=_p(r"\b\d{3}-\d{2}-\d{4}\b"), base_score=70,
                     description="SSN in LLM output."),
    DetectionPattern(id="out_pii_credit_card", name="Credit Card in Output", category="pii_leak",
                     pattern=_p(r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b"),
                     base_score=80, description="Credit card in LLM output."),
    DetectionPattern(id="out_pii_email_bulk", name="Bulk Email Dump", category="pii_leak",
                     pattern=_p(r"([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}[\s,;]){3,}"),
                     base_score=55, description="Multiple email addresses in output."),
    DetectionPattern(id="out_secret_leak", name="Secret/API Key in Output", category="secret_leak",
                     pattern=_p(r"(sk-[a-zA-Z0-9]{20,}|AIza[0-9A-Za-z\-_]{35}|ghp_[0-9A-Za-z]{36}|xox[baprs]-[0-9a-zA-Z\-]+)"),
                     base_score=90, description="API key or secret in output."),
    DetectionPattern(id="out_harmful_instructions", name="Harmful Instructions", category="harmful_content",
                     pattern=_p(r"(step[\s\-]+by[\s\-]+step\s+(instructions?|guide|how\s+to)\s+(to\s+)?(make|create|build|synthesize)\s+(bomb|explosive|weapon|malware|virus))"),
                     base_score=95, description="Harmful step-by-step instructions."),
    DetectionPattern(id="out_pii_jp_my_number", name="My Number in Output", category="pii_leak",
                     pattern=_p(r"\b\d{4}\s?\d{4}\s?\d{4}\b"), base_score=75,
                     description="Japanese My Number in output."),
    DetectionPattern(id="out_pii_jp_phone", name="Japanese Phone in Output", category="pii_leak",
                     pattern=_p(r"(0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}|0[789]0[-\s]?\d{4}[-\s]?\d{4})"),
                     base_score=45, description="Japanese phone number in output."),
]

# === Combined ===
ALL_INPUT_PATTERNS: list[DetectionPattern] = (
    PROMPT_INJECTION_PATTERNS
    + JAPANESE_INJECTION_PATTERNS
    + SQL_INJECTION_PATTERNS
    + DATA_EXFIL_PATTERNS
    + COMMAND_INJECTION_PATTERNS
    + PII_INPUT_PATTERNS
    + CONFIDENTIAL_DATA_PATTERNS
)
