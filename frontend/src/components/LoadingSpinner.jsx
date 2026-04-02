export default function LoadingSpinner({ label = "Loading...", className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div
        className="w-7 h-7 rounded-full animate-spin"
        style={{ border: "2.5px solid var(--table-border)", borderTopColor: "var(--gold)" }}
      />
      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}
