"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Step = 1 | 2 | 3 | 4 | 5;

interface OnboardingData {
  userName: string;
  companyName: string;
  companyUrl: string;
  teamSize: string;
  tools: string[];
  selectedAgent: string;
}

interface SuggestedTask {
  id: string;
  title: string;
  description: string;
  frequency: string;
  enabled: boolean;
}

interface CompanyResearch {
  description: string;
  industry: string;
  insights: string[];
  suggestedTasks?: { id: string; title: string; description: string; frequency: string }[];
}

const TEAM_SIZES = [
  { value: "1-5", label: "1-5 people" },
  { value: "6-15", label: "6-15 people" },
  { value: "16-30", label: "16-30 people" },
  { value: "31-50", label: "31-50 people" },
];

const TOOLS = [
  { id: "slack", name: "Slack", description: "Pull stuck threads and unanswered questions.", available: true },
  { id: "gmail", name: "Gmail", description: "Surface unread threads and missed replies.", available: false },
  { id: "notion", name: "Notion", description: "Read project pages and decision docs.", available: false },
  { id: "jira", name: "Jira", description: "Track tickets blocked or overdue.", available: false },
  { id: "linear", name: "Linear", description: "Pull issue progress and stalled cycles.", available: false },
  { id: "hubspot", name: "HubSpot", description: "Watch deals waiting on next steps.", available: false },
  { id: "pipedrive", name: "Pipedrive", description: "Catch pipeline gaps and stale deals.", available: false },
  { id: "gcal", name: "Google Calendar", description: "Pull recurring meetings and conflicts.", available: false },
];

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

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<OnboardingData>({
    userName: "",
    companyName: "",
    companyUrl: "",
    teamSize: "",
    tools: [],
    selectedAgent: "team-management",
  });
  const [research, setResearch] = useState<CompanyResearch | null>(null);
  const [researching, setResearching] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([]);
  const router = useRouter();

  const processTasksFromResearch = (researchData: CompanyResearch): SuggestedTask[] => {
    if (researchData.suggestedTasks && researchData.suggestedTasks.length > 0) {
      return researchData.suggestedTasks.map((task) => ({
        ...task,
        enabled: true,
      }));
    }

    // Fallback tasks if API doesn't return any
    return [
      {
        id: "weekly-review",
        title: "Weekly Team Review",
        description: "Synthesize team updates, blockers, and priorities every week",
        frequency: "Weekly",
        enabled: true,
      },
      {
        id: "followup-tracker",
        title: "Follow-up Tracker",
        description: "Track pending follow-ups and remind you before they go stale",
        frequency: "Daily",
        enabled: true,
      },
      {
        id: "decision-log",
        title: "Decision Tracker",
        description: "Log pending decisions and surface ones that need your input",
        frequency: "Continuous",
        enabled: true,
      },
    ];
  };

  // Start research when URL is entered (debounced)
  useEffect(() => {
    if (!data.companyUrl || !data.companyName || research || researching) return;

    const isValidUrl = data.companyUrl.startsWith("http");
    if (!isValidUrl) return;

    const timeout = setTimeout(() => {
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
            setSuggestedTasks(processTasksFromResearch(result));
          }
        })
        .catch((error) => console.error("Research failed:", error))
        .finally(() => setResearching(false));
    }, 1000);

    return () => clearTimeout(timeout);
  }, [data.companyUrl, data.companyName, research, researching]);

  const handleNext = () => {
    // Generate default tasks when reaching step 5 if not already generated
    if (step === 4 && suggestedTasks.length === 0 && research) {
      setSuggestedTasks(processTasksFromResearch(research));
    }
    setStep((s) => Math.min(s + 1, 5) as Step);
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const handleFinish = () => {
    const enabledTasks = suggestedTasks.filter((t) => t.enabled);
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
      <div className="max-w-xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-8">
            <Image
              src="/logo.svg"
              alt="TeamPulse"
              width={220}
              height={44}
              priority
            />
          </div>
          <h1 className="text-3xl font-semibold text-slate-900 mb-3">
            {step === 1 && "Welcome to TeamPulse"}
            {step === 2 && `Hello ${firstName}, tell us about your company`}
            {step === 3 && "Which tools do you use?"}
            {step === 4 && "Choose your agent"}
            {step === 5 && "Here's what I found"}
          </h1>
          <p className="text-slate-500">
            {step === 1 && "Let's get to know you first."}
            {step === 2 && "We'll research your company to personalize your experience."}
            {step === 3 && "Pick the ones we should pull signals from."}
            {step === 4 && "Select an AI agent to help manage your team."}
            {step === 5 && research && `About ${data.companyName}`}
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
              {researching && (
                <p className="text-xs text-blue-500 mt-1.5 flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-blue-300 border-t-blue-500 rounded-full animate-spin" />
                  Researching your company...
                </p>
              )}
              {research && !researching && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Research complete
                </p>
              )}
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
          <div className="grid grid-cols-2 gap-3">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => toggleTool(tool.id)}
                disabled={!tool.available}
                className={`relative p-4 rounded-xl text-left transition-all border-2 ${
                  !tool.available
                    ? "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                    : data.tools.includes(tool.id)
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <h3 className={`font-semibold ${data.tools.includes(tool.id) && tool.available ? "text-white" : "text-slate-900"}`}>
                    {tool.name}
                  </h3>
                  {data.tools.includes(tool.id) && tool.available && (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className={`text-sm mt-1 ${
                  data.tools.includes(tool.id) && tool.available ? "text-slate-300" : "text-slate-500"
                }`}>
                  {tool.description}
                </p>
                {!tool.available && (
                  <span className="absolute top-2 right-2 text-xs text-slate-400">Soon</span>
                )}
              </button>
            ))}
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
                className={`w-full flex items-start gap-4 px-5 py-4 rounded-xl transition-all text-left border-2 ${
                  !agent.available
                    ? "bg-slate-50 border-slate-100 opacity-50 cursor-not-allowed"
                    : data.selectedAgent === agent.id
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${data.selectedAgent === agent.id && agent.available ? "text-white" : "text-slate-900"}`}>
                      {agent.name}
                    </h3>
                    {!agent.available && (
                      <span className="text-xs text-slate-400">Coming soon</span>
                    )}
                    {agent.available && data.selectedAgent === agent.id && (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
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

        {/* Step 5: Research Results */}
        {step === 5 && (
          <div className="space-y-6">
            {researching && (
              <div className="p-6 bg-slate-50 rounded-2xl flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                <p className="text-slate-600">Finishing analysis of {data.companyName}...</p>
              </div>
            )}

            {research && !researching && (
              <div className="space-y-4">
                <div className="p-6 bg-blue-50 rounded-2xl">
                  <p className="text-blue-800 leading-relaxed">{research.description}</p>
                  <div className="mt-4 pt-4 border-t border-blue-100">
                    <span className="text-sm font-medium text-blue-600">Industry: </span>
                    <span className="text-sm text-blue-700">{research.industry}</span>
                  </div>
                </div>

                {research.insights && research.insights.length > 0 && (
                  <div className="p-6 bg-slate-50 rounded-2xl">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">Key Insights</h3>
                    <ul className="space-y-2">
                      {research.insights.slice(0, 3).map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 flex-shrink-0" />
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {!researching && !research && (
              <div className="p-6 bg-slate-50 rounded-2xl text-center">
                <p className="text-slate-500">Ready to get started with {data.companyName}</p>
              </div>
            )}

            {/* Suggested Tasks */}
            {!researching && suggestedTasks.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Suggested Tasks</h3>
                <div className="space-y-2">
                  {suggestedTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all text-left border ${
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
                <p className="text-xs text-slate-400 mt-3 text-center">
                  {suggestedTasks.filter((t) => t.enabled).length} tasks selected. You can adjust these later.
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
              {researching ? "Analyzing..." : "Let's Start"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
