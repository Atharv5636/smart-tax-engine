import SpotlightCard from "./ui/SpotlightCard";

function PageHeader({ title, description }) {
  return (
    <SpotlightCard
      className="mb-6 border-white/10 p-4 shadow-[0_18px_35px_rgba(0,0,0,0.35)] sm:p-5"
      spotlightColor="rgba(193, 38, 201, 0.22)"
    >
      <p className="app-section-title">Planner Module</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-300 sm:text-base">{description}</p>
    </SpotlightCard>
  );
}

export default PageHeader;
