import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import Modal from './Modal';

// FIXED: Columns now match backend statuses exactly (was 'doing', now 'in_progress' + 'review')
const COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'bg-slate-400 dark:bg-slate-500' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-primary-500 dark:bg-primary-400' },
  { key: 'review', label: 'Review', color: 'bg-amber-500 dark:bg-amber-400' },
  { key: 'done', label: 'Done', color: 'bg-emerald-500 dark:bg-emerald-400' },
];

const PRIORITY_STYLES = {
  critical: 'priority-critical',
  high: 'priority-high',
  medium: 'priority-medium',
  low: 'priority-low',
};

function KanbanCard({ task, onMove, onDelete }) {
  return (
    <div className="kanban-card group" id={`task-${task.id}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">{task.title}</p>
        <button
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 transition-all flex-shrink-0"
          onClick={() => onDelete(task.id)}
        >
          <Trash2 size={14} strokeWidth={2.5} />
        </button>
      </div>
      {task.description && (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between gap-2 mt-3">
        <span className={PRIORITY_STYLES[task.priority] || 'priority-medium'}>
          {task.priority || 'medium'}
        </span>
        {task.estimated_hours > 0 && (
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{task.estimated_hours}h</span>
        )}
      </div>
      {/* Move buttons */}
      <div className="flex gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-all flex-wrap">
        {COLUMNS.filter(c => c.key !== task.status).map(c => (
          <button
            key={c.key}
            onClick={() => onMove(task.id, c.key)}
            className="text-[10px] font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all dark:bg-slate-700/50 dark:hover:bg-slate-700 dark:text-slate-300"
          >
            → {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function KanbanBoard({ projectId, tasks, onRefresh }) {
  const [showModal, setShowModal] = useState(false);

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.key] = tasks.filter(t => t.status === col.key);
    return acc;
  }, {});

  const handleMove = async (taskId, newStatus) => {
    try {
      await api.updateTask(taskId, { status: newStatus });
      onRefresh?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.deleteTask(taskId);
      onRefresh?.();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <div className="kanban-wrapper">
        {COLUMNS.map(col => (
          <div key={col.key} className="kanban-column">
            <div className="kanban-column-header">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full shadow-sm ${col.color}`} />
                <span className="kanban-column-title">{col.label}</span>
              </div>
              <span className="kanban-count">{grouped[col.key].length}</span>
            </div>

            {grouped[col.key].map(task => (
              <KanbanCard
                key={task.id}
                task={task}
                onMove={handleMove}
                onDelete={handleDelete}
              />
            ))}

            {col.key === 'todo' && (
              <button
                className="kanban-add-btn"
                onClick={() => setShowModal(true)}
                id="kanban-add-task-btn"
              >
                <Plus size={16} strokeWidth={2.5} />
                Add Task
              </button>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <Modal
          type="task"
          projectId={projectId}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            onRefresh?.();
          }}
        />
      )}
    </>
  );
}
