"use client";

import { useState } from "react";
import { authApi } from "@/lib/api";

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  async function generateKey() {
    setGenerating(true);
    try {
      const res = await fetch("/api/v1/admin/api-keys/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("guardian_token")}`,
        },
      });
      const data = await res.json();
      setApiKey(data.api_key);
    } catch (e) {
      alert(`Error: ${e}`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">
          Tenant settings and API key management
        </p>
      </div>

      {/* API Key section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-slate-800">Proxy API Key</h2>
        <p className="text-sm text-slate-500">
          Use this key to authenticate requests to the AI Guardian proxy at{" "}
          <code className="bg-slate-100 px-1 rounded text-xs">
            POST /api/v1/proxy/chat/completions
          </code>
          . Pass it as a Bearer token in the Authorization header.
        </p>

        {apiKey ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <code className="text-sm text-green-800 break-all">{apiKey}</code>
            </div>
            <p className="text-xs text-red-600 font-medium">
              This key will not be shown again. Copy it now.
            </p>
          </div>
        ) : (
          <button
            onClick={generateKey}
            disabled={generating}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate New API Key"}
          </button>
        )}
      </div>

      {/* Proxy usage */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 mt-4">
        <h2 className="font-semibold text-slate-800">Proxy Usage</h2>
        <p className="text-sm text-slate-500">
          Replace your existing OpenAI base URL with the AI Guardian proxy:
        </p>
        <pre className="bg-slate-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto">
{`# Python example
import openai
client = openai.OpenAI(
    api_key="YOUR_GUARDIAN_API_KEY",
    base_url="https://your-domain.com/api/v1/proxy"
)

response = client.chat.completions.create(
    model="gpt-4o",
    messages=[{"role": "user", "content": "Hello!"}]
)`}
        </pre>
      </div>

      {/* Logout */}
      <div className="mt-6">
        <button
          onClick={() => {
            authApi.logout();
            window.location.href = "/login";
          }}
          className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
