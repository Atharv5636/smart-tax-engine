import { useLocation } from "react-router-dom";
import PillNav from "./navigation/PillNav";

function TopBar() {
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Goal", href: "/goal" },
    { label: "Salary", href: "/salary" },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 sm:px-5 md:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tax Workspace
          </p>
          <h1 className="text-sm font-semibold text-slate-900 sm:text-base">Optimization Dashboard</h1>
        </div>
        <PillNav
          items={navItems}
          activeHref={location.pathname}
          ease="power2.easeOut"
          baseColor="#05060A"
          pillColor="#ffffff"
          hoveredPillTextColor="#ffffff"
          pillTextColor="#111827"
          initialLoadAnimation
        />
      </div>
    </header>
  );
}

export default TopBar;
