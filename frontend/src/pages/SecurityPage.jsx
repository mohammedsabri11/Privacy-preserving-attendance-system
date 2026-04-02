import { useState, useEffect } from "react";
import { getKeys, generateKey, activateKey, deleteKey } from "../services/api";
import PageHero from "../components/PageHero";
import {
  Key, Plus, Shield, Trash2, CheckCircle, Lock, Copy, Eye, EyeOff,
  AlertTriangle, Zap, Hash, Calendar, Database,
} from "lucide-react";

export default function SecurityPage() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [revealedKeys, setRevealedKeys] = useState({});
  const [copied, setCopied] = useState(null);

  const load = async () => {
    try { setKeys((await getKeys()).data); } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const handleGenerate = async (e) => {
    e.preventDefault(); setErr(""); setSaving(true);
    try {
      await generateKey(name);
      setName(""); setShowCreate(false); load();
    } catch (e) { setErr(e.response?.data?.detail || "Failed"); }
    finally { setSaving(false); }
  };

  const handleActivate = async (id) => {
    try { await activateKey(id); load(); } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this key?")) return;
    try { await deleteKey(id); load(); } catch (e) { alert(e.response?.data?.detail || "Cannot delete"); }
  };

  const toggleReveal = (id) => setRevealedKeys(p => ({ ...p, [id]: !p[id] }));

  const copyKey = (hex, id) => {
    navigator.clipboard.writeText(hex);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const maskKey = (hex) => hex.slice(0, 8) + "•".repeat(48) + hex.slice(-8);

  return (
    <div className="space-y-6">
      <PageHero icon={Shield} title="Security & Encryption"
        subtitle="AES-256 Key Management"
        image="https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=1400&q=80&fit=crop">
        <button onClick={() => { setShowCreate(true); setErr(""); }} className="btn-primary text-xs">
          <Plus className="w-3.5 h-3.5" /> Generate New Key
        </button>
      </PageHero>

      {/* Info card */}
      <div className="glass p-5">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4" style={{ color: "var(--gold)" }} />
          <span className="text-sm font-bold text-primary-dynamic">How Encryption Keys Work</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: Key, title: "AES-256-GCM", desc: "Each key is 256 bits (32 bytes) of random data used for military-grade encryption" },
            { icon: Zap, title: "Active Key", desc: "Only one key is active at a time — all new attendance records are encrypted with it" },
            { icon: Database, title: "Key History", desc: "Old keys are kept so older records can still be decrypted for verification" },
          ].map((item, i) => (
            <div key={i} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
              <item.icon className="w-4 h-4 mb-2" style={{ color: "var(--gold)" }} />
              <p className="text-xs font-bold text-primary-dynamic">{item.title}</p>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-3)" }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Keys list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 rounded-full animate-spin" style={{ border: "2.5px solid var(--border)", borderTopColor: "var(--gold)" }} />
        </div>
      ) : keys.length === 0 ? (
        <div className="glass-solid py-16 text-center">
          <Key className="mx-auto w-8 h-8 mb-2" style={{ color: "var(--text-3)", opacity: 0.3 }} />
          <p className="text-sm" style={{ color: "var(--text-3)" }}>No keys generated yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k, i) => (
            <div key={k.id} className="glass p-5 animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Key info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: k.is_active ? "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${k.is_active ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.06)"}`,
                    }}>
                    <Key className="w-5 h-5" style={{ color: k.is_active ? "#22c55e" : "var(--text-3)" }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-primary-dynamic">{k.name}</span>
                      {k.is_active && (
                        <span className="badge badge-success text-[9px]">
                          <CheckCircle className="w-2.5 h-2.5" /> Active
                        </span>
                      )}
                    </div>
                    {/* Key value */}
                    <div className="flex items-center gap-2 mt-1.5">
                      <code className="text-[10px] font-mono break-all" style={{ color: "var(--text-3)" }}>
                        {revealedKeys[k.id] ? k.key_hex : maskKey(k.key_hex)}
                      </code>
                      <button onClick={() => toggleReveal(k.id)} className="flex-shrink-0 p-1 rounded"
                        style={{ color: "var(--text-3)" }}>
                        {revealedKeys[k.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                      <button onClick={() => copyKey(k.key_hex, k.id)} className="flex-shrink-0 p-1 rounded"
                        style={{ color: copied === k.id ? "#22c55e" : "var(--text-3)" }}>
                        {copied === k.id ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Stats + actions */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-center px-3">
                    <p className="text-lg font-extrabold tabular-nums text-primary-dynamic">{k.records_encrypted}</p>
                    <p className="text-[9px] uppercase tracking-wider font-bold" style={{ color: "var(--text-3)" }}>Records</p>
                  </div>
                  <div className="flex gap-1.5">
                    {!k.is_active && (
                      <button onClick={() => handleActivate(k.id)} className="btn-gold text-[11px] py-1.5 px-2.5 min-h-0">
                        <Zap className="w-3 h-3" /> Activate
                      </button>
                    )}
                    {k.records_encrypted === 0 && !k.is_active && (
                      <button onClick={() => handleDelete(k.id)}
                        className="p-1.5 rounded-lg" style={{ color: "var(--text-3)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.10)"; e.currentTarget.style.color = "#ef4444"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-3)"; }}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Meta row */}
              <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-3)" }}>
                  <Hash className="w-3 h-3" /> ID: {k.id}
                </span>
                <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-3)" }}>
                  <Calendar className="w-3 h-3" /> {new Date(k.created_at).toLocaleString()}
                </span>
                <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-3)" }}>
                  <Lock className="w-3 h-3" /> AES-256-GCM · 32 bytes
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-base font-bold text-primary-dynamic">Generate New Key</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg" style={{ color: "var(--text-3)" }}>
                <span className="text-lg">×</span>
              </button>
            </div>
            <div className="p-6">
              {err && <div className="mb-4 px-3 py-2.5 rounded-xl text-sm" style={{ background: "rgba(239,68,68,0.10)", border: "1px solid rgba(239,68,68,0.20)", color: "#ef4444" }}>{err}</div>}

              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4"
                style={{ background: "rgba(212,168,67,0.06)", border: "1px solid rgba(212,168,67,0.12)" }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "var(--gold)" }} />
                <p className="text-[11px]" style={{ color: "var(--gold)" }}>
                  This will deactivate the current key. New records will use the new key.
                </p>
              </div>

              <form id="kf" onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>
                    Key Name <span style={{ color: "var(--gold)" }}>*</span>
                  </label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    className="input" placeholder="e.g. Production Key April 2026" />
                </div>
              </form>
            </div>
            <div className="flex gap-3 px-6 py-4" style={{ borderTop: "1px solid var(--border)" }}>
              <button form="kf" type="submit" disabled={saving} className="btn-primary flex-1 text-sm">
                {saving ? <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                  : <><Key className="w-4 h-4" /> Generate Key</>}
              </button>
              <button onClick={() => setShowCreate(false)} className="btn-outline flex-1 text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
