import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Shield, LogIn, Eye, EyeOff, Fingerprint, Lock, Scan } from "lucide-react";

export default function LoginPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try { await loginUser(email, password); navigate("/"); }
    catch (err) { setError(err.response?.data?.detail || "Login failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-[100dvh] flex" style={{ background: "#060608" }}>
      {/* Left — Hero */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden"
        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1400&q=80&fit=crop')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(6,6,8,0.85), rgba(6,6,8,0.6))" }} />
        <div className="relative z-10 px-12 max-w-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #d4a843, #8B6914)", boxShadow: "0 0 40px rgba(212,168,67,0.2)" }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight">
            <span className="gold-text">Privacy-Preserving</span><br />
            <span className="text-white">Attendance System</span>
          </h1>
          <p className="text-sm mt-4 leading-relaxed" style={{ color: "var(--text-2)" }}>
            Secure face recognition with AES-256 encryption and LSB steganography.
            Your attendance data is encrypted and embedded into images for tamper-proof verification.
          </p>
          <div className="flex items-center gap-6 mt-8">
            {[
              { icon: Fingerprint, label: "Face Recognition" },
              { icon: Lock, label: "AES-256-GCM" },
              { icon: Scan, label: "Steganography" },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <f.icon className="w-4 h-4" style={{ color: "var(--gold)" }} />
                <span className="text-[11px] font-semibold" style={{ color: "var(--text-2)" }}>{f.label}</span>
              </div>
            ))}
          </div>
          {/* Stats */}
          <div className="flex gap-8 mt-10">
            {[{ n: "512-d", l: "Embeddings" }, { n: "256-bit", l: "Encryption" }, { n: "LSB", l: "Steganography" }].map((s, i) => (
              <div key={i}>
                <p className="text-xl font-extrabold gold-text">{s.n}</p>
                <p className="text-[10px] font-medium" style={{ color: "var(--text-3)" }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex items-center justify-center flex-1 lg:max-w-md px-6">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto mb-3 w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #d4a843, #8B6914)" }}>
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-extrabold gold-text">Attendance System</h1>
          </div>

          <h2 className="text-xl font-bold text-white">Sign In</h2>
          <p className="text-sm mt-1 mb-6" style={{ color: "var(--text-3)" }}>Access the attendance portal</p>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "#ef4444" }}>
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="input" placeholder="you@example.com" />
            </div>
            <div>
              <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} required value={password}
                  onChange={e => setPassword(e.target.value)} className="input pr-10" placeholder="Enter password" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }}>
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? <div className="w-5 h-5 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                : <><LogIn className="w-4 h-4" /> Sign In</>}
            </button>
          </form>

          <div className="gold-sep my-6" />
          <p className="text-center text-sm" style={{ color: "var(--text-3)" }}>
            No account? <Link to="/register" className="font-bold" style={{ color: "var(--gold)" }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
