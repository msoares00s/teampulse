"use client";

import { useState } from "react";

interface InsightCardProps {
  title: string;
  category: string;
  source: string;
  action?: string;
  urgent?: boolean;
  team?: string;
}

type Feedback = "useful" | "wrong" | "ignore" | "followup" | null;

export default function InsightCard({
  title,
  category,
  source,
  action,
  urgent,
  team,
}: InsightCardProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);

  const categoryColors: Record<string, string> = {
    Priority: "bg-blue-50 text-blue-700",
    "Follow-up": "bg-amber-50 text-amber-700",
    Blocker: "bg-red-50 text-red-700",
    Decision: "bg-purple-50 text-purple-700",
  };

  const feedbackButtons = [
    { key: "useful" as Feedback, label: "Useful", icon: "👍" },
    { key: "wrong" as Feedback, label: "Wrong", icon: "👎" },
    { key: "ignore" as Feedback, label: "Ignore", icon: "🙈" },
    { key: "followup" as Feedback, label: "Follow up", icon: "📌" },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Category & Urgent Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${categoryColors[category] || "bg-slate-100 text-slate-600"}`}>
              {category}
            </span>
            {urgent && (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">
                Urgent
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-slate-900 font-medium mb-2">{title}</h3>

          {/* Action */}
          {action && (
            <p className="text-sm text-slate-600 mb-2">
              <span className="font-medium">Suggested action:</span> {action}
            </p>
          )}

          {/* Meta */}
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Source: {source}</span>
            {team && (
              <>
                <span>·</span>
                <span>Team: {team}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Feedback */}
      <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
        <span className="text-xs text-slate-400 mr-2">Feedback:</span>
        {feedbackButtons.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setFeedback(feedback === key ? null : key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              feedback === key
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            title={label}
          >
            {icon} {label}
          </button>
        ))}
      </div>
    </div>
  );
}
