"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3;

interface OnboardingData {
  userName: string;
  companyName: string;
  companyUrl: string;
  teamSize: string;
}

interface CompanyResearch {
  description: string;
  industry: string;
  insights: string[];
}

const TEAM_SIZES = [
  { value: "1-5", label: "1-5 people" },
  { value: "6-15", label: "6-15 people" },
  { value: "16-30", label: "16-30 people" },
  { value: "31-50", label: "31-50 people" },
];

export default function Home() {
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<OnboardingData>({
    userName: "",
    companyName: "",
    companyUrl: "",
    teamSize: "",
  });
  const [research, setResearch] = useState<CompanyResearch | null>(null);
  const [researching, setResearching] = useState(false);
  const router = useRouter();

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
          }
        })
        .catch((error) => console.error("Research failed:", error))
        .finally(() => setResearching(false));
    }
  };

  const handleNext = () => {
    if (step === 2 && data.companyUrl && !research && !researching) {
      startResearch();
    }
    setStep((s) => Math.min(s + 1, 3) as Step);
  };

  const handleBack = () => setStep((s) => Math.max(s - 1, 1) as Step);

  const handleFinish = () => {
    localStorage.setItem("teampulse_company", JSON.stringify({
      ...data,
      research,
    }));
    router.push("/dashboard");
  };

  const canProceed = () => {
    if (step === 1) return data.userName.trim().length > 0;
    if (step === 2) return data.companyName && data.companyUrl && data.teamSize;
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
            {step === 3 && "Here's what I found"}
          </h1>
          <p className="text-slate-500">
            {step === 1 && "Let's get to know you first."}
            {step === 2 && "We'll research your company to personalize your experience."}
            {step === 3 && research && `About ${data.companyName}`}
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3].map((s) => (
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

        {/* Step 3: Research Results */}
        {step === 3 && (
          <div className="space-y-6">
            {researching && (
              <div className="p-6 bg-slate-50 rounded-2xl flex items-center justify-center gap-3">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                <p className="text-slate-600">Analyzing {data.companyName}...</p>
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

          {step < 3 ? (
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
