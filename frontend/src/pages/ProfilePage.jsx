import { useState, useEffect } from "react";
import { getMe, updateProfile, changePassword } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import PageHero from "../components/PageHero";
import {
  User, Mail, Shield, Key, Save, CheckCircle, AlertCircle,
  Calendar, Hash, Fingerprint, Edit3, Lock,
} from "lucide-react";

export default function ProfilePage() {
  const { isAdmin, role } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    getMe().then(r => {
      setUser(r.data);
      setName(r.data.full_name);
      setEmail(r.data.email);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true); setProfileMsg({ type: "", text: "" });
    try {
      const r = await updateProfile({ full_name: name, email });
      setUser(r.data);
      setProfileMsg({ type: "success", text: "Profile updated successfully" });
    } catch (err) {
      setProfileMsg({ type: "error", text: err.response?.data?.detail || "Update failed" });
    } finally { setProfileSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: "", text: "" });
    if (newPw !== confirmPw) { setPwMsg({ type: "error", text: "Passwords do not match" }); return; }
    if (newPw.length < 6) { setPwMsg({ type: "error", text: "Minimum 6 characters" }); return; }
    setPwSaving(true);
    try {
      await changePassword({ current_password: currentPw, new_password: newPw });
      setPwMsg({ type: "success", text: "Password changed successfully" });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      setPwMsg({ type: "error", text: err.response?.data?.detail || "Failed" });
    } finally { setPwSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 rounded-full animate-spin" style={{ border: "2.5px solid var(--border)", borderTopColor: "var(--gold)" }} />
    </div>
  );

  if (!user) return null;

  const initials = user.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      <PageHero icon={User} title="My Profile"
        subtitle="Account Settings"
        image="https://images.unsplash.com/photo-1614064641938-3bbee52942c7?w=1400&q=80&fit=crop" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Profile Card ── */}
        <div className="glass p-6 text-center">
          <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl font-extrabold"
            style={{ background: "linear-gradient(135deg, #d4a843, #8B6914)", color: "#fff", boxShadow: "0 0 30px rgba(212,168,67,0.2)" }}>
            {initials}
          </div>
          <h3 className="text-base font-bold text-primary-dynamic mt-4">{user.full_name}</h3>
          <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>{user.email}</p>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold"
            style={{
              background: isAdmin ? "rgba(212,168,67,0.10)" : "rgba(59,130,246,0.10)",
              border: `1px solid ${isAdmin ? "rgba(212,168,67,0.20)" : "rgba(59,130,246,0.20)"}`,
              color: isAdmin ? "#d4a843" : "#3b82f6",
            }}>
            <Shield className="w-3 h-3" />
            {isAdmin ? "Administrator" : "Student"}
          </div>

          <div className="gold-sep my-5" />

          <div className="space-y-3 text-left">
            {[
              { icon: Hash, label: "User ID", value: `#${user.id}` },
              { icon: Fingerprint, label: "Role", value: user.role },
              { icon: Calendar, label: "Joined", value: new Date(user.created_at).toLocaleDateString() },
            ].map(({ icon: I, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.02)" }}>
                <I className="w-4 h-4" style={{ color: "var(--gold)" }} />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>{label}</p>
                  <p className="text-sm font-semibold text-primary-dynamic">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Forms Column ── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Edit Profile */}
          <div className="glass p-6">
            <div className="flex items-center gap-2 mb-5">
              <Edit3 className="w-4 h-4" style={{ color: "var(--gold)" }} />
              <h3 className="text-sm font-bold text-primary-dynamic">Edit Profile</h3>
            </div>

            {profileMsg.text && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background: profileMsg.type === "success" ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)",
                  border: `1px solid ${profileMsg.type === "success" ? "rgba(34,197,94,0.20)" : "rgba(239,68,68,0.20)"}`,
                  color: profileMsg.type === "success" ? "#22c55e" : "#ef4444",
                }}>
                {profileMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>
                    <User className="w-3 h-3 inline mr-1" /> Full Name
                  </label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)}
                    className="input" placeholder="Your name" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>
                    <Mail className="w-3 h-3 inline mr-1" /> Email
                  </label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="input" placeholder="you@example.com" />
                </div>
              </div>
              <button type="submit" disabled={profileSaving} className="btn-primary text-sm">
                {profileSaving ? (
                  <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                ) : (
                  <><Save className="w-4 h-4" /> Save Changes</>
                )}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="glass p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lock className="w-4 h-4" style={{ color: "var(--gold)" }} />
              <h3 className="text-sm font-bold text-primary-dynamic">Change Password</h3>
            </div>

            {pwMsg.text && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium"
                style={{
                  background: pwMsg.type === "success" ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)",
                  border: `1px solid ${pwMsg.type === "success" ? "rgba(34,197,94,0.20)" : "rgba(239,68,68,0.20)"}`,
                  color: pwMsg.type === "success" ? "#22c55e" : "#ef4444",
                }}>
                {pwMsg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {pwMsg.text}
              </div>
            )}

            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>
                  <Key className="w-3 h-3 inline mr-1" /> Current Password
                </label>
                <input type="password" required value={currentPw} onChange={e => setCurrentPw(e.target.value)}
                  className="input" placeholder="Enter current password" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>
                    New Password
                  </label>
                  <input type="password" required value={newPw} onChange={e => setNewPw(e.target.value)}
                    className="input" placeholder="Min 6 characters" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--text-2)" }}>
                    Confirm Password
                  </label>
                  <input type="password" required value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                    className="input" placeholder="Repeat new password" />
                </div>
              </div>
              <button type="submit" disabled={pwSaving} className="btn-primary text-sm">
                {pwSaving ? (
                  <div className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff" }} />
                ) : (
                  <><Key className="w-4 h-4" /> Update Password</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
