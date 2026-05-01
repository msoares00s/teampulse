"use client";

import { useState } from "react";

interface Review {
  followUps: Array<{ text: string; source: string; urgent: boolean }>;
  blockers: Array<{ text: string; source: string; team: string }>;
  decisions: Array<{ text: string; source: string; owner: string }>;
  updates: Array<{ text: string; source: string; sentiment: "positive" | "neutral" | "negative" }>;
  meetingAgenda: string[];
  generatedAt: string;
}

interface WeeklyReviewProps {
  review: Review;
  onRegenerate: () => void;
  generating: boolean;
}

type FeedbackType = "useful" | "wrong" | "ignore" | "followup";

export default function WeeklyReview({ review, onRegenerate, generating }: WeeklyReviewProps) {
  const [feedback, setFeedback] = useState<Record<string, FeedbackType>>({});

  const handleFeedback = (itemId: string, type: FeedbackType) => {
    setFeedback((prev) => ({ ...prev, [itemId]: type }));
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const FeedbackButtons = ({ itemId }: { itemId: string }) => (
    <div className="flex gap-1 mt-2">
      {[
        { type: "useful" as FeedbackType, label: "Useful", emoji: "👍" },
        { type: "wrong" as FeedbackType, label: "Wrong", emoji: "👎" },
        { type: "ignore" as FeedbackType, label: "Ignore", emoji: "🙈" },
        { type: "followup" as FeedbackType, label: "Follow up", emoji: "📌" },
      ].map(({ type, label, emoji }) => (
        <button
          key={type}
          onClick={() => handleFeedback(itemId, type)}
          className={`px-2 py-1 text-xs rounded transition-colors ${
            feedback[itemId] === type
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
          title={label}
        >
          {emoji}
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Weekly Operating Review</h2>
            <p className="text-slate-300 text-sm">{formatDate(review.generatedAt)}</p>
          </div>
          <button
            onClick={onRegenerate}
            disabled={generating}
            className="px-4 py-2 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            {generating ? "Regenerating..." : "Regenerate"}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* Follow-ups */}
        <section>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <span className="text-xl">📋</span>
            Follow-ups to Chase
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
              {review.followUps.length}
            </span>
          </h3>
          <div className="space-y-3">
            {review.followUps.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  item.urgent ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-slate-800">{item.text}</p>
                    <p className="text-xs text-slate-400 mt-1">Source: {item.source}</p>
                  </div>
                  {item.urgent && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">
                      Urgent
                    </span>
                  )}
                </div>
                <FeedbackButtons itemId={`followup-${idx}`} />
              </div>
            ))}
          </div>
        </section>

        {/* Blockers */}
        <section>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <span className="text-xl">🚧</span>
            Blockers Detected
            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
              {review.blockers.length}
            </span>
          </h3>
          <div className="space-y-3">
            {review.blockers.map((item, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-red-200 bg-red-50">
                <p className="text-slate-800">{item.text}</p>
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span>Team: {item.team}</span>
                  <span>Source: {item.source}</span>
                </div>
                <FeedbackButtons itemId={`blocker-${idx}`} />
              </div>
            ))}
          </div>
        </section>

        {/* Decisions */}
        <section>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <span className="text-xl">🎯</span>
            Pending Decisions
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
              {review.decisions.length}
            </span>
          </h3>
          <div className="space-y-3">
            {review.decisions.map((item, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-purple-200 bg-purple-50">
                <p className="text-slate-800">{item.text}</p>
                <div className="flex gap-4 mt-2 text-xs text-slate-500">
                  <span>Owner: {item.owner}</span>
                  <span>Source: {item.source}</span>
                </div>
                <FeedbackButtons itemId={`decision-${idx}`} />
              </div>
            ))}
          </div>
        </section>

        {/* Updates */}
        <section>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <span className="text-xl">📢</span>
            Team Updates
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              {review.updates.length}
            </span>
          </h3>
          <div className="space-y-3">
            {review.updates.map((item, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  item.sentiment === "positive"
                    ? "border-green-200 bg-green-50"
                    : item.sentiment === "negative"
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span>
                    {item.sentiment === "positive" ? "🎉" : item.sentiment === "negative" ? "⚠️" : "📝"}
                  </span>
                  <div className="flex-1">
                    <p className="text-slate-800">{item.text}</p>
                    <p className="text-xs text-slate-400 mt-1">Source: {item.source}</p>
                  </div>
                </div>
                <FeedbackButtons itemId={`update-${idx}`} />
              </div>
            ))}
          </div>
        </section>

        {/* Meeting Agenda */}
        <section className="bg-slate-100 rounded-lg p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800 mb-4">
            <span className="text-xl">📅</span>
            Draft Meeting Agenda
          </h3>
          <ol className="space-y-2">
            {review.meetingAgenda.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-700">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {idx + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
