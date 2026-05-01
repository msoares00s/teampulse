"use client";

import { useState, useEffect } from "react";

interface Settings {
  companyName: string;
  teamSize: string;
  companyType: string;
  reviewDay: string;
  reviewTime: string;
  readOnlyMode: boolean;
}

const TEAM_SIZES = ["1-5", "6-15", "16-30", "31-50"];
const COMPANY_TYPES = ["Solo Founder", "Agency", "Consultancy", "Studio", "Product Company", "Service Business"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const TIMES = ["8:00 AM", "9:00 AM", "10:00 AM", "2:00 PM", "4:00 PM"];

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    companyName: "",
    teamSize: "6-15",
    companyType: "Product Company",
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
        teamSize: company.teamSize || "6-15",
        companyType: company.companyType || "Product Company",
        reviewDay: company.reviewDay || "Monday",
        reviewTime: company.reviewTime || "9:00 AM",
        readOnlyMode: company.readOnlyMode ?? true,
      });
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("teampulse_company", JSON.stringify(settings));
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

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Company type
              </label>
              <select
                value={settings.companyType}
                onChange={(e) => setSettings({ ...settings, companyType: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border-0 rounded-lg text-slate-900 focus:ring-2 focus:ring-slate-900"
              >
                {COMPANY_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </section>

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
