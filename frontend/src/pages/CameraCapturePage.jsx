import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { captureAttendance } from "../services/api";
import { Camera, RefreshCw, CheckCircle, Scan, Lock, Image as Img, Zap, Download, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHero from "../components/PageHero";

export default function CameraCapturePage() {
  const navigate = useNavigate();
  const wcRef = useRef(null);
  const [pic, setPic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const capture = useCallback(() => { const s = wcRef.current?.getScreenshot(); if (s) { setPic(s); setResult(null); setError(""); } }, []);
  const reset = () => { setPic(null); setResult(null); setError(""); };

  const submit = async () => {
    if (!pic) return; setLoading(true); setError("");
    try {
      const [h, d] = pic.split(","); const m = h.match(/:(.*?);/)[1]; const b = atob(d);
      const a = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) a[i] = b.charCodeAt(i);
      const fd = new FormData(); fd.append("image", new Blob([a], { type: m }), "cap.jpg");
      setResult((await captureAttendance(fd)).data);
    } catch (err) { setError(err.response?.data?.detail || "Failed."); }
    finally { setLoading(false); }
  };

  const steps = [
    { icon: Camera, label: "Capture", done: !!pic },
    { icon: Scan, label: "Recognize", done: loading || !!result },
    { icon: Lock, label: "Encrypt", done: !!result },
    { icon: Img, label: "Embed", done: !!result },
  ];

  return (
    <div className="space-y-5">
      <PageHero icon={Camera} title="Capture Attendance"
        subtitle="Face Recognition Pipeline"
        image="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1400&q=80&fit=crop" />

      {/* Pipeline steps */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-1.5">
            {i > 0 && <div className="w-8 h-px" style={{ background: s.done ? "var(--gold)" : "var(--border)" }} />}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold"
              style={{
                background: s.done ? "rgba(212,168,67,0.10)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${s.done ? "rgba(212,168,67,0.25)" : "rgba(255,255,255,0.04)"}`,
                color: s.done ? "var(--gold)" : "var(--text-3)",
              }}>
              <s.icon className="w-3.5 h-3.5" /> {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Camera */}
        <div className="glass p-5">
          <h3 className="text-sm font-bold text-primary-dynamic mb-3">{pic ? "Preview" : "Live Camera"}</h3>
          <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)", background: "#000" }}>
            {pic ? <img src={pic} alt="Captured" className="w-full" />
              : <Webcam ref={wcRef} audio={false} screenshotFormat="image/jpeg"
                  videoConstraints={{ facingMode: "user", width: 640, height: 480 }} className="w-full" />}
          </div>
          <div className="mt-4 flex gap-2">
            {pic ? (<>
              <button onClick={reset} className="btn-outline flex-1 text-xs"><RefreshCw className="w-3.5 h-3.5" /> Retake</button>
              <button onClick={submit} disabled={loading} className="btn-primary flex-1 text-xs">
                {loading ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                  : <><CheckCircle className="w-3.5 h-3.5" /> Submit</>}
              </button>
            </>) : (
              <button onClick={capture} className="btn-primary flex-1 text-xs"><Camera className="w-3.5 h-3.5" /> Capture</button>
            )}
          </div>
        </div>

        {/* Result */}
        <div className="glass p-5">
          <h3 className="text-sm font-bold text-primary-dynamic mb-3">Result</h3>
          {loading && (
            <div className="flex flex-col items-center py-12 gap-2">
              <div className="w-7 h-7 rounded-full animate-spin" style={{ border: "2.5px solid var(--border)", borderTopColor: "var(--gold)" }} />
              <span className="text-xs" style={{ color: "var(--text-3)" }}>Processing pipeline...</span>
            </div>
          )}
          {error && <div className="px-3 py-2.5 rounded-xl text-sm mb-3" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "#ef4444" }}>{error}</div>}
          {result && (
            <div className="space-y-4 animate-fade-up">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.20)", color: "#22c55e" }}>
                <CheckCircle className="w-4 h-4" /> <span className="text-sm font-semibold">{result.message}</span>
              </div>
              <div className="rounded-xl p-4 space-y-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
                {[
                  ["Record", `#${result.record.id}`],
                  ["Student", result.record.full_name],
                  ["Time", new Date(result.record.timestamp).toLocaleString()],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between text-sm">
                    <span style={{ color: "var(--text-3)" }}>{l}</span>
                    <span className="font-semibold text-primary-dynamic">{v}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm items-center">
                  <span style={{ color: "var(--text-3)" }}>Status</span>
                  <span className="badge badge-success">{result.record.status}</span>
                </div>
              </div>

              {/* Stego Image Preview */}
              <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                <div className="px-3 py-2 flex items-center justify-between" style={{ background: "rgba(212,168,67,0.06)", borderBottom: "1px solid var(--border)" }}>
                  <span className="text-[11px] font-bold flex items-center gap-1.5" style={{ color: "var(--gold)" }}>
                    <Img className="w-3.5 h-3.5" /> Stego Image (contains hidden encrypted data)
                  </span>
                </div>
                <img
                  src={`/${result.record.stego_image_path}`}
                  alt="Stego image with embedded attendance data"
                  className="w-full"
                />
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <a
                  href={`/${result.record.stego_image_path}`}
                  download={`attendance_${result.record.id}.png`}
                  className="btn-primary flex-1 text-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Download Stego Image
                </a>
                <button
                  onClick={() => navigate("/viewer")}
                  className="btn-gold flex-1 text-xs"
                >
                  <Eye className="w-3.5 h-3.5" /> Verify in Viewer
                </button>
              </div>

              <div className="rounded-lg px-3 py-2 text-[10px] text-center font-medium"
                style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.12)", color: "var(--gold)" }}>
                This image looks normal but contains your encrypted attendance data hidden in the pixel bits (LSB steganography).
                Download it and upload to the Verification page to prove the data is embedded.
              </div>
            </div>
          )}
          {!loading && !result && !error && (
            <div className="py-12 text-center" style={{ color: "var(--text-3)" }}>
              <Zap className="mx-auto w-8 h-8 mb-2 opacity-20" />
              <p className="text-sm">Capture a photo to begin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
