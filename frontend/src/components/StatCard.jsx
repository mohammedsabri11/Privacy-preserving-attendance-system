/**
 * Dashboard stat card.
 */

export default function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <div
      className="glass-card p-4 flex items-center gap-3 animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{
          background: `${color || 'var(--gold)'}15`,
          border: `1px solid ${color || 'var(--gold)'}25`,
        }}
      >
        <Icon className="w-5 h-5" style={{ color: color || "var(--gold)" }} />
      </div>
      <div>
        <p className="text-xl font-extrabold tabular-nums" style={{ color: "var(--text-primary)", letterSpacing: "-0.03em" }}>
          {value}
        </p>
        <p className="text-[11px] font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
      </div>
    </div>
  );
}
