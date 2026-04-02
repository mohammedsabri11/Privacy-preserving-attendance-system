import { useState, useEffect } from "react";
import { getDashboard } from "../services/api";
import { Users, CalendarCheck, BarChart3, Clock, Shield, Scan, Lock, Eye, TrendingUp, Zap, BookOpen } from "lucide-react";
import PageHero from "../components/PageHero";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboard().then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "2.5px solid var(--border)", borderTopColor: "var(--gold)" }} />
    </div>
  );

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <PageHero icon={Shield} title="Attendance Dashboard"
        subtitle="Command Center"
        image="https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1400&q=80&fit=crop">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold"
          style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.20)", color: "#22c55e" }}>
          <Zap className="w-3 h-3" /> System Active
        </div>
      </PageHero>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Users, label: "Students", value: stats.total_users, color: "#d4a843", trend: null },
          { icon: BookOpen, label: "Courses", value: stats.total_courses, color: "#3b82f6", trend: null },
          { icon: CalendarCheck, label: "Today", value: stats.total_records_today, color: "#22c55e", trend: "Live" },
          { icon: BarChart3, label: "All-Time", value: stats.total_records_all, color: "#a855f7", trend: null },
        ].map((s, i) => (
          <div key={i} className="glass p-4 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${s.color}12`, border: `1px solid ${s.color}25` }}>
                <s.icon className="w-5 h-5" style={{ color: s.color }} />
              </div>
              {s.trend && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                  style={{ background: `${s.color}12`, color: s.color }}>
                  <TrendingUp className="w-2.5 h-2.5" /> {s.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-extrabold tabular-nums" style={{ letterSpacing: "-0.03em" }}>{s.value}</p>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: "var(--text-3)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Security Pipeline */}
      <div className="glass p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-4 h-4" style={{ color: "var(--gold)" }} />
          <span className="text-sm font-bold" style={{ color: "var(--gold)" }}>Security Pipeline</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Scan, label: "Face Detection", detail: "MTCNN + FaceNet", color: "#3b82f6" },
            { icon: Eye, label: "Embedding Match", detail: "Cosine Similarity", color: "#d4a843" },
            { icon: Lock, label: "Encryption", detail: "AES-256-GCM", color: "#22c55e" },
            { icon: Eye, label: "Steganography", detail: "LSB Embedding", color: "#a855f7" },
          ].map((p, i) => (
            <div key={i} className="rounded-xl p-4 text-center"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <p.icon className="w-5 h-5 mx-auto mb-2" style={{ color: p.color }} />
              <p className="text-xs font-bold" style={{ color: p.color }}>{p.label}</p>
              <p className="text-[10px] mt-0.5" style={{ color: "var(--text-3)" }}>{p.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Table */}
      <div className="glass-solid overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-sm font-bold text-primary-dynamic">Recent Attendance</h3>
          <span className="badge badge-gold">{stats.recent_records.length} records</span>
        </div>
        {stats.recent_records.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--text-3)" }}>
            <CalendarCheck className="mx-auto w-8 h-8 mb-2 opacity-30" />
            <p className="text-sm">No records yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="dark-table">
              <thead><tr>
                <th>ID</th><th>Student</th><th>Time</th><th>Status</th>
              </tr></thead>
              <tbody>
                {stats.recent_records.map((r, i) => (
                  <tr key={r.id}>
                    <td style={{ color: "var(--text-3)" }}>#{r.id}</td>
                    <td><span className="font-semibold text-primary-dynamic">{r.full_name}</span></td>
                    <td>{new Date(r.timestamp).toLocaleString()}</td>
                    <td><span className="badge badge-success">{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
