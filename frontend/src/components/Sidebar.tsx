"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/playground", label: "Playground", icon: "🧪" },
  { href: "/review", label: "Review Queue", icon: "🔍" },
  { href: "/policies", label: "Policies", icon: "🛡️" },
  { href: "/audit", label: "Audit Logs", icon: "📋" },
  { href: "/reports", label: "Reports", icon: "📄" },
  { href: "/settings", label: "Settings", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛡️</span>
          <div>
            <p className="font-bold text-lg leading-tight">AI Guardian</p>
            <p className="text-xs text-slate-400">Security Filter</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith(item.href)
                ? "bg-sky-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-slate-700 text-xs text-slate-500">
        v0.2.0
      </div>
    </aside>
  );
}
