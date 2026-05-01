"use client";

import { useState, useEffect } from "react";

interface AutomatedTask {
  id: string;
  title: string;
  description: string;
  frequency: string;
  enabled?: boolean;
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

interface SlackStatus {
  connected: boolean;
  user?: string;
  team?: string;
}

interface SlackAudit {
  workspace: string;
  channels: Array<{
    id: string;
    name: string;
    isPrivate: boolean;
    memberCount: number;
    purpose: string;
  }>;
  teamMembers: Array<{
    id: string;
    name: string;
    displayName: string;
    title: string;
    avatar: string;
  }>;
  summary: {
    totalChannels: number;
    totalMembers: number;
    privateChannels: number;
    publicChannels: number;
  };
}

export default function Dashboard() {
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [slackStatus, setSlackStatus] = useState<SlackStatus | null>(null);
  const [checkingSlack, setCheckingSlack] = useState(true);
  const [audit, setAudit] = useState<SlackAudit | null>(null);
  const [auditing, setAuditing] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);

  useEffect(() => {
    // Load company data from localStorage
    const saved = localStorage.getItem("teampulse_company");
    if (saved) {
      setCompanyData(JSON.parse(saved));
    }

    // Load cached audit if exists
    const cachedAudit = localStorage.getItem("teampulse_audit");
    if (cachedAudit) {
      setAudit(JSON.parse(cachedAudit));
    }

    // Check Slack connection status
    checkSlackStatus();
  }, []);

  const checkSlackStatus = async () => {
    setCheckingSlack(true);
    try {
      const res = await fetch("/api/slack/status");
      const data = await res.json();
      setSlackStatus(data);
    } catch {
      setSlackStatus({ connected: false });
    } finally {
      setCheckingSlack(false);
    }
  };

  const connectSlack = () => {
    window.location.href = "/api/oauth/slack";
  };

  const runAudit = async () => {
    setAuditing(true);
    setAuditError(null);
    try {
      const res = await fetch("/api/slack/audit", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAudit(data);
        localStorage.setItem("teampulse_audit", JSON.stringify(data));
      } else {
        const error = await res.json();
        setAuditError(error.error || "Audit failed");
      }
    } catch {
      setAuditError("Failed to connect to server");
    } finally {
      setAuditing(false);
    }
  };

  const firstName = companyData?.userName?.split(" ")[0] || "there";
  const tasks = companyData?.automatedTasks || [];

  // Checklist state
  const slackConnected = slackStatus?.connected || false;
  const auditComplete = audit !== null;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">
          Welcome back, {firstName}
        </h1>
        <p className="text-slate-500 mt-1">
          {companyData?.companyName ? `${companyData.companyName} · ` : ""}
          Your management dashboard
        </p>
      </div>

      {/* Setup Checklist */}
      {(!slackConnected || !auditComplete) && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Setup Checklist</h2>
          <div className="space-y-4">
            {/* Step 1: Connect Slack */}
            <div className={`flex items-center gap-4 p-4 rounded-xl ${
              slackConnected ? "bg-green-50" : "bg-slate-50"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                slackConnected ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {checkingSlack ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
                ) : slackConnected ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">1</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${slackConnected ? "text-green-800" : "text-slate-900"}`}>
                  Connect Slack
                </h3>
                <p className={`text-sm ${slackConnected ? "text-green-600" : "text-slate-500"}`}>
                  {checkingSlack
                    ? "Checking connection..."
                    : slackConnected
                    ? `Connected to ${slackStatus?.team || "your workspace"}`
                    : "Connect your Slack workspace to get started"}
                </p>
              </div>
              {!checkingSlack && !slackConnected && (
                <button
                  onClick={connectSlack}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
                >
                  Connect
                </button>
              )}
            </div>

            {/* Step 2: Initial Audit */}
            <div className={`flex items-center gap-4 p-4 rounded-xl ${
              !slackConnected ? "bg-slate-50 opacity-50" : auditComplete ? "bg-green-50" : "bg-blue-50"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                auditComplete ? "bg-green-500 text-white" : slackConnected ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {auditing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : auditComplete ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">2</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${
                  auditComplete ? "text-green-800" : slackConnected ? "text-blue-800" : "text-slate-500"
                }`}>
                  Run Initial Audit
                </h3>
                <p className={`text-sm ${
                  auditComplete ? "text-green-600" : slackConnected ? "text-blue-600" : "text-slate-400"
                }`}>
                  {auditing
                    ? "Scanning channels and team members..."
                    : auditComplete
                    ? `Found ${audit.summary.totalChannels} channels and ${audit.summary.totalMembers} team members`
                    : "Scan your workspace to discover channels and team members"}
                </p>
              </div>
              {slackConnected && !auditComplete && !auditing && (
                <button
                  onClick={runAudit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Start Audit
                </button>
              )}
            </div>

            {auditError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{auditError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Results */}
      {audit && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Channels */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Channels
              </h3>
              <span className="text-xs text-slate-400">
                {audit.summary.totalChannels} total
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {audit.channels.slice(0, 10).map((channel) => (
                <div key={channel.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    channel.isPrivate ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    {channel.isPrivate ? "Private" : "Public"}
                  </span>
                  <span className="text-sm text-slate-900 font-medium">#{channel.name}</span>
                  <span className="text-xs text-slate-400 ml-auto">{channel.memberCount} members</span>
                </div>
              ))}
              {audit.channels.length > 10 && (
                <p className="text-xs text-slate-400 text-center pt-2">
                  +{audit.channels.length - 10} more channels
                </p>
              )}
            </div>
          </div>

          {/* Team Members */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
                Team Members
              </h3>
              <span className="text-xs text-slate-400">
                {audit.summary.totalMembers} total
              </span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {audit.teamMembers.slice(0, 10).map((member) => (
                <div key={member.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                  {member.avatar ? (
                    <img src={member.avatar} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                      <span className="text-xs text-slate-500 font-medium">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-900 font-medium truncate">{member.name}</p>
                    {member.title && (
                      <p className="text-xs text-slate-400 truncate">{member.title}</p>
                    )}
                  </div>
                </div>
              ))}
              {audit.teamMembers.length > 10 && (
                <p className="text-xs text-slate-400 text-center pt-2">
                  +{audit.teamMembers.length - 10} more members
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Automated Tasks */}
      {tasks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Your Automated Tasks
            </h3>
            <span className="text-xs text-slate-400">
              {tasks.length} active
            </span>
          </div>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-slate-900">{task.title}</h4>
                    <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded-full">
                      {task.frequency}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {slackConnected && auditComplete && tasks.length === 0 && (
        <div className="bg-slate-50 rounded-2xl p-8 text-center">
          <p className="text-slate-500">No automated tasks configured yet.</p>
          <p className="text-sm text-slate-400 mt-1">
            Go through onboarding to set up your first tasks.
          </p>
        </div>
      )}
    </div>
  );
}
