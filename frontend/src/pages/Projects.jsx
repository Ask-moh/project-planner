import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import ProjectCard from '../components/ProjectCard';
import Modal from '../components/Modal';
import AIModal from '../components/AIModal';
import { Plus, Sparkles, FolderOpen } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  const load = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjectsPaginated(page);
      
      // Support both paginated and non-paginated gracefully
      if (data.results) {
        setProjects(data.results);
        // Assuming PAGE_SIZE = 20 from settings
        setTotalPages(Math.ceil(data.count / 20));
      } else {
        setProjects(data);
        setTotalPages(1);
      }
      setCurrentPage(page);
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
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <FolderOpen size={24} className="text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h1 className="page-title">Projects</h1>
              <p className="page-subtitle">Manage and track your active initiatives.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="btn-ai"
              onClick={() => setShowAIModal(true)}
              id="ai-planner-btn"
            >
              <Sparkles size={18} strokeWidth={2.5} />
              <span className="hidden sm:inline">AI Architect</span>
            </button>
            <button
              className="btn-primary"
              onClick={() => setShowModal(true)}
              id="new-project-btn"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span className="hidden sm:inline">New Project</span>
            </button>
          </div>
        </div>

        {/* Grid */}
        {error ? (
          <div className="card flex flex-col items-center justify-center py-24 text-red-500 dark:text-rose-400">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4 opacity-40">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <p className="font-semibold">Failed to load projects</p>
            <p className="text-sm mt-1 mb-4">{error}</p>
            <button className="btn-secondary" onClick={() => load()}>Try Again</button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64 text-slate-400 dark:text-slate-500 font-medium">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-24 text-slate-400 dark:text-slate-500">
            <FolderOpen size={48} className="mb-4 opacity-20" strokeWidth={1.5} />
            <p className="font-semibold text-slate-600 dark:text-slate-400">No projects yet</p>
            <p className="text-sm mt-1 mb-5">Create your first project to get started</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} strokeWidth={2.5} /> New Project
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {projects.map(p => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6 gap-2">
                {[...Array(totalPages)].map((_, i) => {
                  const pageNumber = i + 1;
                  const isActive = pageNumber === currentPage;
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => load(pageNumber)}
                      className={`w-10 h-10 rounded-xl font-bold transition-all duration-300 ${
                        isActive 
                          ? 'bg-primary-600 outline-none text-white shadow-md shadow-primary-500/30' 
                          : 'bg-white/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
            )}
          </>
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
