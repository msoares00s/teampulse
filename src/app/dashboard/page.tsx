"use client";

import { useState, useEffect } from "react";

interface AutomatedTask {
  id: string;
  title: string;
  description: string;
  frequency: string;
  enabled: boolean;
}

interface CompanyData {
  userName?: string;
  companyName?: string;
  teamSize?: string;
  selectedAgent?: string;
  automatedTasks?: AutomatedTask[];
  research?: {
    description: string;
    industry: string;
    insights?: string[];
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
  const [suggestedTasks, setSuggestedTasks] = useState<AutomatedTask[]>([]);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [tasksConfigured, setTasksConfigured] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("teampulse_company");
    if (saved) {
      const data = JSON.parse(saved);
      setCompanyData(data);
      if (data.automatedTasks && data.automatedTasks.length > 0) {
        setTasksConfigured(true);
      }
    }

    const cachedAudit = localStorage.getItem("teampulse_audit");
    if (cachedAudit) {
      setAudit(JSON.parse(cachedAudit));
    }

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

        // Auto-generate task suggestions after audit
        generateTaskSuggestions(data);
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

  const generateTaskSuggestions = async (auditData: SlackAudit) => {
    setGeneratingTasks(true);
    setTaskError(null);
    try {
      const res = await fetch("/api/tasks/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          audit: auditData,
          research: companyData?.research,
          companyName: companyData?.companyName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.tasks && data.tasks.length > 0) {
          setSuggestedTasks(
            data.tasks.map((t: Omit<AutomatedTask, 'enabled'>) => ({ ...t, enabled: true }))
          );
        } else {
          setTaskError("No tasks were generated. Try again.");
        }
      } else {
        const error = await res.json();
        setTaskError(error.error || "Failed to generate suggestions");
      }
    } catch (error) {
      console.error("Failed to generate task suggestions:", error);
      setTaskError("Failed to connect to server");
    } finally {
      setGeneratingTasks(false);
    }
  };

  const toggleTask = (taskId: string) => {
    setSuggestedTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, enabled: !t.enabled } : t))
    );
  };

  const saveTasks = () => {
    const enabledTasks = suggestedTasks.filter((t) => t.enabled);
    const updated = { ...companyData, automatedTasks: enabledTasks };
    localStorage.setItem("teampulse_company", JSON.stringify(updated));
    setCompanyData(updated);
    setTasksConfigured(true);
  };

  const firstName = companyData?.userName?.split(" ")[0] || "there";
  const tasks = companyData?.automatedTasks || [];

  const slackConnected = slackStatus?.connected || false;
  const auditComplete = audit !== null;
  const setupComplete = slackConnected && auditComplete && tasksConfigured;

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
      {!setupComplete && (
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

            {/* Step 3: Configure Tasks */}
            <div className={`flex items-center gap-4 p-4 rounded-xl ${
              !auditComplete ? "bg-slate-50 opacity-50" : tasksConfigured ? "bg-green-50" : "bg-purple-50"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                tasksConfigured ? "bg-green-500 text-white" : auditComplete ? "bg-purple-500 text-white" : "bg-slate-200 text-slate-500"
              }`}>
                {generatingTasks ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : tasksConfigured ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">3</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-medium ${
                  tasksConfigured ? "text-green-800" : auditComplete ? "text-purple-800" : "text-slate-500"
                }`}>
                  Configure Tasks
                </h3>
                <p className={`text-sm ${
                  tasksConfigured ? "text-green-600" : auditComplete ? "text-purple-600" : "text-slate-400"
                }`}>
                  {generatingTasks
                    ? "Analyzing your workspace and generating suggestions..."
                    : tasksConfigured
                    ? `${tasks.length} tasks configured`
                    : suggestedTasks.length > 0
                    ? "Review the suggested tasks below"
                    : "Generate task suggestions based on your workspace"}
                </p>
              </div>
              {auditComplete && !tasksConfigured && !generatingTasks && suggestedTasks.length === 0 && (
                <button
                  onClick={() => audit && generateTaskSuggestions(audit)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Generate Suggestions
                </button>
              )}
            </div>

            {auditError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{auditError}</p>
              </div>
            )}

            {taskError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{taskError}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggested Tasks (after audit, before configuration) */}
      {auditComplete && !tasksConfigured && suggestedTasks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Suggested Tasks</h3>
              <p className="text-sm text-slate-500 mt-1">
                Based on your Slack workspace and company profile
              </p>
            </div>
            <button
              onClick={saveTasks}
              disabled={suggestedTasks.filter((t) => t.enabled).length === 0}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              Save Tasks ({suggestedTasks.filter((t) => t.enabled).length})
            </button>
          </div>
          <div className="space-y-3">
            {suggestedTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left border ${
                  task.enabled
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  task.enabled ? "bg-white border-white" : "border-slate-300"
                }`}>
                  {task.enabled && (
                    <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${task.enabled ? "text-white" : "text-slate-900"}`}>
                      {task.title}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      task.enabled ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-500"
                    }`}>
                      {task.frequency}
                    </span>
                  </div>
                  <p className={`text-sm mt-0.5 ${task.enabled ? "text-slate-300" : "text-slate-500"}`}>
                    {task.description}
                  </p>
                </div>
              </button>
            ))}
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

      {/* Configured Tasks */}
      {tasksConfigured && tasks.length > 0 && (
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
    </div>
  );
}
