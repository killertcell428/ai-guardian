"""AI Guardian CLI - command-line interface for agent governance.

Usage:
    aig init                     # Initialize AI Guardian in current project
    aig init --agent claude-code # Also configure Claude Code hooks
    aig doctor                   # Diagnose setup issues
    aig status                   # Show governance status summary
    aig logs                     # View recent activity
    aig logs --action shell:exec # Filter by action type
    aig logs --risk-above 50     # Filter by risk score
    aig logs --alerts            # Show blocked/reviewed events only
    aig logs --export-csv out.csv  # Export to CSV
    aig policy check             # Validate policy file
    aig policy show              # Show all rules
    aig scan "rm -rf /"          # Scan text for threats
    aig report --days 30         # Generate compliance report
    aig maintenance              # Rotate and compress old logs
"""

import argparse
import json
import sys
from pathlib import Path


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="aig",
        description="AI Guardian - Agent Governance CLI",
    )
    sub = parser.add_subparsers(dest="command")

    # aig init
    init_p = sub.add_parser("init", help="Initialize AI Guardian in current project")
    init_p.add_argument("--agent", choices=["claude-code"], help="Configure agent adapter")
    init_p.add_argument("--policy", choices=["developer", "reviewer", "restricted", "enterprise"],
                        default="developer", help="Policy template to use")

    # aig logs
    logs_p = sub.add_parser("logs", help="View activity stream")
    logs_p.add_argument("--action", help="Filter by action (e.g., shell:exec)")
    logs_p.add_argument("--agent-type", help="Filter by agent type")
    logs_p.add_argument("--risk-above", type=int, help="Show events with risk > N")
    logs_p.add_argument("--days", type=int, default=7, help="Days to look back (default: 7)")
    logs_p.add_argument("--limit", type=int, default=20, help="Max events (default: 20)")
    logs_p.add_argument("--json", action="store_true", help="Output as JSON")
    logs_p.add_argument("--global", dest="use_global", action="store_true", help="Query global logs (all projects)")
    logs_p.add_argument("--alerts", action="store_true", help="Show alerts only (blocked/reviewed)")
    logs_p.add_argument("--export-csv", metavar="PATH", help="Export to CSV file")
    logs_p.add_argument("--export-excel", metavar="PATH", help="Export summary + events to Excel-compatible CSVs")

    # aig policy
    policy_p = sub.add_parser("policy", help="Policy management")
    policy_p.add_argument("action", choices=["check", "show", "reset"], help="Policy action")

    # aig status
    sub.add_parser("status", help="Show governance status summary")

    # aig report
    report_p = sub.add_parser("report", help="Generate compliance report")
    report_p.add_argument("--days", type=int, default=30, help="Report period in days")
    report_p.add_argument("--format", choices=["text", "json"], default="text")

    # aig maintenance
    maint_p = sub.add_parser("maintenance", help="Log maintenance (rotate, compress)")
    maint_p.add_argument("--retention-days", type=int, default=60, help="Keep full logs for N days (default: 60)")
    maint_p.add_argument("--compress-after", type=int, default=7, help="Compress after N days (default: 7)")

    # aig doctor
    sub.add_parser("doctor", help="Diagnose AI Guardian setup issues")

    # aig scan (quick scan from CLI)
    scan_p = sub.add_parser("scan", help="Scan text for threats")
    scan_p.add_argument("text", nargs="?", help="Text to scan (or read from stdin)")

    args = parser.parse_args(argv)

    if args.command == "init":
        return cmd_init(args)
    elif args.command == "logs":
        return cmd_logs(args)
    elif args.command == "policy":
        return cmd_policy(args)
    elif args.command == "status":
        return cmd_status(args)
    elif args.command == "report":
        return cmd_report(args)
    elif args.command == "maintenance":
        return cmd_maintenance(args)
    elif args.command == "doctor":
        return cmd_doctor(args)
    elif args.command == "scan":
        return cmd_scan(args)
    else:
        parser.print_help()
        return 0


