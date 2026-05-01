"use client";

import { useState, useEffect } from "react";

interface Workflow {
  id: string;
  name: string;
  description: string;
  frequency: string;
  active: boolean;
  available: boolean;
}

const WORKFLOWS: Workflow[] = [
  {
    id: "weekly-review",
    name: "Weekly Review",
    description: "A structured overview of what needs attention this week",
    frequency: "Weekly",
    active: true,
    available: true,
  },
  {
    id: "team-update",
    name: "Team Update",
    description: "Draft team communication based on recent activity",
    frequency: "Weekly",
    active: false,
    available: false,
  },
  {
    id: "meeting-agenda",
    name: "Meeting Agenda",
    description: "Auto-generated agendas for team meetings",
    frequency: "Per meeting",
    active: false,
    available: false,
  },
  {
    id: "followup-tracker",
    name: "Follow-up Tracker",
    description: "Track and remind about pending follow-ups",
    frequency: "Daily",
    active: false,
    available: false,
  },
  {
    id: "blocker-review",
    name: "Blocker Review",
    description: "Surface stuck work and blockers across the team",
    frequency: "Weekly",
    active: false,
    available: false,
  },
  {
    id: "decision-tracker",
    name: "Decision Tracker",
    description: "Track pending decisions that need attention",
    frequency: "Weekly",
    active: false,
    available: false,
  },
];

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState(WORKFLOWS);

  useEffect(() => {
    const saved = localStorage.getItem("teampulse_workflows");
    if (saved) {
      const savedWorkflows = JSON.parse(saved);
      setWorkflows((prev) =>
        prev.map((w) => ({
          ...w,
          active: savedWorkflows[w.id] ?? w.active,
        }))
      );
    }
  }, []);

  const toggleWorkflow = (id: string) => {
    const workflow = workflows.find((w) => w.id === id);
    if (!workflow?.available) return;

    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: !w.active } : w))
    );

    const saved = JSON.parse(localStorage.getItem("teampulse_workflows") || "{}");
    saved[id] = !workflow.active;
    localStorage.setItem("teampulse_workflows", JSON.stringify(saved));
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Workflows</h1>
        <p className="text-slate-500 mt-1">
          Activate the management workflows you want TeamPulse to run.
        </p>
      </div>

      <div className="space-y-4">
        {workflows.map((workflow) => (
          <div
            key={workflow.id}
            className={`bg-white rounded-xl border p-5 transition-colors ${
              !workflow.available
                ? "border-slate-100 opacity-60"
                : workflow.active
                ? "border-slate-300"
                : "border-slate-200"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-medium text-slate-900">{workflow.name}</h3>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs">
                    {workflow.frequency}
                  </span>
                </div>
                <p className="text-sm text-slate-500">{workflow.description}</p>
              </div>
              <div className="ml-4">
                {workflow.available ? (
                  <button
                    onClick={() => toggleWorkflow(workflow.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      workflow.active ? "bg-slate-900" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        workflow.active ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-medium">Coming soon</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
