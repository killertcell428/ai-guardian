"""AI Guardian CLI -command-line interface for agent governance.

Usage:
    aig init                     # Initialize AI Guardian in current project
    aig init --agent claude-code # Also configure Claude Code hooks
    aig logs                     # View recent activity
    aig logs --action shell:exec # Filter by action type
    aig logs --risk-above 50     # Filter by risk score
    aig policy check             # Validate policy file
    aig status                   # Show governance status summary
    aig report --days 30         # Generate compliance report
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

    # aig policy
    policy_p = sub.add_parser("policy", help="Policy management")
    policy_p.add_argument("action", choices=["check", "show", "reset"], help="Policy action")

    # aig status
    sub.add_parser("status", help="Show governance status summary")

    # aig report
    report_p = sub.add_parser("report", help="Generate compliance report")
    report_p.add_argument("--days", type=int, default=30, help="Report period in days")
    report_p.add_argument("--format", choices=["text", "json"], default="text")

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
    elif args.command == "scan":
        return cmd_scan(args)
    else:
        parser.print_help()
        return 0


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

    print()
    print("  Done! AI Guardian is ready.")
    print()
    print("  Next steps:")
    print("    aig status       -Check governance status")
    print("    aig logs         -View activity stream")
    print("    aig policy show  -View active policy")
    return 0


def cmd_logs(args) -> int:
    """View activity stream."""
    from ai_guardian.activity import ActivityStream

    stream = ActivityStream()
    events = stream.query(
        days=args.days,
        action=args.action,
        agent_type=args.agent_type,
        risk_above=args.risk_above,
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
    from ai_guardian.policy import load_policy, save_policy, _default_policy

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
    print(f"\n  Activity (last 7 days):")
    print(f"    Total events: {summary['total_events']}")
    print(f"    Blocked: {summary['blocked_count']}")
    if summary["by_agent"]:
        print(f"    Agents: {', '.join(summary['by_agent'].keys())}")

    # Check Claude Code hooks
    claude_hooks = Path(".claude/settings.json")
    if claude_hooks.exists():
        print(f"\n  Claude Code: Hooks configured")
    else:
        print(f"\n  Claude Code: Not configured (run 'aig init --agent claude-code')")

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
    from ai_guardian.compliance import get_compliance_summary, get_compliance_report

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
