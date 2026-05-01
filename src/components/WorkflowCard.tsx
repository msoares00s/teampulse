interface WorkflowCardProps {
  name: string;
  description: string;
  status: "active" | "coming-soon";
  icon: string;
}

export default function WorkflowCard({
  name,
  description,
  status,
  icon,
}: WorkflowCardProps) {
  return (
    <div
      className={`bg-white rounded-lg p-4 border ${
        status === "active"
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-slate-200 opacity-60"
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-800 text-sm">{name}</h4>
          <p className="text-xs text-slate-500 truncate">{description}</p>
        </div>
        {status === "active" ? (
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
            Active
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-xs font-medium">
            Soon
          </span>
        )}
      </div>
    </div>
  );
}
