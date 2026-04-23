import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import TopBar from "./TopBar";
import Silk from "./background/Silk";

function AppLayout() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 z-0">
        <Silk
          speed={5}
          scale={1}
          color="#c126c9"
          noiseIntensity={1.5}
          rotation={0}
        />
      </div>

      <div className="relative z-10 min-h-screen md:grid md:grid-cols-[250px_1fr]">
        <div className="hidden md:block">
          <Navbar />
        </div>
        <div className="flex min-h-screen flex-col">
          <TopBar />
          <div className="border-b border-slate-200 bg-white/80 p-2 backdrop-blur md:hidden">
            <Navbar />
          </div>
          <main className="flex-1 px-3 py-5 sm:px-5 md:px-6 md:py-7">
            <div className="mx-auto w-full max-w-[1400px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
