"use client";

import { useState, useEffect } from "react";

interface CompanyResearch {
  description: string;
  industry: string;
  insights: string[];
}

interface Settings {
  companyName: string;
  companyUrl: string;
  teamSize: string;
  reviewDay: string;
  reviewTime: string;
  readOnlyMode: boolean;
  research?: CompanyResearch;
}

const TEAM_SIZES = ["1-5", "6-15", "16-30", "31-50"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIMES = ["8:00 AM", "9:00 AM", "10:00 AM", "2:00 PM", "4:00 PM"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    companyName: "",
    companyUrl: "",
    teamSize: "6-15",
    reviewDay: "Monday",
    reviewTime: "9:00 AM",
    readOnlyMode: true,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const company = JSON.parse(localStorage.getItem("teampulse_company") || "{}");
    if (company.companyName) {
      setSettings({
        companyName: company.companyName || "",
        companyUrl: company.companyUrl || "",
        teamSize: company.teamSize || "6-15",
        reviewDay: company.reviewDay || "Monday",
        reviewTime: company.reviewTime || "9:00 AM",
        readOnlyMode: company.readOnlyMode ?? true,
        research: company.research,
      });
    }
  }, []);

  const handleSave = () => {
    const existing = JSON.parse(localStorage.getItem("teampulse_company") || "{}");
    localStorage.setItem("teampulse_company", JSON.stringify({
      ...existing,
      ...settings,
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">
          Manage your company details and review preferences.
        </p>
      </div>

      <div className="space-y-8">
        {/* Company Details */}
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Company Details</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Website
              </label>
              <input
                type="url"
                value={settings.companyUrl}
                onChange={(e) => setSettings({ ...settings, companyUrl: e.target.value })}
                placeholder="https://example.com"
                className="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Team size
              </label>
              <select
                value={settings.teamSize}
                onChange={(e) => setSettings({ ...settings, teamSize: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-900"
              >
                {TEAM_SIZES.map((size) => (
                  <option key={size} value={size}>{size} people</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Company Research */}
        {settings.research && (
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-4">Company Profile</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 text-sm leading-relaxed">
                  {settings.research.description}
                </p>
                <div className="mt-3 pt-3 border-t border-blue-100">
                  <span className="text-xs font-medium text-blue-600">Industry: </span>
                  <span className="text-xs text-blue-700">{settings.research.industry}</span>
                </div>
              </div>

              {settings.research.insights && settings.research.insights.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-slate-700 mb-2">Key Insights</h3>
                  <ul className="space-y-2">
                    {settings.research.insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-1.5 flex-shrink-0" />
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Review Schedule */}
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Review Schedule</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Review day
              </label>
              <select
                value={settings.reviewDay}
                onChange={(e) => setSettings({ ...settings, reviewDay: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-900"
              >
                {DAYS.map((day) => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Review time
              </label>
              <select
                value={settings.reviewTime}
                onChange={(e) => setSettings({ ...settings, reviewTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-900"
              >
                {TIMES.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Preferences</h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-slate-900">Read-only mode</h3>
              <p className="text-sm text-slate-500 mt-0.5">
                TeamPulse will only read data, never send messages or take actions
              </p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, readOnlyMode: !settings.readOnlyMode })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.readOnlyMode ? "bg-slate-900" : "bg-slate-200"
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.readOnlyMode ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800"
          >
            Save Changes
          </button>
          {saved && (
            <span className="text-green-600 text-sm font-medium">Settings saved!</span>
          )}
        </div>
      </div>
    </div>
  );
}
