"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

interface CompanyData {
  companyName: string;
  teamSize: string;
  companyType: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [company, setCompany] = useState<CompanyData | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("teampulse_company");
    if (stored) {
      setCompany(JSON.parse(stored));
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar companyName={company?.companyName} />
      <main className="pl-64">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
