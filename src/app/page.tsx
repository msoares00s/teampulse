"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3 | 4 | 5;

interface OnboardingData {
  userName: string;
  companyName: string;
  companyUrl: string;
  teamSize: string;
  companyType: string;
  tools: string[];
  selectedAgent: string;
  reviewDay: string;
  reviewTime: string;
}

interface CompanyResearch {
  description: string;
  industry: string;
  insights: string[];
  suggestedWorkflows?: { name: string; reason: string }[];
  focusAreas?: string[];
}

interface SuggestedTask {
  id: string;
  title: string;
  description: string;
  frequency: string;
  enabled: boolean;
}

const AGENTS = [
  {
    id: "team-management",
    name: "Team Management Agent",
    description: "Weekly reviews, follow-ups, blockers, and team alignment",
    available: true,
  },
  {
    id: "sales",
    name: "Sales Agent",
    description: "Pipeline tracking, deal follow-ups, and revenue forecasting",
    available: false,
  },
  {
    id: "operations",
    name: "Operations Agent",
    description: "Resource allocation, capacity planning, and process optimization",
    available: false,
  },
];

const TEAM_SIZES = [
  { value: "1-5", label: "1-5 people" },
  { value: "6-15", label: "6-15 people" },
  { value: "16-30", label: "16-30 people" },
  { value: "31-50", label: "31-50 people" },
];

const COMPANY_TYPES = [
  "Solo Founder",
  "Agency",
  "Consultancy",
  "Studio",
  "Product Company",
  "Service Business",
];

