/**
 * Reusable page hero banner — dark image background with gradient overlay,
 * icon, title, subtitle, and optional right-side content.
 */

export default function PageHero({ icon: Icon, title, subtitle, image, children }) {
  return (
    <div className="hero-banner" style={{
      backgroundImage: `url('${image}')`,
      minHeight: 180,
    }}>
      <div className="w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(212,168,67,0.20), rgba(212,168,67,0.05))",
                border: "1px solid rgba(212,168,67,0.25)",
                boxShadow: "0 0 16px rgba(212,168,67,0.10)",
              }}>
              <Icon className="w-4 h-4" style={{ color: "#d4a843" }} />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.15em]"
              style={{ color: "rgba(212,168,67,0.7)" }}>
              {subtitle}
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white leading-tight">
            {title}
          </h1>
        </div>
        {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
      </div>
    </div>
  );
}
