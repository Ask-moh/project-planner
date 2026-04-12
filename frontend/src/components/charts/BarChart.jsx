import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const PRIORITY_COLORS = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#dc2626',
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
  CRITICAL: '#dc2626',
};

export default function PriorityBarChart({ data }) {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No data yet</div>
  );

  const chartData = data.map(d => ({
    name: (d.priority || d.name || '').toUpperCase(),
    value: d.count,
    color: PRIORITY_COLORS[d.priority?.toLowerCase()] || '#94a3b8',
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          cursor={{ fill: '#f1f5f9' }}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
