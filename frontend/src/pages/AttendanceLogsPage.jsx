import { useState, useEffect, useCallback } from "react";
import { getAttendanceRecords } from "../services/api";
import { Search, ChevronLeft, ChevronRight, ClipboardList, Filter, ExternalLink, X, Download, Image as Img, Lock } from "lucide-react";
import PageHero from "../components/PageHero";
import FilterBar from "../components/FilterBar";

const PAGE = 15;

export default function AttendanceLogsPage() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [dateF, setDateF] = useState("");
  const [userF, setUserF] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewImage, setViewImage] = useState(null); // { path, record }

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const p = { skip: page * PAGE, limit: PAGE };
      if (dateF) p.date = dateF; if (userF) p.user_id = parseInt(userF, 10);
      const r = await getAttendanceRecords(p);
      setRecords(r.data.records); setTotal(r.data.total);
    } catch (e) { setError(e.response?.data?.detail || "Failed."); }
    finally { setLoading(false); }
  }, [page, dateF, userF]);

  useEffect(() => { load(); }, [load]);
  const pages = Math.ceil(total / PAGE);

  return (
    <div className="space-y-5">
      <PageHero icon={ClipboardList} title="Attendance Logs"
        subtitle="Records & History"
        image="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1400&q=80&fit=crop">
        <span className="badge badge-gold text-xs">{total} Total Records</span>
      </PageHero>

      <FilterBar search="" onSearch={() => {}} placeholder="Filter attendance records..." count={total}>
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--text-3)" }}>Date</label>
          <input type="date" value={dateF} onChange={e => { setDateF(e.target.value); setPage(0); }}
            className="input text-xs py-1.5 px-2 min-h-0 w-auto" style={{ width: "auto" }} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase tracking-wider font-bold" style={{ color: "var(--text-3)" }}>User</label>
          <input type="number" min="1" placeholder="All" value={userF}
            onChange={e => { setUserF(e.target.value); setPage(0); }}
            className="input text-xs py-1.5 px-2 w-16 min-h-0" />
        </div>
        {(dateF || userF) && (
          <button onClick={() => { setDateF(""); setUserF(""); setPage(0); }}
            className="text-[11px] font-semibold px-2 py-1 rounded-lg"
            style={{ color: "var(--gold)", background: "rgba(212,168,67,0.08)" }}>
            Clear
          </button>
        )}
      </FilterBar>

      {error && <div className="px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "#ef4444" }}>{error}</div>}

      {/* Table */}
      <div className="glass-solid overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 rounded-full animate-spin" style={{ border: "2.5px solid var(--border)", borderTopColor: "var(--gold)" }} />
          </div>
        ) : records.length === 0 ? (
          <div className="py-16 text-center" style={{ color: "var(--text-3)" }}>
            <ClipboardList className="mx-auto w-8 h-8 mb-2 opacity-30" /><p className="text-sm">No records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="dark-table">
              <thead><tr><th>ID</th><th>User</th><th>Student</th><th>Time</th><th>Key</th><th>Status</th><th>Image</th></tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: "var(--text-3)" }}>#{r.id}</td>
                    <td><span className="badge badge-gold">{r.user_id}</span></td>
                    <td><span className="font-semibold text-primary-dynamic">{r.full_name}</span></td>
                    <td>{new Date(r.timestamp).toLocaleString()}</td>
                    <td><span className="badge badge-info text-[9px]"><Lock className="w-2.5 h-2.5" /> #{r.key_id || "?"}</span></td>
                    <td><span className="badge badge-success">{r.status}</span></td>
                    <td>
                      <button onClick={() => setViewImage({ path: r.stego_image_path, record: r })}
                        className="inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                        style={{ color: "var(--gold)", background: "none", border: "none" }}>
                        <Img className="w-3 h-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="text-xs tabular-nums" style={{ color: "var(--text-3)" }}>{page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} of {total}</span>
            <div className="flex gap-1.5">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg disabled:opacity-30"
                style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}><ChevronLeft className="w-3.5 h-3.5" /></button>
              <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg disabled:opacity-30"
                style={{ border: "1px solid var(--border)", color: "var(--text-2)" }}><ChevronRight className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Image Modal */}
      {viewImage && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setViewImage(null)}>
          <div className="modal-box" style={{ maxWidth: 640 }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 className="text-base font-bold text-primary-dynamic">Stego Image</h2>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>
                  #{viewImage.record.id} — {viewImage.record.full_name} — {new Date(viewImage.record.timestamp).toLocaleString()}
                </p>
              </div>
              <button onClick={() => setViewImage(null)} className="p-1.5 rounded-lg"
                style={{ color: "var(--text-3)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.10)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image */}
            <div className="p-4">
              <img
                src={`/${viewImage.path}`}
                alt="Stego image"
                className="w-full rounded-xl"
                style={{ border: "1px solid var(--border)" }}
              />

              <div className="mt-3 rounded-lg px-3 py-2 text-[10px] font-medium text-center"
                style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.12)", color: "var(--gold)" }}>
                This image contains encrypted attendance data hidden in the pixel bits (LSB steganography)
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <a href={`/${viewImage.path}`} download={`attendance_${viewImage.record.id}.png`}
                className="btn-primary flex-1 text-sm">
                <Download className="w-4 h-4" /> Download
              </a>
              <button onClick={() => setViewImage(null)} className="btn-outline flex-1 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