def _warn_if_hooks_disabled(project_dir: str = ".") -> None:
    """Check if Claude Code hooks are disabled and warn the user."""
    local_settings = Path(project_dir) / ".claude" / "settings.local.json"
    if not local_settings.exists():
        return
    try:
        raw = local_settings.read_bytes()
        text = raw.decode("utf-8-sig") if raw[:3] == b"\xef\xbb\xbf" else raw.decode("utf-8")
        data = json.loads(text)
        if data.get("disableAllHooks", False):
            print()
            print("  WARNING: disableAllHooks=true in .claude/settings.local.json")
            print("  All Claude Code hooks are disabled -- AI Guardian will NOT run.")
            print("  Fix: set disableAllHooks to false, or remove the key.")
    except (json.JSONDecodeError, UnicodeDecodeError, Exception):
        pass


def cmd_init(args) -> int:
    """Initialize AI Guardian in the current project."""
    from ai_guardian.policy import _default_policy, save_policy

    print("AI Guardian -Initializing project governance...")

    # Create .ai-guardian directory
    aig_dir = Path(".ai-guardian")
    aig_dir.mkdir(exist_ok=True)
    (aig_dir / "logs").mkdir(exist_ok=True)

    # Generate policy file
    policy_path = Path("ai-guardian-policy.yaml")
    if policy_path.exists():
        print(f"  Policy file already exists: {policy_path}")
    else:
        policy = _default_policy()
        policy.name = f"AI Guardian {args.policy.title()} Policy"
        save_policy(policy, str(policy_path))
        print(f"  Created policy: {policy_path} ({len(policy.rules)} rules)")

    # Configure Claude Code adapter if requested
    if args.agent == "claude-code":
        from ai_guardian.adapters.claude_code import install_hooks
        install_hooks(".")
        print("  Configured Claude Code hooks")

    # Warn if hooks are disabled
    _warn_if_hooks_disabled(project_dir=".")

    print()
    print("  Done! AI Guardian is ready.")
    print()
    print("  Next steps:")
    print("    aig doctor       -Check setup health")
    print("    aig status       -Check governance status")
    print("    aig logs         -View activity stream")
    print("    aig policy show  -View active policy")
    return 0


def cmd_logs(args) -> int:
    """View activity stream."""
    from ai_guardian.activity import ActivityStream

    stream = ActivityStream()

    # Excel export
    if args.export_excel:
        path = stream.export_excel_summary(args.export_excel, days=args.days, use_global=args.use_global)
        print(f"Exported to {path} and {path.replace('_summary', '_events')}")
        return 0

    # CSV export
    if args.export_csv:
        count = stream.export_csv(args.export_csv, days=args.days, use_global=args.use_global)
        print(f"Exported {count} events to {args.export_csv}")
        return 0

    events = stream.query(
        days=args.days,
        action=args.action,
        agent_type=args.agent_type,
        risk_above=args.risk_above,
        alerts_only=args.alerts,
        use_global=args.use_global,
        limit=args.limit,
    )

    if not events:
        print("No events found.")
        return 0

    if args.json:
        for e in events:
            print(json.dumps(e.to_dict(), ensure_ascii=False, default=str))
        return 0

    # Table format
    print(f"{'Time':>20} {'Action':>15} {'Target':>30} {'Risk':>5} {'Decision':>8}")
    print("-" * 82)
    for e in events:
        time_str = e.timestamp[11:19] if len(e.timestamp) > 19 else e.timestamp
        target = e.target[:30] if e.target else "-"
        decision_icon = {"allow": "  OK", "deny": "BLOCK", "review": " REV"}.get(e.policy_decision, "  ?")
        risk_color = e.risk_score
        print(f"{time_str:>20} {e.action:>15} {target:>30} {risk_color:>5} {decision_icon:>8}")

    print(f"\n{len(events)} events shown (last {args.days} days)")
    return 0


def cmd_policy(args) -> int:
    """Policy management."""
    from ai_guardian.policy import _default_policy, load_policy, save_policy

    if args.action == "check":
        policy_path = "ai-guardian-policy.yaml"
        if not Path(policy_path).exists():
            print(f"No policy file found at {policy_path}")
            print("Run 'aig init' to create one.")
            return 1
        policy = load_policy(policy_path)
        print(f"Policy: {policy.name} (v{policy.version})")
        print(f"Rules: {len(policy.rules)}")
        print(f"Default: {policy.default_decision}")
        deny_count = sum(1 for r in policy.rules if r.decision == "deny")
        review_count = sum(1 for r in policy.rules if r.decision == "review")
        print(f"Deny rules: {deny_count}, Review rules: {review_count}")
        print("Policy is valid.")
        return 0

    elif args.action == "show":
        policy = load_policy("ai-guardian-policy.yaml")
        for rule in policy.rules:
            icon = {"deny": "X", "review": "?", "allow": "O"}.get(rule.decision, " ")
            print(f"  [{icon}] {rule.id}: {rule.action} {rule.target} -> {rule.decision}")
            if rule.reason:
                print(f"      {rule.reason}")
        return 0

    elif args.action == "reset":
        policy = _default_policy()
        save_policy(policy)
        print("Policy reset to defaults.")
        return 0

    return 0


