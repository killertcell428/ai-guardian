"use client";

import Link from "next/link";
import DocsLayout from "@/components/DocsLayout";
import { useLanguage } from "@/contexts/LanguageContext";

export default function DocsPage() {
  const { lang } = useLanguage();
  const ja = lang === "ja";

  const TOC = [
    { id: "what-is", label: ja ? "AI Guardianとは？" : "What is AI Guardian?" },
    { id: "architecture", label: ja ? "アーキテクチャ" : "Architecture" },
    { id: "quick-links", label: ja ? "クイックリンク" : "Quick Links" },
    { id: "support", label: ja ? "サポート" : "Support" },
  ];

  const quickLinks = [
    {
      href: "/docs/quickstart",
      title: ja ? "クイックスタート" : "Quickstart",
      desc: ja ? "5分で導入完了" : "Integrate in 5 minutes",
      icon: "🚀",
    },
    {
      href: "/docs/concepts",
      title: ja ? "コアコンセプト" : "Concepts",
      desc: ja ? "フィルター・スコアリング・HitL・ポリシー" : "Filters, scoring, HitL, policies",
      icon: "📚",
    },
    {
      href: "/docs/api-reference",
      title: ja ? "APIリファレンス" : "API Reference",
      desc: ja ? "エンドポイント一覧" : "Full endpoint documentation",
      icon: "🔌",
    },
    {
      href: "/docs/integrations/python",
      title: ja ? "Python インテグレーション" : "Python Integration",
      desc: ja ? "openai-python サンプルコード" : "openai-python examples",
      icon: "🐍",
    },
  ];

  return (
    <DocsLayout toc={TOC}>
      <h1 id="what-is">
        {ja ? "AI Guardian ドキュメント" : "AI Guardian Documentation"}
      </h1>

      <p className="lead">
        {ja
          ? "AI Guardian は、アプリとあらゆるLLMエンドポイントの間に配置するOpenAI互換のセキュリティプロキシです。すべてのリクエストとレスポンスを脅威分析し、設定したリスクポリシーに基づいてルーティング。判断が難しいケースには、人間によるレビューキューを提供します。"
          : "AI Guardian is an OpenAI-compatible security proxy that sits between your application and any LLM endpoint. It analyzes every request and response for threats, routes them based on a configurable risk policy, and provides a human-in-the-loop review queue for edge cases."}
      </p>

      <h2 id="architecture">{ja ? "アーキテクチャ" : "Architecture"}</h2>

      <p>
        {ja
          ? "AI Guardian の中核は、OpenAI と同じ"
          : "At its core, AI Guardian is a FastAPI application that implements the same"}{" "}
        <code>POST /v1/chat/completions</code>{" "}
        {ja
          ? "インターフェースを実装するFastAPIアプリです。アプリはOpenAIの代わりにAI Guardianにリクエストを送信します。AI Guardianは次の処理を行います："
          : "interface as OpenAI. Your application sends requests to AI Guardian instead of directly to OpenAI. AI Guardian then:"}
      </p>

      <ol>
        <li>
          <strong>{ja ? "入力をフィルタリング" : "Filters the input"}</strong>
          {" — "}{ja ? "20以上の脅威パターンでメッセージをスキャンし、リスクスコア（0〜100）を計算します。" : "scans messages for 20+ threat patterns and computes a risk score (0–100)."}
        </li>
        <li>
          <strong>{ja ? "ポリシーに基づいてルーティング" : "Routes based on policy"}</strong>
          {" — "}{ja ? "自動許可（安全）・人間レビューキュー（曖昧）・自動ブロック（危険）のいずれかを適用。" : "auto-allow (safe), queue for human review (ambiguous), or auto-block (dangerous)."}
        </li>
        <li>
          <strong>{ja ? "出力をフィルタリング" : "Filters the output"}</strong>
          {" — "}{ja ? "LLMレスポンスを返す前に、PIIリーク・APIキー・その他の機密データをスキャンします。" : "scans LLM responses for PII leaks, API keys, and other sensitive data before returning them."}
        </li>
        <li>
          <strong>{ja ? "すべてをログ記録" : "Logs everything"}</strong>
          {" — "}{ja ? "すべてのリクエストをフルメタデータとともに監査ログに記録します。" : "every request is written to the audit log with full metadata."}
        </li>
      </ol>

      <h2 id="quick-links">{ja ? "クイックリンク" : "Quick Links"}</h2>

      <div className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
        {quickLinks.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="flex items-start gap-3 p-4 border border-gray-200 rounded-xl hover:border-guardian-300 hover:bg-guardian-50 transition-colors no-underline"
          >
            <span className="text-2xl">{card.icon}</span>
            <div>
              <div className="font-semibold text-gray-900">{card.title}</div>
              <div className="text-sm text-gray-500">{card.desc}</div>
            </div>
          </Link>
        ))}
      </div>

      <h2 id="support">{ja ? "サポート" : "Support"}</h2>
      <p>
        {ja
          ? "バグや機能リクエストは"
          : "For bugs and feature requests, open an issue on"}{" "}
        <a href="https://github.com/killertcell428/ai-guardian" target="_blank" rel="noreferrer">GitHub</a>
        {ja ? "にIssueを立ててください。Enterpriseサポートはメールでお問い合わせください：" : ". For enterprise support, email"}{" "}
        <a href="mailto:ueda.bioinfo.base01@gmail.com">ueda.bioinfo.base01@gmail.com</a>.
      </p>
    </DocsLayout>
  );
}
