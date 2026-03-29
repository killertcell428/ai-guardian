import clsx from "clsx";

interface Props {
  level: "low" | "medium" | "high" | "critical" | string;
  score?: number;
}

const config: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: "bg-green-100", text: "text-green-700", label: "Low" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Medium" },
  high: { bg: "bg-orange-100", text: "text-orange-700", label: "High" },
  critical: { bg: "bg-red-100", text: "text-red-700", label: "Critical" },
};

export default function RiskBadge({ level, score }: Props) {
  const c = config[level] ?? config["low"];
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
        c.bg,
        c.text
      )}
    >
      {c.label}
      {score !== undefined && <span className="opacity-70">({score})</span>}
    </span>
  );
}
