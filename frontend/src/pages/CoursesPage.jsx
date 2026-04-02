import { useState, useEffect } from "react";
import { getCourses, createCourse, deleteCourse, getUsers, enrollStudents, getCourseStudents, unenrollStudent } from "../services/api";
import { Plus, X, BookOpen, Users, Trash2, UserPlus, GraduationCap, Code, User as UserIcon, Clock, CalendarDays } from "lucide-react";
import PageHero from "../components/PageHero";
import FilterBar from "../components/FilterBar";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEnroll, setShowEnroll] = useState(null); // course id
  const [showStudents, setShowStudents] = useState(null); // {courseId, name}
  const [students, setStudents] = useState([]); // enrolled students list
  const [allUsers, setAllUsers] = useState([]);
  const [form, setForm] = useState({ name: "", code: "", description: "", instructor: "", start_time: "", end_time: "", days: "" });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const load = async () => {
    try { setCourses((await getCourses()).data.courses); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // Create course
  const handleCreate = async (e) => {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      await createCourse(form);
      setForm({ name: "", code: "", description: "", instructor: "", start_time: "", end_time: "", days: "" });
      setShowCreate(false); load();
    } catch (e) { setErr(e.response?.data?.detail || "Failed."); }
    finally { setSaving(false); }
  };

  // Delete course
  const handleDelete = async (id) => {
    if (!confirm("Delete this course?")) return;
    try { await deleteCourse(id); load(); } catch {}
  };

  // Open enroll modal
  const openEnroll = async (courseId) => {
    setShowEnroll(courseId); setSelectedUsers([]);
    try { setAllUsers((await getUsers()).data); } catch {}
  };

  // Enroll
  const handleEnroll = async () => {
    if (!selectedUsers.length) return; setSaving(true);
    try {
      await enrollStudents(showEnroll, selectedUsers);
      setShowEnroll(null); load();
    } catch {} finally { setSaving(false); }
  };

  // View enrolled students
  const openStudents = async (courseId, courseName) => {
    setShowStudents({ courseId, name: courseName });
    try { setStudents((await getCourseStudents(courseId)).data); } catch {}
  };

  // Unenroll
  const handleUnenroll = async (userId) => {
    try {
      await unenrollStudent(showStudents.courseId, userId);
      setStudents(s => s.filter(x => x.user_id !== userId));
      load();
    } catch {}
  };

  const toggleUser = (id) => {
    setSelectedUsers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  return (
    <div className="space-y-5">
      <PageHero icon={BookOpen} title="Course Management"
        subtitle="Academic Courses"
        image="https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1400&q=80&fit=crop">
        <button onClick={() => { setShowCreate(true); setErr(""); }} className="btn-primary text-xs">
          <Plus className="w-3.5 h-3.5" /> New Course
        </button>
      </PageHero>

      <FilterBar search={search} onSearch={setSearch}
        placeholder="Search courses by name, code, or instructor..."
        count={courses.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()) || (c.instructor||'').toLowerCase().includes(search.toLowerCase())).length} />

      {/* Course grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full animate-spin" style={{ border: "2.5px solid var(--border)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : courses.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()) || (c.instructor||'').toLowerCase().includes(search.toLowerCase())).length === 0 ? (
        <div className="glass-solid py-20 text-center">
          <BookOpen className="mx-auto w-8 h-8 mb-2" style={{ color: "var(--text-3)", opacity: 0.3 }} />
          <p className="text-sm" style={{ color: "var(--text-3)" }}>No courses yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courses.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase()) || (c.instructor||'').toLowerCase().includes(search.toLowerCase())).map((c, i) => (
            <div key={c.id} className="glass animate-fade-up overflow-hidden" style={{ animationDelay: `${i * 50}ms` }}>
              {/* Top color bar */}
              <div style={{ height: 3, background: "linear-gradient(90deg, var(--gold), rgba(212,168,67,0.2))" }} />

              <div className="p-5">
                {/* Header row */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #d4a843, #8B6914)", boxShadow: "0 0 12px rgba(212,168,67,0.15)" }}>
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-primary-dynamic truncate">{c.name}</h3>
                    <span className="text-[11px] font-mono font-bold" style={{ color: "var(--gold)" }}>{c.code}</span>
                  </div>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                    style={{ color: "var(--text-3)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.10)"; e.currentTarget.style.color = "#ef4444"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {c.instructor && (
                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <UserIcon className="w-3.5 h-3.5" style={{ color: "var(--gold)" }} />
                      <div>
                        <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "var(--text-3)" }}>Instructor</p>
                        <p className="text-[11px] font-semibold text-primary-dynamic">{c.instructor}</p>
                      </div>
                    </div>
                  )}
                  {(c.start_time || c.end_time) && (
                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <Clock className="w-3.5 h-3.5" style={{ color: "#3b82f6" }} />
                      <div>
                        <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "var(--text-3)" }}>Schedule</p>
                        <p className="text-[11px] font-semibold text-primary-dynamic">{c.start_time || "?"} – {c.end_time || "?"}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Days chips */}
                {c.days && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.days.split(",").filter(Boolean).map(d => (
                      <span key={d} className="px-2 py-0.5 rounded-md text-[10px] font-bold"
                        style={{ background: "rgba(212,168,67,0.10)", color: "var(--gold)", border: "1px solid rgba(212,168,67,0.15)" }}>
                        {d}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {c.description && (
                  <p className="text-[11px] leading-relaxed line-clamp-2 mb-3" style={{ color: "var(--text-3)" }}>{c.description}</p>
                )}

                {/* Stats + Actions footer */}
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                  <button onClick={() => openStudents(c.id, c.name)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,168,67,0.06)"; e.currentTarget.style.borderColor = "rgba(212,168,67,0.15)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; }}>
                    <Users className="w-3.5 h-3.5" style={{ color: "var(--gold)" }} />
                    <span className="text-xs font-bold" style={{ color: "var(--text-2)" }}>{c.enrolled_count}</span>
                    <span className="text-[10px]" style={{ color: "var(--text-3)" }}>students</span>
                  </button>
                  <button onClick={() => openEnroll(c.id)} className="btn-primary text-[11px] py-1.5 px-3 min-h-0">
                    <UserPlus className="w-3 h-3" /> Enroll
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Create Modal ─── */}
      {showCreate && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal-box">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-base font-bold text-primary-dynamic">New Course</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg" style={{ color: "var(--text-3)" }}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6">
              {err && <div className="mb-4 px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "#ef4444" }}>{err}</div>}
              <form id="cf" onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>Name <span style={{ color: "var(--gold)" }}>*</span></label>
                    <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="Data Structures" /></div>
                  <div><label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>Code <span style={{ color: "var(--gold)" }}>*</span></label>
                    <input type="text" required value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="input" placeholder="CS201" /></div>
                </div>
                <div><label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>Instructor</label>
                  <input type="text" value={form.instructor} onChange={e => setForm({...form, instructor: e.target.value})} className="input" placeholder="Dr. Smith" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>Start Time</label>
                    <input type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} className="input" /></div>
                  <div><label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>End Time</label>
                    <input type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} className="input" /></div>
                </div>
                <div><label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>Days</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => {
                      const selected = (form.days || "").split(",").filter(Boolean).includes(d);
                      return (
                        <button key={d} type="button" onClick={() => {
                          const cur = (form.days || "").split(",").filter(Boolean);
                          const next = selected ? cur.filter(x => x !== d) : [...cur, d];
                          setForm({...form, days: next.join(",")});
                        }}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
                          style={{
                            background: selected ? "rgba(212,168,67,0.15)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${selected ? "rgba(212,168,67,0.30)" : "rgba(255,255,255,0.06)"}`,
                            color: selected ? "var(--gold)" : "var(--text-3)",
                          }}>
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div><label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input min-h-[80px] resize-none" placeholder="Course description..." /></div>
              </form>
            </div>
            <div className="flex gap-3 px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button form="cf" type="submit" disabled={saving} className="btn-primary flex-1 text-sm">
                {saving ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                  : <><Plus className="w-4 h-4" /> Create Course</>}
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-outline flex-1 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Enroll Modal ─── */}
      {showEnroll && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowEnroll(null)}>
          <div className="modal-box">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-base font-bold text-primary-dynamic">Enroll Students</h2>
              <button onClick={() => setShowEnroll(null)} className="p-1.5 rounded-lg" style={{ color: "var(--text-3)" }}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 max-h-[400px] overflow-y-auto space-y-2">
              {allUsers.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-3)" }}>No students available</p>
              ) : allUsers.map(u => (
                <label key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors"
                  style={{ background: selectedUsers.includes(u.id) ? "rgba(212,168,67,0.10)" : "transparent", border: `1px solid ${selectedUsers.includes(u.id) ? "rgba(212,168,67,0.25)" : "var(--border)"}` }}>
                  <input type="checkbox" checked={selectedUsers.includes(u.id)} onChange={() => toggleUser(u.id)}
                    className="w-4 h-4 accent-amber-600 rounded" />
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: "linear-gradient(135deg, #d4a843, #8B6914)", color: "#fff" }}>
                    {u.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary-dynamic">{u.full_name}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-3)" }}>{u.email}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3 px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button onClick={handleEnroll} disabled={saving || !selectedUsers.length} className="btn-primary flex-1 text-sm">
                <UserPlus className="w-4 h-4" /> Enroll {selectedUsers.length || ""}
              </button>
              <button onClick={() => setShowEnroll(null)} className="btn-outline flex-1 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Students List Modal ─── */}
      {showStudents && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowStudents(null)}>
          <div className="modal-box">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h2 className="text-base font-bold text-primary-dynamic">{showStudents.name}</h2>
                <p className="text-[11px]" style={{ color: "var(--text-3)" }}>{students.length} enrolled students</p>
              </div>
              <button onClick={() => setShowStudents(null)} className="p-1.5 rounded-lg" style={{ color: "var(--text-3)" }}><X className="w-4 h-4" /></button>
            </div>
            <div className="p-6 max-h-[400px] overflow-y-auto space-y-2">
              {students.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: "var(--text-3)" }}>No students enrolled</p>
              ) : students.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ border: "1px solid var(--border)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: "linear-gradient(135deg, #d4a843, #8B6914)", color: "#fff" }}>
                    {s.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-primary-dynamic">{s.full_name}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-3)" }}>
                      Enrolled {new Date(s.enrolled_at).toLocaleDateString()}
                    </p>
                  </div>
                  <button onClick={() => handleUnenroll(s.user_id)} className="p-1.5 rounded-lg"
                    style={{ color: "var(--text-3)" }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.10)"; e.currentTarget.style.color = "#ef4444"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
