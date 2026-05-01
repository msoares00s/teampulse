interface AgentCardProps {
  name: string;
  description: string;
  status: "active" | "inactive" | "coming-soon";
  icon: string;
}

export default function AgentCard({
  name,
  description,
  status,
  icon,
}: AgentCardProps) {
  const statusConfig = {
    active: {
      bg: "bg-green-50 border-green-200",
      badge: "bg-green-100 text-green-700",
      label: "Active",
    },
    inactive: {
      bg: "bg-white border-slate-200",
      badge: "bg-slate-100 text-slate-600",
      label: "Inactive",
    },
    "coming-soon": {
      bg: "bg-slate-50 border-slate-200 opacity-60",
      badge: "bg-slate-200 text-slate-500",
      label: "Coming Soon",
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={`rounded-xl p-5 shadow-sm border ${config.bg}`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${config.badge}`}
        >
          {config.label}
        </span>
      </div>
      <h3 className="font-semibold text-slate-800 mb-1">{name}</h3>
      <p className="text-sm text-slate-500">{description}</p>
      {status === "active" && (
        <button className="mt-4 text-sm text-blue-600 font-medium hover:underline">
          Configure
        </button>
      )}
    </div>
  );
}
