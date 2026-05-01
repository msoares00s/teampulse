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

      {/* Getting Started Checklist */}
      {!review && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Getting Started</h2>
          <div className="space-y-4">
            {/* Step 1: Connect Slack */}
            <div className={`flex items-center gap-4 p-4 rounded-xl ${slackConnected ? 'bg-green-50' : 'bg-slate-50'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                slackConnected ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {slackConnected ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">1</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${slackConnected ? 'text-green-800' : 'text-slate-900'}`}>
                  Connect Slack
                </h3>
                <p className={`text-sm ${slackConnected ? 'text-green-600' : 'text-slate-500'}`}>
                  {slackConnected ? 'Connected and ready to analyze' : 'Allow TeamPulse to read your team\'s messages'}
                </p>
              </div>
              {!slackConnected && (
                <button
                  onClick={connectSlack}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
                >
                  Connect
                </button>
              )}
            </div>

            {/* Step 2: Generate Review */}
            <div className={`flex items-center gap-4 p-4 rounded-xl ${
              !slackConnected ? 'bg-slate-50 opacity-50' : review ? 'bg-green-50' : 'bg-blue-50'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                review ? 'bg-green-500 text-white' : slackConnected ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-500'
              }`}>
                {review ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">2</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${review ? 'text-green-800' : slackConnected ? 'text-blue-800' : 'text-slate-500'}`}>
                  Generate your first review
                </h3>
                <p className={`text-sm ${review ? 'text-green-600' : slackConnected ? 'text-blue-600' : 'text-slate-400'}`}>
                  {review ? 'Review generated successfully' : 'Analyze your team\'s activity from the past week'}
                </p>
              </div>
              {slackConnected && !review && (
                <button
                  onClick={generateReview}
                  disabled={generating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              )}
            </div>
          </div>
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
