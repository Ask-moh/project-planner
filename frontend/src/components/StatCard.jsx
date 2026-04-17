export default function StatCard({ label, value, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="stat-card animate-fade-in group">
      <div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-primary-500 transition-colors">{label}</p>
        <p className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">{value}</p>
      </div>
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${iconBg}`}>
        <Icon size={26} className={iconColor} strokeWidth={2.5} />
      </div>
    </div>
  );
}
