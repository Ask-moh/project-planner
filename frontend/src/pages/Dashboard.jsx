import { useEffect, useState } from 'react';
import { FolderKanban, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../api/client';
import StatCard from '../components/StatCard';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const d = await api.getDashboard();
      setData(d);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener('project-created', handler);
    return () => window.removeEventListener('project-created', handler);
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div>
        <h1 className="page-title">Dashboard Overview</h1>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={data?.totalProjects ?? 0}
          icon={FolderKanban}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <StatCard
          label="Active Tasks"
          value={data?.activeTasks ?? 0}
          icon={Clock}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-500"
        />
        <StatCard
          label="Completed Tasks"
          value={data?.completedTasks ?? 0}
          icon={CheckCircle}
          iconBg="bg-green-50"
          iconColor="text-green-500"
        />
        <StatCard
          label="Overdue Tasks"
          value={data?.overdueTasks ?? 0}
          icon={AlertCircle}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Active Projects Progress */}
        <div className="card p-6 xl:col-span-2">
          <h2 className="font-bold text-slate-900 mb-4">Active Projects Progress</h2>
          {data?.projects?.length ? (
            <div className="flex flex-col gap-4">
              {data.projects.map(p => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: p.color || '#7c3aed' }}
                      />
                      <span className="text-sm font-semibold text-slate-800">{p.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-600">{p.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${p.progress}%`, backgroundColor: p.color || '#2563eb' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <FolderKanban size={40} className="mb-3 opacity-30" />
              <p className="text-sm">No projects yet. Create one to get started!</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-4">Recent Activity</h2>
          {data?.recentActivity?.length ? (
            <div className="flex flex-col gap-3">
              {data.recentActivity.map(act => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mt-0.5">
                    {(act.user_name || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      {act.action === 'created' ? (
                        <>Task <span className="font-semibold text-primary-600">"{act.entity_name}"</span> was created</>
                      ) : (
                        <>{act.action} <span className="font-semibold">{act.entity_name}</span></>
                      )}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(act.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-slate-400">
              <p className="text-sm">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
