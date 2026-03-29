interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: "default" | "red" | "yellow" | "green";
}

const colors = {
  default: "border-slate-200",
  red: "border-red-400 bg-red-50",
  yellow: "border-yellow-400 bg-yellow-50",
  green: "border-green-400 bg-green-50",
};

export default function StatCard({ title, value, subtitle, color = "default" }: Props) {
  return (
    <div className={`bg-white rounded-xl border-2 ${colors[color]} p-5 shadow-sm`}>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}
