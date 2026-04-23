import { Link } from "react-router-dom";

function FeatureCard({ title, description, to, icon = "\uD83D\uDCCC" }) {
  return (
    <Link
      to={to}
      className="group rounded-xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <h3 className="flex items-center gap-2 font-semibold text-slate-900 group-hover:text-slate-700">
        <span aria-hidden>{icon}</span>
        <span>{title}</span>
      </h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <p className="mt-4 text-sm font-medium text-slate-900">Start Analysis</p>
    </Link>
  );
}

export default FeatureCard;

