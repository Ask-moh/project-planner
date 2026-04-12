import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { api } from '../api/client';
import KanbanBoard from '../components/KanbanBoard';
import Modal from '../components/Modal';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    try {
      const [proj, taskList] = await Promise.all([
        api.getProject(id),
        api.getTasks(id),
      ]);
      setProject(proj);
      setTasks(taskList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleDelete = async () => {
    if (!window.confirm(`Delete project "${project?.name}"? This cannot be undone.`)) return;
    try {
      await api.deleteProject(id);
      navigate('/projects');
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;
  if (!project) return <div className="text-center py-20 text-slate-400">Project not found.</div>;

  return (
    <>
      <div className="flex flex-col gap-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button
              className="icon-btn mt-1"
              onClick={() => navigate('/projects')}
              id="back-to-projects-btn"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ backgroundColor: project.color || '#7c3aed' }}
              >
                {project.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h1 className="page-title">{project.name}</h1>
                {project.description && (
                  <p className="page-subtitle max-w-xl">{project.description}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn-primary"
              onClick={() => setShowModal(true)}
              id="new-task-btn"
            >
              <Plus size={16} />
              New Task
            </button>
            <button
              className="icon-btn text-red-400 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              id="delete-project-btn"
              title="Delete project"
            >
              <Trash2 size={17} />
            </button>
          </div>
        </div>

        {/* Kanban */}
        <KanbanBoard
          projectId={id}
          tasks={tasks}
          onRefresh={load}
        />
      </div>

      {showModal && (
        <Modal
          type="task"
          projectId={id}
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load(); }}
        />
      )}
    </>
  );
}
