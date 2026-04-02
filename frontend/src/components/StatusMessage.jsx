/**
 * Glassmorphism status message — success, error, info, warning.
 */

import { CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";

const variants = {
  success: { icon: CheckCircle, bg: "var(--success-bg)", border: "var(--success-border)", text: "var(--success-text)" },
  error: { icon: XCircle, bg: "var(--danger-bg)", border: "var(--danger-border)", text: "var(--danger-text)" },
  info: { icon: Info, bg: "var(--info-bg)", border: "var(--info-border)", text: "var(--info-text)" },
  warning: { icon: AlertTriangle, bg: "var(--warning-bg)", border: "var(--warning-border)", text: "var(--warning-text)" },
};

export default function StatusMessage({ type = "info", message, className = "" }) {
  if (!message) return null;
  const v = variants[type] || variants.info;
  const Icon = v.icon;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl p-3.5 ${className}`}
      style={{
        background: v.bg,
        border: `1px solid ${v.border}`,
        backdropFilter: "blur(10px)",
      }}
    >
      <Icon className="w-4 h-4 flex-shrink-0" style={{ color: v.text }} />
      <p className="text-sm font-medium" style={{ color: v.text }}>{message}</p>
    </div>
  );
}
