function SkillChips({ title, skills, variant = "default" }) {
  const colorMap = {
    default: "bg-slate-800/60 border-slate-600 text-cyan-200",
    success: "bg-emerald-900/30 border-emerald-500 text-emerald-200",
    warning: "bg-amber-900/30 border-amber-500 text-amber-200",
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4 shadow-xl">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-300">{title}</h3>
      <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto pr-1">
        {skills?.length ? (
          skills.map((skill) => (
            <span
              key={skill}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${colorMap[variant]}`}
            >
              {skill}
            </span>
          ))
        ) : (
          <span className="text-sm text-slate-400">暂无数据</span>
        )}
      </div>
    </div>
  );
}

export default SkillChips;