def cmd_status(args) -> int:
    """Show governance status summary."""
    from ai_guardian.activity import ActivityStream
    from ai_guardian.policy import load_policy

    print("AI Guardian -Governance Status")
    print("=" * 50)

    # Check policy
    policy_path = Path("ai-guardian-policy.yaml")
    if policy_path.exists():
        policy = load_policy(str(policy_path))
        deny = sum(1 for r in policy.rules if r.decision == "deny")
        review = sum(1 for r in policy.rules if r.decision == "review")
        print(f"  Policy: {policy.name} (v{policy.version})")
        print(f"  Rules: {len(policy.rules)} ({deny} deny, {review} review)")
    else:
        print("  Policy: Not configured (run 'aig init')")

    # Check activity
    stream = ActivityStream()
    summary = stream.summary(days=7)
    print("\n  Activity (last 7 days):")
    print(f"    Total events: {summary['total_events']}")
    print(f"    Blocked: {summary['blocked_count']}")
    if summary["by_agent"]:
        print(f"    Agents: {', '.join(summary['by_agent'].keys())}")

    # Check Claude Code hooks
    claude_hooks = Path(".claude/settings.json")
    if claude_hooks.exists():
        print("\n  Claude Code: Hooks configured")
    else:
        print("\n  Claude Code: Not configured (run 'aig init --agent claude-code')")

    # Compliance
    try:
        from ai_guardian.compliance import get_compliance_summary
        comp = get_compliance_summary()
        print(f"\n  Compliance: {comp['coverage_rate']}% ({comp['covered']}/{comp['total_requirements']} covered)")
    except Exception:
        pass

    return 0


def cmd_report(args) -> int:
    """Generate compliance report."""
    from ai_guardian.activity import ActivityStream
    from ai_guardian.compliance import get_compliance_summary

    stream = ActivityStream()
    summary = stream.summary(days=args.days)
    compliance = get_compliance_summary()

    report = {
        "activity_summary": summary,
        "compliance": compliance,
        "period_days": args.days,
    }

    if args.format == "json":
        print(json.dumps(report, ensure_ascii=False, indent=2, default=str))
    else:
        print(f"AI Guardian Compliance Report ({args.days} days)")
        print("=" * 50)
        print(f"  Total events: {summary['total_events']}")
        print(f"  Blocked: {summary['blocked_count']}")
        print(f"  Compliance: {compliance['coverage_rate']}%")
        print(f"  Regulations covered: {compliance['covered']}/{compliance['total_requirements']}")

    return 0


def cmd_maintenance(args) -> int:
    """Log maintenance: rotate and compress."""
    from ai_guardian.activity import ActivityStream

    stream = ActivityStream()
    stats = stream.rotate_logs(
        retention_days=args.retention_days,
        compress_after_days=args.compress_after,
    )
    print("Log maintenance complete:")
    print(f"  Compressed: {stats['compressed']} files")
    print(f"  Deleted (>{args.retention_days} days): {stats['deleted']} files")
    if stats["errors"]:
        print(f"  Errors: {stats['errors']}")
    print("\n  Note: Alert logs (~/.ai-guardian/alerts/) are never deleted.")
    return 0


