"use client";

import { ReactNode } from "react";

const PLAN_ORDER = ["free", "pro", "business", "enterprise"];

interface Props {
  requiredPlan: string;
  currentPlan: string;
  children: ReactNode;
}

export default function PlanGate({ requiredPlan, currentPlan, children }: Props) {
  const currentIdx = PLAN_ORDER.indexOf(currentPlan);
  const requiredIdx = PLAN_ORDER.indexOf(requiredPlan);

  if (currentIdx >= requiredIdx) {
    return <>{children}</>;
  }

  return (
    <div className="bg-gd-surface border-2 border-dashed border-gd-standard rounded-xl p-8 text-center">
      <p className="text-lg text-gd-text-primary" style={{ fontWeight: 560 }}>
        {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} Plan Required
      </p>
      <p className="text-sm text-gd-text-secondary mt-2">
        This feature requires the {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} plan
        or higher. You are currently on the {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)} plan.
      </p>
      <a
        href="/billing"
        className="inline-block mt-4 px-5 py-2.5 bg-gd-accent text-white rounded-lg text-sm shadow-gd-inset hover:bg-gd-accent-hover transition-colors"
        style={{ fontWeight: 520 }}
      >
        Upgrade Plan
      </a>
    </div>
  );
}
