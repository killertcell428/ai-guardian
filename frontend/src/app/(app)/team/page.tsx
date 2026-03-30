"use client";

import { useEffect, useState } from "react";
import { billingApi, teamApi, TeamMember, UsageStats } from "@/lib/api";

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("reviewer");
  const [invitePassword, setInvitePassword] = useState("");
  const [error, setError] = useState("");
  const [lang, setLang] = useState<"en" | "ja">("en");

  const load = () => {
    setLoading(true);
    Promise.all([teamApi.list().catch(() => []), billingApi.getUsage()])
      .then(([m, u]) => {
        setMembers(Array.isArray(m) ? m : []);
        setUsage(u);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleInvite = async () => {
    if (!inviteEmail || !inviteName || !invitePassword) return;
    setError("");
    try {
      await teamApi.invite(inviteEmail, inviteName, inviteRole, invitePassword);
      setShowInvite(false);
      setInviteEmail("");
      setInviteName("");
      setInvitePassword("");
      load();
    } catch (err: any) {
      setError(err.message || "Failed to invite member");
    }
  };

  const atLimit =
    usage?.team_limit !== null &&
    usage?.team_limit !== undefined &&
    usage?.team_size !== undefined &&
    usage.team_size >= usage.team_limit;

  const t = {
    en: {
      title: "Team Management",
      invite: "Invite Member",
      name: "Full Name",
      email: "Email",
      password: "Temp Password",
      role: "Role",
      send: "Send Invite",
      cancel: "Cancel",
      seats: "seats used",
      atLimit: "Team limit reached. Upgrade to add more members.",
    },
    ja: {
      title: "チーム管理",
      invite: "メンバー招待",
      name: "氏名",
      email: "メールアドレス",
      password: "仮パスワード",
      role: "ロール",
      send: "招待する",
      cancel: "キャンセル",
      seats: "席使用中",
      atLimit: "チーム上限に達しました。アップグレードしてメンバーを追加してください。",
    },
  }[lang];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{t.title}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "ja" : "en")}
            className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-500 hover:bg-slate-50"
          >
            {lang === "en" ? "日本語" : "English"}
          </button>
          <button
            onClick={() => setShowInvite(true)}
            disabled={atLimit}
            className="px-4 py-2 bg-sky-600 text-white text-sm rounded-lg font-medium hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t.invite}
          </button>
        </div>
      </div>

      {/* Seats indicator */}
      {usage && (
        <div className="text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{usage.team_size}</span>
          {" / "}
          {usage.team_limit ?? "Unlimited"} {t.seats}
        </div>
      )}

      {atLimit && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
          {t.atLimit}{" "}
          <a href="/billing" className="underline font-medium">
            Upgrade
          </a>
        </div>
      )}

      {/* Invite form */}
      {showInvite && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t.name}</label>
              <input
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t.email}</label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t.password}</label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t.role}</label>
              <select
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
              >
                <option value="reviewer">Reviewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleInvite}
              className="px-4 py-2 bg-sky-600 text-white text-sm rounded-lg font-medium hover:bg-sky-700"
            >
              {t.send}
            </button>
            <button
              onClick={() => setShowInvite(false)}
              className="px-4 py-2 text-slate-600 text-sm rounded-lg hover:bg-slate-100"
            >
              {t.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Members table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                  No team members yet
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{m.full_name}</td>
                  <td className="px-4 py-3 text-slate-600">{m.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        m.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        m.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {m.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
