interface StatusCardProps {
  name: string;
  icon: string;
  connected: boolean;
  onConnect: () => void;
  required?: boolean;
  comingSoon?: boolean;
}

export default function StatusCard({
  name,
  icon,
  connected,
  onConnect,
  required,
  comingSoon,
}: StatusCardProps) {
  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-sm border ${
        connected
          ? "border-green-200 bg-green-50/50"
          : comingSoon
          ? "border-slate-200 opacity-60"
          : "border-slate-200"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{icon}</span>
          <div>
            <h3 className="font-medium text-slate-800">{name}</h3>
            {required && (
              <span className="text-xs text-blue-600 font-medium">Required</span>
            )}
          </div>
        </div>
        {connected ? (
          <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Connected
          </span>
        ) : comingSoon ? (
          <span className="text-sm text-slate-400 font-medium">Coming Soon</span>
        ) : (
          <button
            onClick={onConnect}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Connect
          </button>
        )}
      </div>
    </div>
  );
}
