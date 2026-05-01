"use client";

import { useState, useEffect } from "react";

interface AutomatedTask {
  id: string;
  title: string;
  description: string;
  frequency: string;
  enabled: boolean;
}

const FREQUENCIES = ["Daily", "Weekly", "Bi-weekly", "Monthly", "Per event", "Continuous"];

export default function WorkflowsPage() {
  const [tasks, setTasks] = useState<AutomatedTask[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [newTask, setNewTask] = useState<Partial<AutomatedTask>>({
    title: "",
    description: "",
    frequency: "Weekly",
  });

  useEffect(() => {
    const company = JSON.parse(localStorage.getItem("teampulse_company") || "{}");
    if (company.automatedTasks) {
      setTasks(company.automatedTasks.map((t: AutomatedTask) => ({ ...t, enabled: t.enabled ?? true })));
    }
  }, []);

  const saveTasks = (updatedTasks: AutomatedTask[]) => {
    const company = JSON.parse(localStorage.getItem("teampulse_company") || "{}");
    company.automatedTasks = updatedTasks;
    localStorage.setItem("teampulse_company", JSON.stringify(company));
    setTasks(updatedTasks);
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, enabled: !t.enabled } : t
    );
    saveTasks(updated);
  };

  const updateTaskFrequency = (id: string, frequency: string) => {
    const updated = tasks.map((t) =>
      t.id === id ? { ...t, frequency } : t
    );
    saveTasks(updated);
    setEditingId(null);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
  };

  const addTask = () => {
    if (!newTask.title || !newTask.description) return;

    const task: AutomatedTask = {
      id: `task-${Date.now()}`,
      title: newTask.title,
      description: newTask.description,
      frequency: newTask.frequency || "Weekly",
      enabled: true,
    };

    saveTasks([...tasks, task]);
    setNewTask({ title: "", description: "", frequency: "Weekly" });
    setShowAddForm(false);
  };

  const generateFromPrompt = async () => {
    if (!prompt.trim()) return;

    setGenerating(true);
    try {
      const company = JSON.parse(localStorage.getItem("teampulse_company") || "{}");
      const res = await fetch("/api/tasks/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          companyName: company.companyName,
          industry: company.research?.industry,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.task) {
          const task: AutomatedTask = {
            id: `task-${Date.now()}`,
            title: data.task.title,
            description: data.task.description,
            frequency: data.task.frequency || "Weekly",
            enabled: true,
          };
          saveTasks([...tasks, task]);
          setPrompt("");
          setShowPromptForm(false);
        }
      }
    } catch (error) {
      console.error("Failed to generate task:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Workflows</h1>
          <p className="text-slate-500 mt-1">
            Manage your automated tasks and their settings.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setShowPromptForm(true); setShowAddForm(false); }}
            className="px-4 py-2 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50"
          >
            Create with AI
          </button>
          <button
            onClick={() => { setShowAddForm(true); setShowPromptForm(false); }}
            className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800"
          >
            Add Task
          </button>
        </div>
      </div>

      {/* AI Prompt Form */}
      {showPromptForm && (
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5 mb-6">
          <h3 className="font-medium text-blue-900 mb-3">Create Task with AI</h3>
          <p className="text-sm text-blue-700 mb-4">
            Describe what you want to automate and we'll create a task for you.
          </p>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., I want to track when team members mention being blocked or stuck on something..."
            rows={3}
            className="w-full px-4 py-3 bg-white border border-blue-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => { setShowPromptForm(false); setPrompt(""); }}
              className="px-4 py-2 text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={generateFromPrompt}
              disabled={!prompt.trim() || generating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Task"}
            </button>
          </div>
        </div>
      )}

      {/* Manual Add Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="font-medium text-slate-900 mb-4">Add New Task</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Task name
              </label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="e.g., Weekly Team Review"
                className="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Description
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="What should this task do?"
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-lg text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Frequency
              </label>
              <select
                value={newTask.frequency}
                onChange={(e) => setNewTask({ ...newTask, frequency: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-900"
              >
                {FREQUENCIES.map((freq) => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { setShowAddForm(false); setNewTask({ title: "", description: "", frequency: "Weekly" }); }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                disabled={!newTask.title || !newTask.description}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="bg-slate-50 rounded-xl p-8 text-center">
          <p className="text-slate-500">No tasks configured yet.</p>
          <p className="text-sm text-slate-400 mt-1">
            Add a task manually or use AI to create one from a description.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-white rounded-xl border p-5 transition-all ${
                task.enabled ? "border-slate-200" : "border-slate-100 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-medium text-slate-900">{task.title}</h3>
                    {editingId === task.id ? (
                      <select
                        value={task.frequency}
                        onChange={(e) => updateTaskFrequency(task.id, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        autoFocus
                        className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs border-0 focus:ring-2 focus:ring-slate-900"
                      >
                        {FREQUENCIES.map((freq) => (
                          <option key={freq} value={freq}>{freq}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingId(task.id)}
                        className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs hover:bg-slate-200"
                      >
                        {task.frequency}
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{task.description}</p>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                    title="Delete task"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      task.enabled ? "bg-slate-900" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        task.enabled ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
