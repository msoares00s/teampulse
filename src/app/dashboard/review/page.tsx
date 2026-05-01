"use client";

import { useState, useEffect, useCallback } from "react";
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

interface AutomatedTask {
  id: string;
  title: string;
  description: string;
  frequency: string;
  enabled?: boolean;
  scheduledDay?: string;
  scheduledTime?: string;
  active?: boolean;
}

interface TaskExecution {
  taskId: string;
  executedAt: string;
  message: string;
  success: boolean;
  channel?: string;
  error?: string;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const TIMES = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"];

export default function ReviewPage() {
  const [review, setReview] = useState<Review | null>(null);
  const [generating, setGenerating] = useState(false);
  const [tasks, setTasks] = useState<AutomatedTask[]>([]);
  const [executions, setExecutions] = useState<Record<string, TaskExecution>>({});
  const [executingTask, setExecutingTask] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<AutomatedTask | null>(null);
  const [taskChannel, setTaskChannel] = useState("");
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [channels, setChannels] = useState<Array<{ id: string; name: string }>>([]);
  const [companyName, setCompanyName] = useState("");

  const generateReview = useCallback(async () => {
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
        if (!data.error) {
          setReview(data);
          localStorage.setItem("teampulse_review", JSON.stringify(data));
        }
      }
    } catch (error) {
      console.error("Failed to generate review:", error);
    } finally {
      setGenerating(false);
    }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("teampulse_review");
    if (saved) {
      setReview(JSON.parse(saved));
    }

    const company = JSON.parse(localStorage.getItem("teampulse_company") || "{}");
    if (company.automatedTasks) {
      // Add default schedule if not set
      const tasksWithSchedule = company.automatedTasks.map((t: AutomatedTask) => ({
        ...t,
        scheduledDay: t.scheduledDay || "Monday",
        scheduledTime: t.scheduledTime || "9:00 AM",
        active: t.active !== false,
      }));
      setTasks(tasksWithSchedule);
    }
    if (company.companyName) {
      setCompanyName(company.companyName);
    }

    const savedExecutions = localStorage.getItem("teampulse_executions");
    if (savedExecutions) {
      setExecutions(JSON.parse(savedExecutions));
    }

    const audit = localStorage.getItem("teampulse_audit");
    if (audit) {
      const auditData = JSON.parse(audit);
      if (auditData.channels) {
        setChannels(auditData.channels);
      }
    }

    const hasSlack = document.cookie.includes("slack_access_token") ||
                     localStorage.getItem("slackConnected") === "true";
    if (!saved && hasSlack) {
      generateReview();
    }
  }, [generateReview]);

  const saveTasks = (updatedTasks: AutomatedTask[]) => {
    const company = JSON.parse(localStorage.getItem("teampulse_company") || "{}");
    company.automatedTasks = updatedTasks;
    localStorage.setItem("teampulse_company", JSON.stringify(company));
    setTasks(updatedTasks);
  };

  const toggleTaskActive = (taskId: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, active: !t.active } : t
    );
    saveTasks(updated);
  };

  const updateTaskSchedule = (taskId: string, field: "scheduledDay" | "scheduledTime", value: string) => {
    const updated = tasks.map((t) =>
      t.id === taskId ? { ...t, [field]: value } : t
    );
    saveTasks(updated);
  };

  const executeTask = async (task: AutomatedTask, postToSlack: boolean = false) => {
    setExecutingTask(task.id);
    setPreviewMessage(null);
    setTaskError(null);

    try {
      const res = await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task,
          companyName,
          channel: taskChannel,
          postToSlack,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        if (postToSlack) {
          if (data.slackResult?.success) {
            const execution: TaskExecution = {
              taskId: task.id,
              executedAt: data.executedAt,
              message: data.message,
              success: true,
              channel: data.slackResult.channel,
            };

            const newExecutions = { ...executions, [task.id]: execution };
            setExecutions(newExecutions);
            localStorage.setItem("teampulse_executions", JSON.stringify(newExecutions));
            setSelectedTask(null);
            setTaskChannel("");
            setPreviewMessage(null);
          } else {
            setTaskError(data.slackResult?.error || "Failed to post to Slack. Make sure you have reconnected Slack with write permissions.");
          }
        } else {
          setPreviewMessage(data.message);
        }
      } else {
        const error = await res.json();
        setTaskError(error.error || "Failed to execute task");
      }
    } catch (error) {
      console.error("Failed to execute task:", error);
      setTaskError("Failed to connect to server");
    } finally {
      setExecutingTask(null);
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const formatLastRun = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  const extractChannelFromDescription = (description: string): string | null => {
    const match = description.match(/#([a-z0-9-_]+)/i);
    return match ? match[1] : null;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Weekly Review</h1>
        <p className="text-slate-500 mt-1">
          {review ? formatDate(review.generatedAt) : generating ? "Generating..." : "Your weekly management overview"}
        </p>
      </div>

      {/* Automated Tasks Section */}
      {tasks.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Automated Tasks
          </h2>
          <div className="space-y-3">
            {tasks.map((task) => {
              const execution = executions[task.id];
              const channelInDescription = extractChannelFromDescription(task.description);

              return (
                <div
                  key={task.id}
                  className={`bg-white rounded-xl border p-4 transition-all ${
                    task.active ? "border-slate-200" : "border-slate-100 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-slate-900">{task.title}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          task.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                        }`}>
                          {task.active ? "Active" : "Paused"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{task.description}</p>

                      {/* Schedule */}
                      <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Scheduled:</span>
                          <select
                            value={task.scheduledDay}
                            onChange={(e) => updateTaskSchedule(task.id, "scheduledDay", e.target.value)}
                            className="text-xs px-2 py-1 bg-slate-50 border-0 rounded text-slate-700 focus:ring-1 focus:ring-slate-300"
                          >
                            {DAYS.map((day) => (
                              <option key={day} value={day}>{day}</option>
                            ))}
                          </select>
                          <select
                            value={task.scheduledTime}
                            onChange={(e) => updateTaskSchedule(task.id, "scheduledTime", e.target.value)}
                            className="text-xs px-2 py-1 bg-slate-50 border-0 rounded text-slate-700 focus:ring-1 focus:ring-slate-300"
                          >
                            {TIMES.map((time) => (
                              <option key={time} value={time}>{time}</option>
                            ))}
                          </select>
                        </div>

                        {execution?.success && (
                          <span className="text-xs text-slate-400">
                            Last run: {formatLastRun(execution.executedAt)}
                            {execution.channel && (
                              <span className="text-green-600 ml-1">in #{execution.channel}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => toggleTaskActive(task.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          task.active
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {task.active ? "Pause" : "Start"}
                      </button>
                      {selectedTask?.id === task.id ? (
                        <button
                          onClick={() => { setSelectedTask(null); setPreviewMessage(null); setTaskChannel(""); setTaskError(null); }}
                          className="px-3 py-1.5 text-slate-500 text-sm hover:text-slate-700"
                        >
                          Cancel
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setTaskChannel(channelInDescription || "");
                            setPreviewMessage(null);
                            setTaskError(null);
                          }}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
                        >
                          Run Now
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Task Execution Panel */}
                  {selectedTask?.id === task.id && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">
                            Post to channel
                          </label>
                          <select
                            value={taskChannel}
                            onChange={(e) => setTaskChannel(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border-0 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                          >
                            <option value="">Select a channel...</option>
                            {channels.map((channel) => (
                              <option key={channel.id} value={channel.name}>
                                #{channel.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {taskError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{taskError}</p>
                            <p className="text-xs text-red-500 mt-1">
                              You may need to reconnect Slack to get write permissions.
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={() => executeTask(task, false)}
                            disabled={executingTask === task.id}
                            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 disabled:opacity-50"
                          >
                            {executingTask === task.id && !taskChannel ? "Generating..." : "Preview Message"}
                          </button>
                          {taskChannel && (
                            <button
                              onClick={() => executeTask(task, true)}
                              disabled={executingTask === task.id}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                            >
                              {executingTask === task.id ? "Posting..." : `Post to #${taskChannel}`}
                            </button>
                          )}
                        </div>

                        {previewMessage && (
                          <div className="p-4 bg-slate-50 rounded-lg">
                            <p className="text-xs text-slate-400 mb-2">Preview:</p>
                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{previewMessage}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Review Content */}
      {generating ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl">
          <div className="w-12 h-12 border-3 border-slate-200 border-t-slate-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Generating your weekly review...</p>
        </div>
      ) : !review ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-200">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">No review yet</h2>
          <p className="text-slate-500 mb-6">Connect Slack and complete the audit to generate reviews.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Priorities */}
          {review.topPriorities?.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Top Priorities
              </h2>
              <div className="space-y-3">
                {review.topPriorities.map((item, idx) => (
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
          )}

          {/* Missed Follow-ups */}
          {review.followUps?.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Missed Follow-ups
              </h2>
              <div className="space-y-3">
                {review.followUps.map((item, idx) => (
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
          )}

          {/* Blockers */}
          {review.blockers?.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Stuck Work / Blockers
              </h2>
              <div className="space-y-3">
                {review.blockers.map((item, idx) => (
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
          )}

          {/* Pending Decisions */}
          {review.decisions?.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Pending Decisions
              </h2>
              <div className="space-y-3">
                {review.decisions.map((item, idx) => (
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
          )}

          {/* Draft Team Update */}
          {review.teamUpdate && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Draft Team Update
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <p className="text-slate-700 leading-relaxed whitespace-pre-line">{review.teamUpdate}</p>
                <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(review.teamUpdate)}
                    className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Meeting Agenda */}
          {review.meetingAgenda?.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Suggested Meeting Agenda
              </h2>
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <ol className="space-y-3">
                  {review.meetingAgenda.map((item, idx) => (
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
          )}
        </div>
      )}
    </div>
  );
}