def cmd_doctor(args) -> int:
    """Diagnose AI Guardian setup issues."""
    print("AI Guardian Doctor")
    print("=" * 50)

    passed = 0
    warned = 0
    failed = 0

    def ok(msg: str):
        nonlocal passed
        print(f"  [OK]   {msg}")
        passed += 1

    def warn(msg: str):
        nonlocal warned
        print(f"  [WARN] {msg}")
        warned += 1

    def fail(msg: str):
        nonlocal failed
        print(f"  [FAIL] {msg}")
        failed += 1

    # 1. Policy file
    policy_path = Path("ai-guardian-policy.yaml")
    if policy_path.exists():
        ok(f"Policy file found: {policy_path}")
    else:
        fail("Policy file not found. Run 'aig init'")

    # 2. .ai-guardian/logs/ directory
    log_dir = Path(".ai-guardian/logs")
    if log_dir.is_dir():
        ok(f"Log directory exists: {log_dir}")
    else:
        fail("Log directory missing: .ai-guardian/logs/")

    # 3. ai_guardian module importable
    try:
        from ai_guardian.activity import ActivityEvent, ActivityStream
        from ai_guardian.policy import evaluate, load_policy
        ok("ai_guardian module imports OK")
    except ImportError as e:
        fail(f"ai_guardian import failed: {e}")

    # 4. Claude Code hook script
    hook_script = Path(".claude/hooks/aig-guard.py")
    if hook_script.exists():
        ok(f"Hook script found: {hook_script}")
    else:
        warn("Hook script not found. Run 'aig init --agent claude-code'")

    # 5. Claude Code settings.json has hook configured
    settings_path = Path(".claude/settings.json")
    if settings_path.exists():
        try:
            settings = json.loads(settings_path.read_text(encoding="utf-8"))
            hooks = settings.get("hooks", {}).get("PreToolUse", [])
            has_aig = any(
                "aig-guard" in h.get("command", "")
                for m in hooks
                for h in m.get("hooks", [])
            )
            if has_aig:
                ok("PreToolUse hook configured in settings.json")
            else:
                fail("PreToolUse hook for AI Guardian not found in settings.json")
        except (json.JSONDecodeError, Exception) as e:
            fail(f"Cannot parse .claude/settings.json: {e}")
    else:
        warn(".claude/settings.json not found")

    # 6. Check disableAllHooks in settings.local.json
    local_settings_path = Path(".claude/settings.local.json")
    if local_settings_path.exists():
        try:
            raw = local_settings_path.read_bytes()
            text = raw.decode("utf-8-sig") if raw[:3] == b"\xef\xbb\xbf" else raw.decode("utf-8")
            local_settings = json.loads(text)
            if local_settings.get("disableAllHooks", False):
                fail(
                    "disableAllHooks=true in settings.local.json -- "
                    "ALL hooks are disabled! "
                    "Set to false or remove the key to enable AI Guardian."
                )
            else:
                ok("Hooks are enabled (disableAllHooks is not set)")
        except (json.JSONDecodeError, UnicodeDecodeError, Exception) as e:
            warn(f"Cannot parse settings.local.json: {e}")
    else:
        ok("No settings.local.json overrides")

    # 7. Check for recent log activity
    log_files = sorted(log_dir.glob("*.jsonl")) if log_dir.is_dir() else []
    if log_files:
        latest = log_files[-1]
        line_count = sum(1 for _ in open(latest, encoding="utf-8"))
        ok(f"Recent logs found: {latest.name} ({line_count} events)")
    else:
        warn(
            "No log files found. If you've used Claude Code recently, "
            "the hook may not be firing."
        )

    # 8. Check global log directory
    global_dir = Path.home() / ".ai-guardian" / "global"
    if global_dir.is_dir():
        global_files = sorted(global_dir.glob("*.jsonl"))
        if global_files:
            ok(f"Global logs: {len(global_files)} file(s)")
        else:
            warn("Global log directory exists but has no log files")
    else:
        warn("Global log directory not found (~/.ai-guardian/global/)")

    # Summary
    print()
    total = passed + warned + failed
    print(f"Results: {passed}/{total} passed", end="")
    if warned:
        print(f", {warned} warnings", end="")
    if failed:
        print(f", {failed} FAILED", end="")
    print()

    if failed:
        print("\nFix the FAIL items above, then run 'aig doctor' again.")
        return 1
    elif warned:
        print("\nNo critical issues. Review warnings above.")
        return 0
    else:
        print("\nAll checks passed. AI Guardian is healthy.")
        return 0


def cmd_scan(args) -> int:
    """Quick scan from CLI."""
    from ai_guardian import scan

    text = args.text
    if not text:
        text = sys.stdin.read()

    result = scan(text)
    if result.is_safe:
        print(f"SAFE (score={result.risk_score})")
    else:
        print(f"{result.risk_level.upper()} (score={result.risk_score})")
        for rule in result.matched_rules:
            print(f"  {rule.rule_name}: {rule.owasp_ref}")
            if rule.remediation_hint:
                print(f"    Fix: {rule.remediation_hint[:80]}")
    return 0 if result.is_safe else 1


if __name__ == "__main__":
    sys.exit(main())
