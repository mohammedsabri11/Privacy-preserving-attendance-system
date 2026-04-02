import { useState, useEffect, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { getUsers, registerUser } from "../services/api";
import { UserPlus, Search, Camera, Upload, X, Users, Mail, Calendar, Plus, Hash, Fingerprint, BookOpen, ClipboardCheck, Shield } from "lucide-react";
import PageHero from "../components/PageHero";
import FilterBar from "../components/FilterBar";

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [images, setImages] = useState([]);
  const [cam, setCam] = useState(false);
  const [regLoad, setRegLoad] = useState(false);
  const [regErr, setRegErr] = useState("");
  const [regOk, setRegOk] = useState("");
  const wcRef = useRef(null);
  const fileRef = useRef(null);

  const fetch = async () => { try { setStudents((await getUsers()).data); } catch {} finally { setLoading(false); } };
  useEffect(() => { fetch(); }, []);

  const snap = useCallback(() => { const s = wcRef.current?.getScreenshot(); if (s) setImages(p => [...p, s]); }, []);
  const onFiles = e => Array.from(e.target.files).forEach(f => { const r = new FileReader(); r.onloadend = () => setImages(p => [...p, r.result]); r.readAsDataURL(f); });
  const toBlob = d => { const [h, b] = d.split(","); const m = h.match(/:(.*?);/)[1]; const bin = atob(b); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: m }); };

  const register = async e => {
    e.preventDefault(); setRegErr(""); setRegOk("");
    if (!images.length) { setRegErr("Capture at least one face image."); return; }
    setRegLoad(true);
    try {
      const fd = new FormData();
      fd.append("full_name", form.fullName); fd.append("email", form.email); fd.append("password", form.password);
      images.forEach((img, i) => fd.append("face_images", toBlob(img), `f${i}.jpg`));
      await registerUser(fd);
      setRegOk("Student registered!"); setForm({ fullName: "", email: "", password: "" }); setImages([]); setCam(false);
      fetch(); setTimeout(() => { setModal(false); setRegOk(""); }, 1200);
    } catch (err) { setRegErr(err.response?.data?.detail || "Registration failed."); }
    finally { setRegLoad(false); }
  };

  const close = () => { setModal(false); setRegErr(""); setRegOk(""); setForm({ fullName: "", email: "", password: "" }); setImages([]); setCam(false); };
  const filtered = students.filter(s => s.full_name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <PageHero icon={UserPlus} title="Student Register"
        subtitle="Face Enrollment"
        image="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1400&q=80&fit=crop">
        <button onClick={() => setModal(true)} className="btn-primary text-xs"><Plus className="w-3.5 h-3.5" /> Add Student</button>
      </PageHero>

      <FilterBar search={search} onSearch={setSearch}
        placeholder="Search students by name or email..." count={filtered.length} />

      {/* Grid */}
      <div className="mt-2">
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full animate-spin" style={{ border: "2.5px solid var(--border)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-solid py-20 text-center">
          <Users className="mx-auto w-8 h-8 mb-2" style={{ color: "var(--text-3)", opacity: 0.3 }} />
          <p className="text-sm" style={{ color: "var(--text-3)" }}>{search ? "No match." : "No students yet."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s, i) => (
            <div key={s.id} className="glass p-5 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-extrabold flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #d4a843, #8B6914)", color: "#fff", boxShadow: "0 0 16px rgba(212,168,67,0.15)" }}>
                  {s.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate" style={{ color: "var(--text-1)" }}>{s.full_name}</p>
                  <p className="text-[11px] truncate flex items-center gap-1 mt-0.5" style={{ color: "var(--text-3)" }}>
                    <Mail className="w-3 h-3 flex-shrink-0" /> {s.email}
                  </p>
                </div>
                <span className="badge text-[9px]"
                  style={{
                    background: s.role === "admin" ? "rgba(212,168,67,0.12)" : "rgba(59,130,246,0.12)",
                    color: s.role === "admin" ? "var(--gold)" : "#3b82f6",
                    border: `1px solid ${s.role === "admin" ? "rgba(212,168,67,0.25)" : "rgba(59,130,246,0.25)"}`,
                  }}>
                  <Shield className="w-2.5 h-2.5" /> {s.role}
                </span>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { icon: ClipboardCheck, label: "Attendance", value: s.attendance_count ?? 0, color: "#22c55e" },
                  { icon: Fingerprint, label: "Embeddings", value: s.embedding_count ?? 0, color: "var(--gold)" },
                  { icon: BookOpen, label: "Courses", value: s.course_count ?? 0, color: "#3b82f6" },
                ].map(({ icon: I, label, value, color }) => (
                  <div key={label} className="text-center rounded-lg py-2"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                    <I className="w-3.5 h-3.5 mx-auto mb-1" style={{ color }} />
                    <p className="text-base font-extrabold tabular-nums" style={{ color }}>{value}</p>
                    <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{label}</p>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="badge badge-gold"><Hash className="w-2.5 h-2.5" /> {s.id}</span>
                <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--text-3)" }}>
                  <Calendar className="w-3 h-3" /> {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && close()}>
          <div className="modal-box">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 className="text-base font-bold text-white">Register Student</h2>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-3)" }}>Add with face recognition</p>
              </div>
              <button onClick={close} className="p-1.5 rounded-lg" style={{ color: "var(--text-3)" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(239,68,68,0.10)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {regErr && <div className="px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "#ef4444" }}>{regErr}</div>}
              {regOk && <div className="px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)", color: "#22c55e" }}>{regOk}</div>}
              <form id="rf" onSubmit={register} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>Full Name <span style={{ color: "var(--gold)" }}>*</span></label>
                    <input type="text" required value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} className="input" placeholder="Name" /></div>
                  <div><label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>Email <span style={{ color: "var(--gold)" }}>*</span></label>
                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" placeholder="email@example.com" /></div>
                </div>
                <div><label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>Password <span style={{ color: "var(--gold)" }}>*</span></label>
                  <input type="password" required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input" placeholder="Min 6 chars" /></div>
                <div>
                  <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-2)" }}>
                    Face Images <span style={{ color: "var(--gold)" }}>*</span>
                    <span className="font-normal ml-2" style={{ color: "var(--text-3)" }}>({images.length})</span>
                  </label>
                  <div className="flex gap-2 mb-3">
                    <button type="button" onClick={() => setCam(!cam)} className="btn-gold text-xs py-2 px-3"><Camera className="w-3.5 h-3.5" /> {cam ? "Hide" : "Camera"}</button>
                    <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline text-xs py-2 px-3"><Upload className="w-3.5 h-3.5" /> Upload</button>
                    <input ref={fileRef} type="file" multiple accept="image/*" onChange={onFiles} className="hidden" />
                  </div>
                  {cam && (
                    <div className="space-y-2 mb-3">
                      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        <Webcam ref={wcRef} audio={false} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "user", width: 480, height: 360 }} className="w-full" />
                      </div>
                      <button type="button" onClick={snap} className="btn-primary text-xs py-2 px-3"><Camera className="w-3.5 h-3.5" /> Capture</button>
                    </div>
                  )}
                  {images.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {images.map((img, i) => (
                        <div key={i} className="relative group">
                          <img src={img} alt="" className="w-14 h-14 rounded-lg object-cover" style={{ border: "2px solid var(--border)" }} />
                          <button type="button" onClick={() => setImages(p => p.filter((_, j) => j !== i))}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ background: "#dc2626", color: "#fff" }}><X className="w-2.5 h-2.5" /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </form>
            </div>
            <div className="flex gap-3 px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button form="rf" type="submit" disabled={regLoad} className="btn-primary flex-1 text-sm">
                {regLoad ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                  : <><UserPlus className="w-4 h-4" /> Register</>}
              </button>
              <button type="button" onClick={close} className="btn-outline flex-1 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
