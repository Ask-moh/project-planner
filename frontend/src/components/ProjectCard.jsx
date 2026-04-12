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
      className="card p-5 cursor-pointer hover:shadow-md transition-all duration-200 animate-fade-in flex flex-col gap-4"
      onClick={() => navigate(`/projects/${project.id}`)}
      id={`project-card-${project.id}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
          style={{ backgroundColor: project.color || '#7c3aed' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 3h14a2 2 0 0 1 2 2v3H3V5a2 2 0 0 1 2-2z"/><path d="M3 8v13h18V8"/><path d="M8 12h8"/><path d="M8 16h4"/>
          </svg>
        </div>
        <span className={STATUS_BADGE[project.status] || 'badge-active'}>
          {project.status || 'Active'}
        </span>
      </div>

      {/* Info */}
      <div>
        <h3 className="font-bold text-slate-900 text-base leading-tight">{project.name}</h3>
        {project.description && (
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{project.description}</p>
        )}
      </div>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
          <span className="font-medium text-slate-700">Progress</span>
          <span className="font-semibold">{project.progress ?? 0}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill bg-primary-600"
            style={{ width: `${project.progress ?? 0}%` }}
          />
        </div>
      </div>

      {/* Task count */}
      <div className="flex items-center gap-1.5 text-xs text-slate-500">
        <Clock size={13} />
        <span>{project.completed_tasks ?? 0}/{project.total_tasks ?? 0} tasks</span>
      </div>
    </div>
  );
}
