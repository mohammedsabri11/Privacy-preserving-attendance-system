import { useState, useEffect, useRef } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { getMe } from "../services/api";
import {
  LayoutDashboard, Camera, ClipboardList, Image, LogOut,
  Shield, UserPlus, ChevronLeft, ChevronRight, Menu, X,
  Bell, Search, Sun, Moon, BookOpen, Fingerprint, Sparkles,
  User, Key, Settings, ChevronDown, Lock,
} from "lucide-react";

const allNav = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "student"] },
  { to: "/capture", icon: Camera, label: "Attendance", roles: ["admin", "student"] },
  { to: "/students", icon: UserPlus, label: "Students", roles: ["admin"] },
  { to: "/courses", icon: BookOpen, label: "Courses", roles: ["admin", "student"] },
  { to: "/logs", icon: ClipboardList, label: "Records", roles: ["admin"] },
  { to: "/viewer", icon: Image, label: "Verification", roles: ["admin"] },
  { to: "/security", icon: Lock, label: "Security", roles: ["admin"] },
];

export default function Layout() {
  const { logout, role, isAdmin } = useAuth();
  const navigate = useNavigate();
  const nav = allNav.filter(n => n.roles.includes(role));
  const [collapsed, setCollapsed] = useState(false);
  const [mob, setMob] = useState(false);
  const [dark, setDark] = useState(true);
  const [userMenu, setUserMenu] = useState(false);
  const [me, setMe] = useState(null);
  const menuRef = useRef(null);
  const w = collapsed ? 78 : 270;

  useEffect(() => { getMe().then(r => setMe(r.data)).catch(() => {}); }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenu(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = me ? me.full_name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden" style={{ background: "var(--bg)" }}>
      {mob && <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMob(false)} />}

      {/* ═══════════ SIDEBAR ═══════════ */}
      <aside
        className={`fixed lg:relative z-50 h-full flex flex-col transition-all duration-300
          ${mob ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{
          width: w,
          background: "linear-gradient(180deg, #0c0c14 0%, #0a0a10 50%, #080810 100%)",
          borderRight: "1px solid rgba(212,168,67,0.08)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* ── Gold accent line at top ── */}
        <div style={{
          height: 2,
          background: "linear-gradient(90deg, transparent, #d4a843, rgba(212,168,67,0.3), transparent)",
        }} />

        {/* ── Brand ── */}
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #d4a843, #8B6914)",
                  boxShadow: "0 0 24px rgba(212,168,67,0.25), 0 4px 12px rgba(0,0,0,0.3)",
                }}>
                <Fingerprint className="w-5 h-5 text-white" />
              </div>
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-2xl animate-pulse-gold" style={{ opacity: 0.4 }} />
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-[15px] font-extrabold tracking-tight text-white">
                  Attend<span style={{ color: "#d4a843" }}>AI</span>
                </h1>
                <p className="text-[10px] font-medium tracking-wider uppercase"
                  style={{ color: "rgba(212,168,67,0.5)" }}>
                  Secure System
                </p>
              </div>
            )}
            <button className="ml-auto lg:hidden p-1" onClick={() => setMob(false)}
              style={{ color: "rgba(255,255,255,0.3)" }}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Role badge */}
          {!collapsed && (
            <div className="mt-4 px-3 py-2 rounded-xl"
              style={{
                background: isAdmin
                  ? "linear-gradient(135deg, rgba(212,168,67,0.10), rgba(212,168,67,0.03))"
                  : "linear-gradient(135deg, rgba(59,130,246,0.10), rgba(59,130,246,0.03))",
                border: `1px solid ${isAdmin ? "rgba(212,168,67,0.15)" : "rgba(59,130,246,0.15)"}`,
              }}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" style={{ color: isAdmin ? "#d4a843" : "#3b82f6" }} />
                <span className="text-[11px] font-bold" style={{ color: isAdmin ? "#d4a843" : "#3b82f6" }}>
                  {isAdmin ? "Administrator" : "Student"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ── Separator ── */}
        <div className="mx-4" style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.15), transparent)",
        }} />

        {/* ── Navigation ── */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {!collapsed && (
            <p className="px-3 mb-3 text-[9px] uppercase tracking-[0.2em] font-bold"
              style={{ color: "rgba(255,255,255,0.2)" }}>
              Menu
            </p>
          )}

          {nav.map(({ to, icon: Icon, label }, idx) => (
            <NavLink key={to} to={to} end={to === "/"} onClick={() => setMob(false)}>
              {({ isActive }) => (
                <div
                  className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200 group"
                  style={{
                    background: isActive
                      ? "linear-gradient(135deg, rgba(212,168,67,0.12), rgba(212,168,67,0.04))"
                      : "transparent",
                    color: isActive ? "#d4a843" : "rgba(255,255,255,0.40)",
                    fontWeight: isActive ? 700 : 500,
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                    if (!isActive) e.currentTarget.style.color = "rgba(255,255,255,0.40)";
                  }}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-l-full"
                      style={{
                        background: "linear-gradient(180deg, #f0d78c, #d4a843, #8B6914)",
                        boxShadow: "0 0 8px rgba(212,168,67,0.5)",
                      }}
                    />
                  )}

                  {/* Icon container */}
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={{
                      background: isActive ? "rgba(212,168,67,0.12)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isActive ? "rgba(212,168,67,0.20)" : "rgba(255,255,255,0.04)"}`,
                      boxShadow: isActive ? "0 0 12px rgba(212,168,67,0.15)" : "none",
                    }}
                  >
                    <Icon className="w-[16px] h-[16px]"
                      style={{
                        color: isActive ? "#d4a843" : "rgba(255,255,255,0.35)",
                        filter: isActive ? "drop-shadow(0 0 4px rgba(212,168,67,0.6))" : "none",
                      }}
                    />
                  </div>

                  {!collapsed && <span className="truncate">{label}</span>}

                  {/* Active dot */}
                  {isActive && !collapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{
                        background: "#d4a843",
                        boxShadow: "0 0 6px rgba(212,168,67,0.6)",
                      }}
                    />
                  )}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* ── Separator ── */}
        <div className="mx-4" style={{
          height: 1,
          background: "linear-gradient(90deg, transparent, rgba(212,168,67,0.12), transparent)",
        }} />

        {/* ── Bottom actions ── */}
        <div className="px-3 py-3 space-y-1">
          {/* Logout */}
          <button onClick={logout}
            className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all duration-200"
            style={{ color: "rgba(239,68,68,0.6)" }}
            onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; e.currentTarget.style.color = "#ef4444"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(239,68,68,0.6)"; }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.08)" }}>
              <LogOut className="w-4 h-4" />
            </div>
            {!collapsed && <span>Sign Out</span>}
          </button>

          {/* Collapse */}
          <button onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-full rounded-lg py-1.5 mt-1 transition-all"
            style={{ color: "rgba(255,255,255,0.15)" }}
            onMouseEnter={e => { e.currentTarget.style.color = "rgba(212,168,67,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "rgba(255,255,255,0.15)"; }}>
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>

      {/* ═══════════ MAIN ═══════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 lg:px-6 h-14 flex-shrink-0"
          style={{
            background: "rgba(10,10,15,0.85)",
            backdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(212,168,67,0.06)",
          }}>
          <button className="lg:hidden p-2 rounded-xl"
            style={{ background: "rgba(212,168,67,0.08)", color: "#d4a843" }}
            onClick={() => setMob(true)}>
            <Menu className="w-4 h-4" />
          </button>

          <div className="hidden md:flex items-center gap-2 flex-1 max-w-xs px-3 py-1.5 rounded-xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <Search className="w-3.5 h-3.5" style={{ color: "rgba(255,255,255,0.2)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Search...</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 rounded-xl transition-all"
              style={{ color: "#d4a843" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(212,168,67,0.08)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button className="p-2 rounded-xl relative transition-all"
              style={{ color: "rgba(255,255,255,0.3)" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background: "#d4a843", boxShadow: "0 0 4px rgba(212,168,67,0.6)" }} />
            </button>

            {/* User avatar dropdown */}
            <div className="relative" ref={menuRef}>
              <button onClick={() => setUserMenu(!userMenu)}
                className="flex items-center gap-2 p-1 pr-2 rounded-xl transition-all"
                style={{ border: "1px solid transparent" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--border)"}
                onMouseLeave={e => { if (!userMenu) e.currentTarget.style.borderColor = "transparent"; }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold"
                  style={{ background: "linear-gradient(135deg, #d4a843, #8B6914)", color: "#fff" }}>
                  {initials}
                </div>
                {me && (
                  <span className="hidden md:block text-xs font-semibold max-w-[100px] truncate" style={{ color: "var(--text-2)" }}>
                    {me.full_name.split(" ")[0]}
                  </span>
                )}
                <ChevronDown className="w-3 h-3" style={{ color: "var(--text-3)" }} />
              </button>

              {userMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl overflow-hidden animate-fade-up"
                  style={{
                    background: "var(--bg-card-solid)",
                    border: "1px solid var(--border)",
                    boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                    zIndex: 9998,
                  }}>
                  {/* User info */}
                  <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <p className="text-sm font-bold text-white truncate">{me?.full_name}</p>
                    <p className="text-[11px] truncate" style={{ color: "var(--text-3)" }}>{me?.email}</p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    {[
                      { icon: User, label: "My Profile", action: () => { navigate("/profile"); setUserMenu(false); } },
                      { icon: Key, label: "Change Password", action: () => { navigate("/profile"); setUserMenu(false); } },
                    ].map(({ icon: I, label, action }) => (
                      <button key={label} onClick={action}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium text-left transition-all"
                        style={{ color: "var(--text-2)" }}
                        onMouseEnter={e => { e.currentTarget.style.background = "rgba(212,168,67,0.06)"; e.currentTarget.style.color = "#d4a843"; }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; }}>
                        <I className="w-4 h-4" /> {label}
                      </button>
                    ))}
                  </div>

                  <div style={{ borderTop: "1px solid var(--border)" }} className="py-1">
                    <button onClick={() => { logout(); setUserMenu(false); }}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-[13px] font-medium text-left transition-all"
                      style={{ color: "rgba(239,68,68,0.7)" }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.06)"; e.currentTarget.style.color = "#ef4444"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(239,68,68,0.7)"; }}>
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="animate-fade-up max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
