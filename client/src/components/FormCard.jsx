function FormCard({ title, children }) {
  return (
    <section className="app-card p-5 sm:p-6">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <div className="space-y-3.5">{children}</div>
    </section>
  );
}

export default FormCard;
