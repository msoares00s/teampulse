"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface Tool {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  available: boolean;
  teamName?: string;
}

const TOOLS: Tool[] = [
  {
    id: "slack",
    name: "Slack",
    description: "Team messaging and communication",
    connected: false,
    available: true,
  },
  {
    id: "gmail",
    name: "Gmail",
    description: "Email communication",
    connected: false,
    available: false,
  },
  {
    id: "notion",
    name: "Notion",
    description: "Documentation and project pages",
    connected: false,
    available: false,
  },
  {
    id: "linear",
    name: "Linear",
    description: "Issue tracking and project management",
    connected: false,
    available: false,
  },
  {
    id: "jira",
    name: "Jira",
    description: "Issue tracking for larger teams",
    connected: false,
    available: false,
  },
  {
    id: "hubspot",
    name: "HubSpot",
    description: "CRM and sales pipeline",
    connected: false,
    available: false,
  },
  {
    id: "pipedrive",
    name: "Pipedrive",
    description: "Sales CRM",
    connected: false,
    available: false,
  },
  {
    id: "gcal",
    name: "Google Calendar",
    description: "Meeting schedules and events",
    connected: false,
    available: false,
  },
];

function ToolsContent() {
  const [tools, setTools] = useState(TOOLS);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const slackConnected = searchParams.get("slack") === "connected";
    const oauthError = searchParams.get("error");

    if (oauthError) {
      const errorMessages: Record<string, string> = {
        slack_denied: "Slack authorization was denied",
        slack_not_configured: "Slack is not configured. Please add credentials.",
        slack_token_failed: "Failed to get Slack token",
        slack_failed: "Slack connection failed",
      };
      setError(errorMessages[oauthError] || "Connection failed");
      window.history.replaceState({}, "", "/dashboard/tools");
    }

    if (slackConnected) {
      localStorage.setItem("slackConnected", "true");
      const teamName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("slack_team_name="))
        ?.split("=")[1];

      setTools((prev) =>
        prev.map((t) =>
          t.id === "slack" ? { ...t, connected: true, teamName: teamName ? decodeURIComponent(teamName) : undefined } : t
        )
      );
      window.history.replaceState({}, "", "/dashboard/tools");
      return;
    }

    // Check for existing connection
    const hasSlackCookie = document.cookie.includes("slack_access_token");
    const wasConnected = localStorage.getItem("slackConnected") === "true";

    if (hasSlackCookie || wasConnected) {
      const teamName = document.cookie
        .split("; ")
        .find((row) => row.startsWith("slack_team_name="))
        ?.split("=")[1];

      setTools((prev) =>
        prev.map((t) =>
          t.id === "slack" ? { ...t, connected: true, teamName: teamName ? decodeURIComponent(teamName) : undefined } : t
        )
      );
    }
  }, [searchParams]);

  const connectTool = (id: string) => {
    const tool = tools.find((t) => t.id === id);
    if (!tool?.available) return;

    if (id === "slack") {
      window.location.href = "/api/oauth/slack";
    }
  };

  const disconnectTool = (id: string) => {
    if (id === "slack") {
      localStorage.removeItem("slackConnected");
      localStorage.removeItem("slackToken");
      document.cookie = "slack_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "slack_team_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setTools((prev) =>
        prev.map((t) => (t.id === "slack" ? { ...t, connected: false, teamName: undefined } : t))
      );
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Tools</h1>
        <p className="text-slate-500 mt-1">
          Connect the tools your team uses to get better insights.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-xs text-red-500 hover:text-red-700 mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.id}
            className={`bg-white rounded-xl border p-5 transition-colors ${
              !tool.available
                ? "border-slate-100 opacity-60"
                : tool.connected
                ? "border-green-200 bg-green-50/30"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold ${
                tool.connected ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
              }`}>
                {tool.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-slate-900">{tool.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">{tool.description}</p>
                <div className="mt-3">
                  {!tool.available ? (
                    <span className="text-xs text-slate-400 font-medium">Coming soon</span>
                  ) : tool.connected ? (
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Connected{tool.teamName && ` to ${tool.teamName}`}
                      </span>
                      <button
                        onClick={() => disconnectTool(tool.id)}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => connectTool(tool.id)}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ToolsPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <ToolsContent />
    </Suspense>
  );
}
