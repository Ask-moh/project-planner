export default function StatCard({ label, value, icon: Icon, iconBg, iconColor }) {
  return (
    <div className="stat-card animate-fade-in">
      <div>
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon size={22} className={iconColor} />
      </div>
    </div>
  );
}