const TOOLS = [
  { id: "slack", name: "Slack", available: true },
  { id: "gmail", name: "Gmail", available: false },
  { id: "notion", name: "Notion", available: false },
  { id: "linear", name: "Linear", available: false },
  { id: "jira", name: "Jira", available: false },
  { id: "hubspot", name: "HubSpot", available: false },
  { id: "pipedrive", name: "Pipedrive", available: false },
  { id: "gcal", name: "Google Calendar", available: false },
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIMES = ["8:00 AM", "9:00 AM", "10:00 AM", "2:00 PM", "4:00 PM"];

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<OnboardingData>({
    userName: "",
    companyName: "",
    companyUrl: "",
    teamSize: "",
    companyType: "",
    tools: ["slack"],
    selectedAgent: "team-management",
    reviewDay: "Monday",
    reviewTime: "9:00 AM",
  });
  const [research, setResearch] = useState<CompanyResearch | null>(null);
  const [researching, setResearching] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const router = useRouter();

  const generateTaskSuggestions = (researchData: CompanyResearch | null): SuggestedTask[] => {
    const tasks: SuggestedTask[] = [];
    const industry = researchData?.industry?.toLowerCase() || data.companyType?.toLowerCase() || "";
    const description = researchData?.description?.toLowerCase() || "";

    // Base tasks for team management
    tasks.push({
      id: "weekly-review",
      title: "Weekly Team Review",
      description: "Synthesize team updates, blockers, and priorities every week",
      frequency: "Weekly",
      enabled: true,
    });

    tasks.push({
      id: "followup-tracker",
      title: "Follow-up Tracker",
      description: "Track pending follow-ups and remind you before they go stale",
      frequency: "Daily",
      enabled: true,
    });

    // Industry-specific suggestions
    if (industry.includes("event") || description.includes("event")) {
      tasks.push({
        id: "event-prep",
        title: "Event Preparation Checklist",
        description: "Automated checklist and team coordination before each event",
        frequency: "Per event",
        enabled: true,
      });
    }

    if (industry.includes("agency") || industry.includes("consulting") || description.includes("client")) {
      tasks.push({
        id: "client-health",
        title: "Client Health Check",
        description: "Weekly pulse on client satisfaction and project status",
        frequency: "Weekly",
        enabled: true,
      });
    }

    if (industry.includes("saas") || industry.includes("software") || description.includes("product")) {
      tasks.push({
        id: "sprint-sync",
        title: "Sprint Progress Sync",
        description: "Aggregate engineering updates and flag at-risk deliverables",
        frequency: "Daily",
        enabled: true,
      });
    }

    // Add a decision tracker for all companies
    tasks.push({
      id: "decision-log",
      title: "Decision Tracker",
      description: "Log pending decisions and surface ones that need your input",
      frequency: "Continuous",
      enabled: true,
    });

    return tasks;
  };

  const startResearch = () => {
    if (data.companyUrl && !research && !researching) {
      setResearching(true);
      fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: data.companyUrl, companyName: data.companyName }),
      })
        .then((res) => res.ok ? res.json() : null)
        .then((result) => {
          if (result) {
            setResearch(result);
            const tasks = generateTaskSuggestions(result);
            setSuggestedTasks(tasks);
          }
        })
        .catch((error) => console.error("Research failed:", error))
        .finally(() => setResearching(false));
    }
  };

  const handleNext = () => {
    // Start research in background when leaving step 2 (company info)
    if (step === 2 && data.companyUrl && !research && !researching) {
      startResearch();
    }

    // Generate default tasks when reaching step 5 if research isn't done yet
    if (step === 4 && suggestedTasks.length === 0) {
      const defaultTasks = generateTaskSuggestions(research);
      setSuggestedTasks(defaultTasks);
    }

    setStep((s) => Math.min(s + 1, 5) as Step);
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const handleFinish = () => {
    const enabledTasks = suggestedTasks.filter(t => t.enabled);
    localStorage.setItem("teampulse_company", JSON.stringify({
      ...data,
      research,
      automatedTasks: enabledTasks,
    }));
    router.push("/dashboard");
  };

  const toggleTool = (toolId: string) => {
    const tool = TOOLS.find((t) => t.id === toolId);
    if (!tool?.available) return;

    setData((prev) => ({
      ...prev,
      tools: prev.tools.includes(toolId)
        ? prev.tools.filter((t) => t !== toolId)
        : [...prev.tools, toolId],
    }));
  };

  const toggleTask = (taskId: string) => {
    setSuggestedTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, enabled: !task.enabled } : task
      )
    );
  };

  const canProceed = () => {
    if (step === 1) return data.userName.trim().length > 0;
    if (step === 2) return data.companyName && data.companyUrl && data.teamSize;
    if (step === 3) return data.tools.length > 0;
    if (step === 4) return data.selectedAgent;
    return true;
  };

  const firstName = data.userName.split(" ")[0];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">T</span>
            </div>
            <span className="text-xl font-semibold text-slate-900">TeamPulse</span>
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">
            {step === 1 && "Welcome to TeamPulse"}
            {step === 2 && `Hello ${firstName}, tell us about your company`}
            {step === 3 && "Connect your tools"}
            {step === 4 && "Choose your agent"}
            {step === 5 && "Here's what I can help with"}
          </h1>
          <p className="text-slate-500">
            {step === 1 && "Let's get to know you first."}
            {step === 2 && "We'll research your company to personalize your experience."}
            {step === 3 && "Select the tools your team uses daily."}
            {step === 4 && "Select an AI agent to help manage your team."}
            {step === 5 && research && `Based on what I learned about ${data.companyName}, I suggest these automated tasks.`}
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-slate-900" : "bg-slate-200"
              }`}
            />
          ))}
        </div>

        {/* Step 1: Name */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What's your name?
              </label>
              <input
                type="text"
                value={data.userName}
                onChange={(e) => setData({ ...data, userName: e.target.value })}
                placeholder="e.g., André"
                autoFocus
                className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>
        )}

        {/* Step 2: Company Info */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company name
              </label>
              <input
                type="text"
                value={data.companyName}
                onChange={(e) => setData({ ...data, companyName: e.target.value })}
                placeholder="Acme Inc"
                className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company website
              </label>
              <input
                type="url"
                value={data.companyUrl}
                onChange={(e) => setData({ ...data, companyUrl: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-slate-50 border-0 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                We&apos;ll research your company to personalize your experience
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Team size
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TEAM_SIZES.map((size) => (
                  <button
                    key={size.value}
                    type="button"
                    onClick={() => setData({ ...data, teamSize: size.value })}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      data.teamSize === size.value
                        ? "bg-slate-900 text-white"
                        : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Step 3: Tools */}
        {step === 3 && (
          <div className="space-y-3">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => toggleTool(tool.id)}
                disabled={!tool.available}
                className={`w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all ${
                  !tool.available
                    ? "bg-slate-50 opacity-50 cursor-not-allowed"
                    : data.tools.includes(tool.id)
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <span className={`font-medium ${data.tools.includes(tool.id) && tool.available ? "text-white" : "text-slate-700"}`}>
                  {tool.name}
                </span>
                {!tool.available ? (
                  <span className="text-xs text-slate-400">Coming soon</span>
                ) : data.tools.includes(tool.id) ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : null}
              </button>
            ))}

            <p className="text-sm text-slate-400 text-center mt-4">
              More integrations coming soon. Slack is available for this demo.
            </p>
          </div>
        )}

        {/* Step 4: Agent Selection */}
        {step === 4 && (
          <div className="space-y-3">
            {AGENTS.map((agent) => (
              <button
                key={agent.id}
                type="button"
                onClick={() => agent.available && setData({ ...data, selectedAgent: agent.id })}
                disabled={!agent.available}
                className={`w-full flex items-start gap-4 px-4 py-4 rounded-xl transition-all text-left ${
                  !agent.available
                    ? "bg-slate-50 opacity-50 cursor-not-allowed"
                    : data.selectedAgent === agent.id
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${data.selectedAgent === agent.id && agent.available ? "text-white" : "text-slate-700"}`}>
                      {agent.name}
                    </span>
                    {!agent.available && (
                      <span className="text-xs text-slate-400">Coming soon</span>
                    )}
                    {agent.available && data.selectedAgent === agent.id && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${data.selectedAgent === agent.id && agent.available ? "text-slate-300" : "text-slate-500"}`}>
                    {agent.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 5: Task Suggestions */}
        {step === 5 && (
          <div className="space-y-4">
            {researching && (
              <div className="p-4 bg-slate-50 rounded-xl mb-6 flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                <p className="text-sm text-slate-600">
                  Analyzing {data.companyName}...
                </p>
              </div>
            )}

            {research && !researching && (
              <div className="p-4 bg-blue-50 rounded-xl mb-6">
                <p className="text-sm text-blue-800">
                  <strong>What I learned:</strong> {research.description}
                </p>
                {research.industry && (
                  <p className="text-sm text-blue-600 mt-1">Industry: {research.industry}</p>
                )}
              </div>
            )}

            {!researching && (
              <p className="text-sm font-medium text-slate-700 mb-3">
                Suggested automated tasks for {data.companyName}:
              </p>
            )}

            {!researching && suggestedTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => toggleTask(task.id)}
                className={`w-full flex items-start gap-4 px-4 py-4 rounded-xl transition-all text-left ${
                  task.enabled
                    ? "bg-slate-900 text-white"
                    : "bg-slate-50 hover:bg-slate-100"
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                  task.enabled ? "bg-white border-white" : "border-slate-300"
                }`}>
                  {task.enabled && (
                    <svg className="w-3 h-3 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium ${task.enabled ? "text-white" : "text-slate-700"}`}>
                      {task.title}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      task.enabled ? "bg-slate-700 text-slate-300" : "bg-slate-200 text-slate-500"
                    }`}>
                      {task.frequency}
                    </span>
                  </div>
                  <p className={`text-sm mt-1 ${task.enabled ? "text-slate-300" : "text-slate-500"}`}>
                    {task.description}
                  </p>
                </div>
              </button>
            ))}

            {!researching && suggestedTasks.length > 0 && (
              <div className="mt-6 p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600">
                  <strong>{suggestedTasks.filter(t => t.enabled).length}</strong> tasks will be automated. You can always adjust these later in settings.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-10 pt-6 border-t border-slate-100">
          {step > 1 ? (
            <button
              onClick={handleBack}
              className="px-6 py-3 text-slate-600 font-medium hover:text-slate-900"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={researching}
              className="px-8 py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {researching ? "Analyzing..." : "Start Automating"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
