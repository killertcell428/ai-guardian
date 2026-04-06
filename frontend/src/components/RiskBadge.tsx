import clsx from "clsx";

interface Props {
  level: "low" | "medium" | "high" | "critical" | string;
  score?: number;
}

const config: Record<string, { bg: string; text: string; label: string }> = {
  low:      { bg: "bg-gd-safe-bg",   text: "text-gd-safe",   label: "Low" },
  medium:   { bg: "bg-gd-warn-bg",   text: "text-gd-warn",   label: "Medium" },
  high:     { bg: "bg-gd-danger-bg",  text: "text-gd-danger",  label: "High" },
  critical: { bg: "bg-gd-danger-bg",  text: "text-gd-danger",  label: "Critical" },
};

export default function RiskBadge({ level, score }: Props) {
  const c = config[level] ?? config["low"];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px]",
        c.bg, c.text
      )}
      style={{ fontWeight: 520 }}
    >
      {c.label}
      {score !== undefined && <span className="opacity-60">({score})</span>}
    </span>
  );
}
