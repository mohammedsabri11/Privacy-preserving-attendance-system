import { useState, useRef } from "react";
import { extractData } from "../services/api";
import { Upload, FileSearch, Lock, Unlock, Image as Img, ArrowRight, Shield, Eye, CheckCircle, Sparkles } from "lucide-react";
import PageHero from "../components/PageHero";

export default function ImageViewerPage() {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onFile = e => {
    const f = e.target.files[0]; if (!f) return;
    setFile(f); setResult(null); setError("");
    const r = new FileReader(); r.onloadend = () => setPreview(r.result); r.readAsDataURL(f);
  };

  const extract = async () => {
    if (!file) return; setLoading(true); setError(""); setResult(null);
    try { const fd = new FormData(); fd.append("image", file); setResult((await extractData(fd)).data); }
    catch (e) { setError(e.response?.data?.detail || "Extraction failed."); }
    finally { setLoading(false); }
  };

  // Load demo stego-image from public folder, auto-extract
  const loadDemo = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const resp = await fetch("/demo_stego.png");
      const blob = await resp.blob();
      const demoFile = new File([blob], "demo_stego.png", { type: "image/png" });
      setFile(demoFile);
      // Set preview
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(blob);
      // Extract
      const fd = new FormData();
      fd.append("image", demoFile);
      setResult((await extractData(fd)).data);
    } catch (e) {
      setError(e.response?.data?.detail || "Demo extraction failed. Make sure the active key matches.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHero icon={Img} title="Stego Image Verification"
        subtitle="Data Extraction & Proof"
        image="https://images.unsplash.com/photo-1563206767-5b18f218e8de?w=1400&q=80&fit=crop">
        <button onClick={loadDemo} className="btn-primary text-xs">
          <Sparkles className="w-3.5 h-3.5" /> Load Demo
        </button>
      </PageHero>

      {/* Pipeline */}
      <div className="glass p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4" style={{ color: "var(--gold)" }} />
          <span className="text-xs font-bold" style={{ color: "var(--gold)" }}>Extraction Pipeline</span>
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {[
            { icon: Img, label: "Stego Image", c: "#3b82f6", done: !!preview },
            { icon: Eye, label: "LSB Extract", c: "#d4a843", done: loading || !!result },
            { icon: Lock, label: "Ciphertext", c: "#f59e0b", done: !!result },
            { icon: Unlock, label: "AES Decrypt", c: "#22c55e", done: !!result },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <ArrowRight className="w-3 h-3" style={{ color: s.done ? s.c : "var(--text-3)" }} />}
              <div className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all"
                style={{
                  background: s.done ? `${s.c}12` : "rgba(255,255,255,0.02)",
                  border: `1px solid ${s.done ? `${s.c}30` : "rgba(255,255,255,0.04)"}`,
                }}>
                <s.icon className="w-4 h-4" style={{ color: s.done ? s.c : "var(--text-3)" }} />
                <span className="text-[10px] font-bold" style={{ color: s.done ? s.c : "var(--text-3)" }}>{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upload */}
        <div className="glass p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-primary-dynamic">Upload Stego-Image</h3>
            {!file && (
              <button onClick={loadDemo} className="btn-gold text-[10px] py-1 px-2.5 min-h-0">
                <Sparkles className="w-3 h-3" /> Try Demo
              </button>
            )}
          </div>
          <div onClick={() => fileRef.current?.click()}
            className="cursor-pointer rounded-xl p-6 text-center transition-all duration-200"
            style={{ border: "2px dashed rgba(212,168,67,0.15)", background: preview ? "transparent" : "rgba(255,255,255,0.02)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(212,168,67,0.35)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(212,168,67,0.15)"; }}>
            {preview ? <img src={preview} alt="Preview" className="mx-auto max-h-56 rounded-xl" />
              : <>
                <Upload className="mx-auto w-8 h-8 mb-2" style={{ color: "var(--text-3)", opacity: 0.3 }} />
                <p className="text-sm" style={{ color: "var(--text-2)" }}>Click to select a stego-image (PNG)</p>
                <p className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>Or click "Load Demo" to try a sample image</p>
              </>}
          </div>
          <input ref={fileRef} type="file" accept="image/png" onChange={onFile} className="hidden" />
          {file && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs truncate max-w-[180px]" style={{ color: "var(--text-2)" }}>{file.name}</span>
              <div className="flex gap-2">
                <button onClick={() => { setFile(null); setPreview(null); setResult(null); setError(""); }}
                  className="btn-outline text-[10px] py-1 px-2.5 min-h-0">Clear</button>
                <button onClick={extract} disabled={loading} className="btn-primary text-xs">
                  {loading ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                    : <><FileSearch className="w-3.5 h-3.5" /> Extract</>}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Result */}
        <div className="glass p-5">
          <h3 className="text-sm font-bold text-primary-dynamic mb-3">Extracted Data</h3>
          {loading && <div className="flex flex-col items-center py-12 gap-2">
            <div className="w-7 h-7 rounded-full animate-spin" style={{ border: "2.5px solid var(--border)", borderTopColor: "var(--gold)" }} />
            <span className="text-xs" style={{ color: "var(--text-3)" }}>Extracting & decrypting...</span>
          </div>}
          {error && <div className="px-3 py-2.5 rounded-xl text-sm mb-3" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "#ef4444" }}>{error}</div>}
          {result && (
            <div className="space-y-4 animate-fade-up">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)", color: "#22c55e" }}>
                <CheckCircle className="w-4 h-4" /> <span className="text-sm font-semibold">{result.message}</span>
              </div>
              <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                {[
                  ["User ID", result.user_id],
                  ["Full Name", result.full_name],
                  ["Timestamp", new Date(result.timestamp).toLocaleString()],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span style={{ color: "var(--text-3)" }}>{l}</span>
                    <span className="font-semibold text-primary-dynamic">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm items-center">
                  <span style={{ color: "var(--text-3)" }}>Status</span>
                  <span className="badge badge-success">{result.status}</span>
                </div>
              </div>
              <div className="rounded-lg px-3 py-2.5 text-center text-[11px] font-bold"
                style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)", color: "#22c55e" }}>
                <CheckCircle className="w-3.5 h-3.5 inline mr-1.5" />
                AES-256-GCM integrity verified — data extracted from hidden image pixels
              </div>
            </div>
          )}
          {!loading && !result && !error && (
            <div className="py-12 text-center" style={{ color: "var(--text-3)" }}>
              <Lock className="mx-auto w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">Upload a stego-image or click "Load Demo"</p>
              <p className="text-[10px] mt-1">The hidden encrypted data will be extracted and decrypted</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
