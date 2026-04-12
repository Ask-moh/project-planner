import { useEffect, useState } from 'react';
import { Activity, Layers, Target } from 'lucide-react';
import { api } from '../api/client';
import StatCard from '../components/StatCard';
import DonutChart from '../components/charts/DonutChart';
import PriorityBarChart from '../components/charts/BarChart';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWorkspaceAnalytics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Workspace insights and performance metrics.</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Overall Progress"
          value={`${data?.overallProgress ?? 0}%`}
          icon={Activity}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <StatCard
          label="Total Tasks"
          value={data?.totalTasks ?? 0}
          icon={Layers}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-500"
        />
        <StatCard
          label="Completed Projects"
          value={data?.completedProjects ?? 0}
          icon={Target}
          iconBg="bg-green-50"
          iconColor="text-green-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-4">Task Status Distribution</h2>
          <DonutChart data={data?.taskStatusDist || []} />
        </div>
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-4">Priority Density</h2>
          <PriorityBarChart data={data?.priorityDist || []} />
        </div>
      </div>
    </div>
  );
}
