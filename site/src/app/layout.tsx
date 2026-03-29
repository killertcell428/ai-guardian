import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  title: {
    default: "AI Guardian — Protect Your LLM from Threats",
    template: "%s | AI Guardian",
  },
  description:
    "AI Guardian is an OpenAI-compatible security proxy that blocks prompt injection, SQL injection, and data leaks — with human-in-the-loop review.",
  keywords: ["AI security", "prompt injection", "LLM proxy", "AI firewall", "human in the loop"],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "AI Guardian — Protect Your LLM from Threats",
    description:
      "Drop-in OpenAI-compatible security proxy. Block threats before they reach your LLM.",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "AI Guardian — Protect Your LLM from Threats",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Guardian — Protect Your LLM from Threats",
    description: "Drop-in OpenAI-compatible security proxy. Block threats before they reach your LLM.",
    images: ["/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
