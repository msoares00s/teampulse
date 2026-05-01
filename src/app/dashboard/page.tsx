"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Review {
  topPriorities: Array<{ text: string; source: string }>;
  followUps: Array<{ text: string; source: string; urgent: boolean }>;
  blockers: Array<{ text: string; source: string; team: string }>;
  decisions: Array<{ text: string; source: string }>;
  teamUpdate: string;
  meetingAgenda: string[];
  generatedAt: string;
}

interface AutomatedTask {
  id: string;
  title: string;
  description: string;
  frequency: string;
}

interface CompanyData {
  userName?: string;
  companyName?: string;
  companyType?: string;
  teamSize?: string;
  selectedAgent?: string;
  automatedTasks?: AutomatedTask[];
  research?: {
    description: string;
    industry: string;
  };
}

export default function Dashboard() {
  const [slackConnected, setSlackConnected] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [generating, setGenerating] = useState(false);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Check for OAuth callback
    if (params.get("slack") === "connected") {
      setSlackConnected(true);
      localStorage.setItem("slackConnected", "true");
      window.history.replaceState({}, "", "/dashboard");
    } else {
      // Check if we have a real connection (cookie set by OAuth)
      const hasSlackCookie = document.cookie.includes("slack_access_token");
      const wasConnected = localStorage.getItem("slackConnected") === "true";

      if (hasSlackCookie || wasConnected) {
        setSlackConnected(true);
      } else {
        // Clear any old demo tokens
        localStorage.removeItem("slackToken");
        localStorage.removeItem("slackConnected");
      }
    }

    const saved = localStorage.getItem("teampulse_review");
    if (saved) setReview(JSON.parse(saved));

    const company = localStorage.getItem("teampulse_company");
    if (company) setCompanyData(JSON.parse(company));
  }, []);

  const connectSlack = () => {
    window.location.href = "/api/oauth/slack";
  };

  const [error, setError] = useState<string | null>(null);

  const generateReview = async () => {
    setGenerating(true);
    setError(null);
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
        if (data.error) {
          setError(data.error);
        } else {
          setReview(data);
          localStorage.setItem("teampulse_review", JSON.stringify(data));
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || `Failed to generate review (${res.status})`);
      }
    } catch (err) {
      console.error("Failed to generate review:", err);
      setError("Failed to connect to the server");
    } finally {
      setGenerating(false);
    }
  };

  const firstName = companyData?.userName?.split(" ")[0] || "there";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome back, {firstName}
          </h1>
          <p className="text-slate-500 mt-1">
            {companyData?.companyName ? `${companyData.companyName} · ` : ""}Your weekly management overview
          </p>
        </div>
        {slackConnected && (
          <button
            onClick={generateReview}
            disabled={generating}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Review"}
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700">{error}</p>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Active Automations */}
      {companyData?.automatedTasks && companyData.automatedTasks.length > 0 && (
        <div className="bg-slate-50 rounded-2xl p-6 mb-8">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Active Automations
          </h3>
          <div className="flex flex-wrap gap-2">
            {companyData.automatedTasks.map((task) => (
              <span
                key={task.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg text-sm text-slate-700 border border-slate-200"
              >
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                {task.title}
                <span className="text-slate-400 text-xs">· {task.frequency}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Connection CTA */}
      {!slackConnected && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center mb-8">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Connect Slack to get started</h2>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            TeamPulse will analyze your team&apos;s Slack activity to generate weekly management reviews.
          </p>
          <button
            onClick={connectSlack}
            className="px-6 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800"
          >
            Connect Slack
          </button>
        </div>
      )}

      {/* Empty State */}
      {slackConnected && !review && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-2">Ready to generate your first review</h2>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">
            Click the button above to analyze your team&apos;s activity and create a structured weekly review.
          </p>
        </div>
      )}

      {/* Review Summary */}
      {review && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Priorities */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Top Priorities
            </h3>
            <div className="space-y-3">
              {review.topPriorities?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-slate-900 text-sm">{item.text}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{item.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Missed Follow-ups */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Missed Follow-ups
            </h3>
            <div className="space-y-3">
              {review.followUps?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-2 h-2 rounded-full mt-1.5 ${item.urgent ? "bg-red-500" : "bg-amber-400"}`} />
                  <div>
                    <p className="text-slate-900 text-sm">{item.text}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{item.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blockers */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Stuck Work / Blockers
            </h3>
            <div className="space-y-3">
              {review.blockers?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5 bg-red-500" />
                  <div>
                    <p className="text-slate-900 text-sm">{item.text}</p>
                    <div className="flex gap-2 mt-0.5">
                      <span className="text-slate-400 text-xs">{item.source}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-400 text-xs">{item.team}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Decisions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Pending Decisions
            </h3>
            <div className="space-y-3">
              {review.decisions?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5 bg-purple-500" />
                  <div>
                    <p className="text-slate-900 text-sm">{item.text}</p>
                    <p className="text-slate-400 text-xs mt-0.5">{item.source}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team Update Draft */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Draft Team Update
            </h3>
            <p className="text-slate-700 text-sm leading-relaxed">{review.teamUpdate}</p>
          </div>

          {/* Meeting Agenda */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Suggested Meeting Agenda
            </h3>
            <ol className="space-y-2">
              {review.meetingAgenda?.slice(0, 5).map((item, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 bg-slate-100 text-slate-600 rounded flex items-center justify-center text-xs font-medium">
                    {idx + 1}
                  </span>
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* View Full Review Link */}
      {review && (
        <div className="mt-6 text-center">
          <Link
            href="/dashboard/review"
            className="text-sm text-slate-500 hover:text-slate-900 font-medium"
          >
            View full weekly review →
          </Link>
        </div>
      )}
    </div>
  );
}
