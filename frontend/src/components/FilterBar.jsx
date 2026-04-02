/**
 * Reusable filter/search bar that sits right under the hero banner.
 * Dark glass strip with search input and optional filter controls.
 */

import { Search, X } from "lucide-react";

export default function FilterBar({ search, onSearch, placeholder = "Search...", count, children }) {
  return (
    <div className="rounded-2xl px-4 py-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      style={{
        background: "var(--bg-card-solid)",
        border: "1px solid var(--border)",
        marginTop: "0.25rem",
      }}>
      {/* Search input */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(212,168,67,0.5)" }} />
        <input
          type="text"
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder={placeholder}
          className="bg-transparent outline-none flex-1 text-sm min-w-0"
          style={{ color: "var(--text-1)" }}
        />
        {search && (
          <button onClick={() => onSearch("")}
            className="p-1 rounded-md" style={{ color: "var(--text-3)" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {count !== undefined && (
          <span className="text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-full flex-shrink-0"
            style={{ background: "rgba(212,168,67,0.08)", color: "var(--gold)", border: "1px solid rgba(212,168,67,0.15)" }}>
            {count}
          </span>
        )}
      </div>

      {/* Optional filter controls */}
      {children && (
        <>
          <div className="hidden sm:block w-px h-6" style={{ background: "var(--border)" }} />
          <div className="flex items-center gap-2 flex-wrap">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
