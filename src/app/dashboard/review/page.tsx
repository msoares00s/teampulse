"use client";

import { useState, useEffect } from "react";
import InsightCard from "@/components/InsightCard";

interface Review {
  topPriorities: Array<{ text: string; source: string; action?: string }>;
  followUps: Array<{ text: string; source: string; urgent: boolean; action?: string }>;
  blockers: Array<{ text: string; source: string; team: string; action?: string }>;
  decisions: Array<{ text: string; source: string; action?: string }>;
  teamUpdate: string;
  meetingAgenda: string[];
  generatedAt: string;
}

export default function ReviewPage() {
  const [review, setReview] = useState<Review | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("teampulse_review");
    if (saved) setReview(JSON.parse(saved));
  }, []);

  const generateReview = async () => {
    setGenerating(true);
    try {
      const company = JSON.parse(localStorage.getItem("teampulse_company") || "{}");
      const res = await fetch("/api/agents/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyContext: {
            name: company.companyName || "Your Company",
            type: company.companyType || "Product Company",
            teamSize: company.teamSize || "6-15",
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReview(data);
        localStorage.setItem("teampulse_review", JSON.stringify(data));
      }
    } catch (error) {
      console.error("Failed to generate review:", error);
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!review) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">No review yet</h1>
          <p className="text-slate-500 mb-8">Generate your first weekly review to see insights here.</p>
          <button
            onClick={generateReview}
            disabled={generating}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Weekly Review"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Weekly Review</h1>
          <p className="text-slate-500 mt-1">{formatDate(review.generatedAt)}</p>
        </div>
        <button
          onClick={generateReview}
          disabled={generating}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {generating ? "Regenerating..." : "Regenerate"}
        </button>
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {/* Top Priorities */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Top Priorities
          </h2>
          <div className="space-y-3">
            {review.topPriorities?.map((item, idx) => (
              <InsightCard
                key={idx}
                title={item.text}
                category="Priority"
                source={item.source}
                action={item.action}
              />
            ))}
          </div>
        </section>

        {/* Missed Follow-ups */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Missed Follow-ups
          </h2>
          <div className="space-y-3">
            {review.followUps?.map((item, idx) => (
              <InsightCard
                key={idx}
                title={item.text}
                category="Follow-up"
                source={item.source}
                action={item.action}
                urgent={item.urgent}
              />
            ))}
          </div>
        </section>

        {/* Blockers */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Stuck Work / Blockers
          </h2>
          <div className="space-y-3">
            {review.blockers?.map((item, idx) => (
              <InsightCard
                key={idx}
                title={item.text}
                category="Blocker"
                source={item.source}
                action={item.action}
                team={item.team}
              />
            ))}
          </div>
        </section>

        {/* Pending Decisions */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Pending Decisions
          </h2>
          <div className="space-y-3">
            {review.decisions?.map((item, idx) => (
              <InsightCard
                key={idx}
                title={item.text}
                category="Decision"
                source={item.source}
                action={item.action}
              />
            ))}
          </div>
        </section>

        {/* Draft Team Update */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Draft Team Update
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{review.teamUpdate}</p>
            <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
              <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200">
                Copy
              </button>
              <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200">
                Edit
              </button>
            </div>
          </div>
        </section>

        {/* Meeting Agenda */}
        <section>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Suggested Meeting Agenda
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <ol className="space-y-3">
              {review.meetingAgenda?.map((item, idx) => (
                <li key={idx} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center text-sm font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700 pt-0.5">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
