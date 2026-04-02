import { useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import Webcam from "react-webcam";
import { registerUser } from "../services/api";
import { Shield, UserPlus, Camera, X, Upload, ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [pw, setPw] = useState("");
  const [imgs, setImgs] = useState([]); const [cam, setCam] = useState(false);
  const [loading, setLoading] = useState(false); const [err, setErr] = useState(""); const [ok, setOk] = useState("");
  const wcRef = useRef(null); const fileRef = useRef(null);

  const snap = useCallback(() => { const s = wcRef.current?.getScreenshot(); if (s) setImgs(p => [...p, s]); }, []);
  const onFiles = e => Array.from(e.target.files).forEach(f => { const r = new FileReader(); r.onloadend = () => setImgs(p => [...p, r.result]); r.readAsDataURL(f); });
  const toBlob = d => { const [h, b] = d.split(","); const m = h.match(/:(.*?);/)[1]; const bin = atob(b); const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: m }); };

  const submit = async e => {
    e.preventDefault(); setErr(""); setOk("");
    if (!imgs.length) { setErr("Capture at least one face image."); return; }
    setLoading(true);
    try {
      const fd = new FormData(); fd.append("full_name", name); fd.append("email", email); fd.append("password", pw);
      imgs.forEach((i, n) => fd.append("face_images", toBlob(i), `f${n}.jpg`));
      await registerUser(fd); setOk("Registered! Redirecting..."); setTimeout(() => navigate("/login"), 1500);
    } catch (e) { setErr(e.response?.data?.detail || "Failed."); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[100dvh] px-4 py-8" style={{ background: "var(--bg)" }}>
      <div className="max-w-2xl mx-auto animate-fade-up">
        <Link to="/login" className="inline-flex items-center gap-2 mb-6 text-sm font-medium" style={{ color: "var(--gold)" }}>
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>
        <div className="text-center mb-8">
          <div className="mx-auto mb-3 w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #d4a843, #8B6914)" }}>
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold gold-text">Create Account</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Register with face for attendance</p>
        </div>
        <div className="glass-solid rounded-2xl p-6 md:p-8">
          {err && <div className="mb-4 px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "#ef4444" }}>{err}</div>}
          {ok && <div className="mb-4 px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)", color: "#22c55e" }}>{ok}</div>}
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>Full Name <span style={{ color: "var(--gold)" }}>*</span></label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input" placeholder="John Doe" /></div>
              <div><label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>Email <span style={{ color: "var(--gold)" }}>*</span></label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="you@example.com" /></div>
            </div>
            <div><label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>Password <span style={{ color: "var(--gold)" }}>*</span></label>
              <input type="password" required minLength={6} value={pw} onChange={e => setPw(e.target.value)} className="input" placeholder="Min 6 characters" /></div>
            <div>
              <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-2)" }}>
                Face Images <span style={{ color: "var(--gold)" }}>*</span>
                <span className="font-normal ml-2" style={{ color: "var(--text-3)" }}>({imgs.length})</span>
              </label>
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setCam(!cam)} className="btn-gold text-xs py-2 px-3"><Camera className="w-3.5 h-3.5" /> {cam ? "Hide" : "Camera"}</button>
                <button type="button" onClick={() => fileRef.current?.click()} className="btn-outline text-xs py-2 px-3"><Upload className="w-3.5 h-3.5" /> Upload</button>
                <input ref={fileRef} type="file" multiple accept="image/*" onChange={onFiles} className="hidden" />
              </div>
              {cam && (<div className="space-y-2 mb-3">
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                  <Webcam ref={wcRef} audio={false} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "user", width: 640, height: 480 }} className="w-full" /></div>
                <button type="button" onClick={snap} className="btn-primary text-xs py-2 px-3"><Camera className="w-3.5 h-3.5" /> Capture</button>
              </div>)}
              {imgs.length > 0 && <div className="flex flex-wrap gap-2">{imgs.map((m, i) => (
                <div key={i} className="relative group">
                  <img src={m} alt="" className="w-16 h-16 rounded-lg object-cover" style={{ border: "2px solid var(--border)" }} />
                  <button type="button" onClick={() => setImgs(p => p.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "#dc2626", color: "#fff" }}><X className="w-2.5 h-2.5" /></button>
                </div>
              ))}</div>}
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <div className="w-5 h-5 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                : <><UserPlus className="w-4 h-4" /> Register</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
