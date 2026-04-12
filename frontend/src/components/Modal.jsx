import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../api/client';

export default function Modal({ type, onClose, onSave, projectId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Project form state
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectColor, setProjectColor] = useState('#7c3aed');
  const [projectStatus, setProjectStatus] = useState('Active');

  // Task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskStatus, setTaskStatus] = useState('todo');
  const [taskHours, setTaskHours] = useState('');

  const colors = ['#7c3aed', '#2563eb', '#16a34a', '#dc2626', '#d97706', '#0891b2', '#db2777'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (type === 'project') {
        await api.createProject({ name: projectName, description: projectDesc, color: projectColor, status: projectStatus });
      } else if (type === 'task') {
        await api.createTask({
          project_id: projectId,
          title: taskTitle,
          description: taskDesc,
          priority: taskPriority,
          status: taskStatus,
          estimated_hours: parseFloat(taskHours) || 0,
        });
      }
      onSave?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="modal-title mb-0">
            {type === 'project' ? '✦ New Project' : '＋ New Task'}
          </h2>
          <button className="icon-btn" onClick={onClose} id="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {type === 'project' ? (
            <>
              <div>
                <label className="form-label">Project Name *</label>
                <input
                  className="form-input"
                  placeholder="e.g. E-Commerce Platform"
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  required
                  id="project-name-input"
                />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="Describe your project goals..."
                  value={projectDesc}
                  onChange={e => setProjectDesc(e.target.value)}
                  id="project-desc-input"
                />
              </div>
              <div>
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={projectStatus}
                  onChange={e => setProjectStatus(e.target.value)}
                  id="project-status-select"
                >
                  <option>Active</option>
                  <option>Paused</option>
                  <option>Completed</option>
                </select>
              </div>
              <div>
                <label className="form-label">Color</label>
                <div className="flex gap-2 mt-1">
                  {colors.map(c => (
                    <button
                      key={c}
                      type="button"
                      className={`w-7 h-7 rounded-full transition-transform ${projectColor === c ? 'ring-2 ring-offset-2 ring-slate-500 scale-110' : 'hover:scale-110'}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setProjectColor(c)}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="form-label">Task Title *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Set up authentication"
                  value={taskTitle}
                  onChange={e => setTaskTitle(e.target.value)}
                  required
                  id="task-title-input"
                />
              </div>
              <div>
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  placeholder="What needs to be done..."
                  value={taskDesc}
                  onChange={e => setTaskDesc(e.target.value)}
                  id="task-desc-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={taskPriority}
                    onChange={e => setTaskPriority(e.target.value)}
                    id="task-priority-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={taskStatus}
                    onChange={e => setTaskStatus(e.target.value)}
                    id="task-status-select"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Estimated Hours</label>
                <input
                  className="form-input"
                  type="number"
                  placeholder="0"
                  min="0"
                  step="0.5"
                  value={taskHours}
                  onChange={e => setTaskHours(e.target.value)}
                  id="task-hours-input"
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              className="btn-secondary flex-1 justify-center"
              onClick={onClose}
              id="modal-cancel-btn"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 justify-center"
              disabled={loading}
              id="modal-save-btn"
            >
              {loading ? 'Saving...' : type === 'project' ? 'Create Project' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
