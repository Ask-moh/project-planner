import { useEffect, useState } from 'react';
import { FolderKanban, Clock, CheckCircle, AlertCircle, Activity } from 'lucide-react';
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

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500">Loading...</div>;

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <Activity size={24} className="text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening with your projects.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard
          label="Total Projects"
          value={data?.totalProjects ?? 0}
          icon={FolderKanban}
          iconBg="bg-blue-50 dark:bg-blue-900/20"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Active Tasks"
          value={data?.activeTasks ?? 0}
          icon={Clock}
          iconBg="bg-amber-50 dark:bg-amber-900/20"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <StatCard
          label="Completed Tasks"
          value={data?.completedTasks ?? 0}
          icon={CheckCircle}
          iconBg="bg-emerald-50 dark:bg-emerald-900/20"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Overdue Tasks"
          value={data?.overdueTasks ?? 0}
          icon={AlertCircle}
          iconBg="bg-rose-50 dark:bg-rose-900/20"
          iconColor="text-rose-600 dark:text-rose-400"
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Active Projects Progress */}
        <div className="card p-7 xl:col-span-2">
          <h2 className="font-extrabold text-lg text-slate-900 dark:text-white mb-6">Active Projects Progress</h2>
          {data?.projects?.length ? (
            <div className="flex flex-col gap-5">
              {data.projects.map(p => (
                <div key={p.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: p.color || '#6366f1' }}
                      />
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{p.progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${p.progress}%`, backgroundColor: p.color || '#6366f1' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
              <FolderKanban size={48} className="mb-4 opacity-20" strokeWidth={1.5} />
              <p className="text-sm font-medium">No projects yet. Create one to get started!</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card p-7">
          <h2 className="font-extrabold text-lg text-slate-900 dark:text-white mb-6">Recent Activity</h2>
          {data?.recentActivity?.length ? (
            <div className="flex flex-col gap-4">
              {data.recentActivity.map(act => (
                <div key={act.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm">
                    {(act.user_name || 'U').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-snug">
                      {act.action === 'created' ? (
                        <>Task <span className="font-bold text-primary-600 dark:text-primary-400">"{act.entity_name}"</span> was created</>
                      ) : (
                        <>{act.action} <span className="font-bold">{act.entity_name}</span></>
                      )}
                    </p>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">{formatDate(act.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-500">
              <Activity size={40} className="mb-3 opacity-20" />
              <p className="text-sm font-medium">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
