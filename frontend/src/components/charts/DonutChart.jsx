import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const STATUS_COLORS = {
  todo: '#94a3b8',
  in_progress: '#3b82f6',
  review: '#f59e0b',
  done: '#22c55e',
  TODO: '#94a3b8',
  'IN PROGRESS': '#3b82f6',
  REVIEW: '#f59e0b',
  DONE: '#22c55e',
};

const STATUS_LABELS = {
  todo: 'TODO',
  in_progress: 'IN PROGRESS',
  review: 'REVIEW',
  done: 'DONE',
};

export default function DonutChart({ data }) {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center h-64 text-slate-400 text-sm">No data yet</div>
  );

  const chartData = data.map(d => ({
    name: STATUS_LABELS[d.status] || d.status.toUpperCase(),
    value: d.count,
    color: STATUS_COLORS[d.status] || '#94a3b8',
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={70}
          outerRadius={110}
          paddingAngle={3}
          dataKey="value"
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, name) => [value, name]}
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: '#64748b' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
