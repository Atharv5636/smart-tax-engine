import { NavLink, useNavigate } from "react-router-dom";
import GooeyNav from "./navigation/GooeyNav";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/tax", label: "Tax" },
  { to: "/simulation", label: "Simulation" },
  { to: "/optimize", label: "Optimize" },
  { to: "/goal", label: "Goal" },
  { to: "/salary", label: "Salary" },
  { to: "/capital-gains", label: "Capital Gains" },
  { to: "/chat-assistant", label: "Chat Assistant" },
];

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    navigate("/login");
  };

  const navItems = links.map((link) => ({
    label: link.label,
    href: link.to,
  }));

  return (
    <aside className="border-white/20 bg-[#ff27ff] md:sticky md:top-0 md:h-screen md:overflow-y-auto md:border-r">
      <div className="px-5 py-5 md:border-b md:border-white/20">
        <NavLink className="text-sm font-bold tracking-wide text-white" to="/">
          Smart Tax Engine
        </NavLink>
        <p className="mt-1 text-xs text-white/70">Planning workspace</p>
      </div>
      <div className="px-3 pb-3 pt-2">
        <GooeyNav
          items={navItems}
          particleCount={15}
          particleDistances={[90, 10]}
          particleR={100}
          initialActiveIndex={0}
          animationTime={600}
          timeVariance={300}
          colors={[1, 2, 3, 1, 2, 3, 1, 4]}
        />
      </div>
      <div className="px-4 pb-5 pt-2">
        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
        >
          Log Out
        </button>
      </div>
    </aside>
  );
}

export default Navbar;
