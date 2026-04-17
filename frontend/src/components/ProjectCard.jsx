import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';

const STATUS_BADGE = {
  Active: 'badge-active',
  Completed: 'badge-completed',
  Paused: 'badge-paused',
  Overdue: 'badge-overdue',
};

export default function ProjectCard({ project }) {
  const navigate = useNavigate();
  const initials = project.name.slice(0, 1).toUpperCase();

  return (
    <div
      className="card p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in flex flex-col gap-5 group"
      onClick={() => navigate(`/projects/${project.id}`)}
      id={`project-card-${project.id}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-1">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-md group-hover:scale-110 transition-transform"
          style={{ backgroundColor: project.color || '#6366f1' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3h14a2 2 0 0 1 2 2v3H3V5a2 2 0 0 1 2-2z"/><path d="M3 8v13h18V8"/><path d="M8 12h8"/><path d="M8 16h4"/>
          </svg>
        </div>
        <span className={STATUS_BADGE[project.status] || 'badge-active'}>
          {project.status || 'Active'}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{project.name}</h3>
        {project.description && (
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{project.description}</p>
        )}
      </div>

      {/* Progress */}
      <div className="mt-auto">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">
          <span className="text-slate-700 dark:text-slate-300 tracking-wide uppercase text-[10px]">Progress</span>
          <span>{project.progress ?? 0}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill shadow-[0_0_10px_rgba(0,0,0,0.2)]"
            style={{ width: `${project.progress ?? 0}%`, backgroundColor: project.color || '#6366f1' }}
          />
        </div>
      </div>

      {/* Task count */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <Clock size={14} className="opacity-70" />
        <span>{project.completed_tasks ?? 0}/{project.total_tasks ?? 0} tasks completed</span>
      </div>
    </div>
  );
}
