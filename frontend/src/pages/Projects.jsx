import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import ProjectCard from '../components/ProjectCard';
import Modal from '../components/Modal';
import AIModal from '../components/AIModal';
import { Plus, Sparkles } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const load = async () => {
    try {
      setError(null);
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
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

  return (
    <>
      <div className="flex flex-col gap-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Projects</h1>
            <p className="page-subtitle">Manage and track your active initiatives.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="btn-ai"
              onClick={() => setShowAIModal(true)}
              id="ai-planner-btn"
            >
              <Sparkles size={16} />
              AI Architect
            </button>
            <button
              className="btn-primary"
              onClick={() => setShowModal(true)}
              id="new-project-btn"
            >
              <Plus size={16} />
              New Project
            </button>
          </div>
        </div>

        {/* Grid */}
        {error ? (
          <div className="card flex flex-col items-center justify-center py-24 text-red-500">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-40">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="font-medium">Failed to load projects</p>
            <p className="text-sm mt-1 mb-4">{error}</p>
            <button className="btn-secondary" onClick={load}>Try Again</button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-24 text-slate-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-40">
              <path d="M5 3h14a2 2 0 0 1 2 2v3H3V5a2 2 0 0 1 2-2z" /><path d="M3 8v13h18V8" /><path d="M8 12h8" /><path d="M8 16h4" />
            </svg>
            <p className="font-medium">No projects yet</p>
            <p className="text-sm mt-1 mb-4">Create your first project to get started</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map(p => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          type="project"
          onClose={() => setShowModal(false)}
          onSave={() => { setShowModal(false); load(); }}
        />
      )}

      {showAIModal && (
        <AIModal
          onClose={() => setShowAIModal(false)}
          onSave={(projectId) => {
            setShowAIModal(false);
            if (projectId) {
              navigate(`/projects/${projectId}`);
            } else {
              load();
            }
          }}
        />
      )}
    </>
  );
}
