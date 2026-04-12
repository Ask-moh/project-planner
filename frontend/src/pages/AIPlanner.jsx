import { useState } from 'react';
import { Sparkles, Play, Save, ChevronRight, Clock, Tag } from 'lucide-react';
import { api } from '../api/client';
import { useNavigate } from 'react-router-dom';

const PRIORITY_STYLES = {
  critical: 'priority-critical',
  high: 'priority-high',
  medium: 'priority-medium',
  low: 'priority-low',
};

export default function AIPlanner() {
  const navigate = useNavigate();
  const [projectName, setProjectName] = useState('');
  const [goals, setGoals] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!goals.trim()) return;
    setError('');
    setLoading(true);
    setPlan(null);
    setSaved(false);
    try {
      const result = await api.generatePlan({ projectName: projectName.trim(), goals: goals.trim() });
      setPlan(result);
    } catch (err) {
      setError(err.message || 'Failed to generate plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const result = await api.savePlan({
        projectName: projectName || plan.summary?.split(' ').slice(0, 3).join(' ') || 'AI Project',
        tasks: plan.tasks,
      });
      setSaved(true);
      setTimeout(() => navigate(`/projects/${result.projectId}`), 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
          <Sparkles size={22} className="text-white" />
        </div>
        <div>
          <h1 className="page-title">AI Project Planner</h1>
          <p className="page-subtitle">Transform ideas into actionable project plans in seconds.</p>
        </div>
      </div>

      {/* Split panel */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" style={{ minHeight: 480 }}>
        {/* Input panel */}
        <div className="card p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-purple-500" />
            <span className="font-semibold text-slate-800">Input</span>
          </div>

          <form onSubmit={handleGenerate} className="flex flex-col gap-4 flex-1">
            <div>
              <label className="form-label">Project Name (Optional)</label>
              <input
                className="form-input"
                placeholder="e.g. Q3 Marketing Campaign"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                id="ai-project-name"
              />
            </div>

            <div className="flex-1 flex flex-col">
              <label className="form-label">Describe your project goals</label>
              <textarea
                className="form-textarea flex-1"
                style={{ minHeight: 200 }}
                placeholder="I want to build a mobile app for finding local coffee shops. It needs user authentication, maps integration, and reviews..."
                value={goals}
                onChange={e => setGoals(e.target.value)}
                required
                id="ai-goals-textarea"
              />
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !goals.trim()}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: loading ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}
              id="generate-plan-btn"
            >
              <Play size={16} />
              {loading ? 'Generating...' : 'Generate Plan'}
            </button>
          </form>
        </div>

        {/* Output panel */}
        <div className="card p-6 flex flex-col">
          {!plan && !loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Sparkles size={28} className="text-slate-300" />
              </div>
              <p className="font-semibold text-slate-500">Awaiting Instructions</p>
              <p className="text-sm text-center mt-1 max-w-xs">
                Describe your project on the left, and watch the AI instantly generate a structured task breakdown.
              </p>
            </div>
          ) : loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm font-medium">Generating your plan...</p>
            </div>
          ) : plan ? (
            <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
              {/* Summary */}
              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-sm text-purple-800 leading-relaxed">{plan.summary}</p>
                {plan.totalEstimatedHours && (
                  <div className="flex items-center gap-1.5 mt-2 text-xs text-purple-600 font-semibold">
                    <Clock size={13} />
                    <span>Total: ~{plan.totalEstimatedHours} hours</span>
                  </div>
                )}
              </div>

              {/* Tasks */}
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {plan.tasks?.length} Tasks Generated
                </p>
                {plan.tasks?.map((task, i) => (
                  <div key={i} className="p-3 border border-slate-100 rounded-xl hover:border-slate-200 transition-all">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-slate-800">{task.title}</p>
                      <span className={PRIORITY_STYLES[task.priority?.toLowerCase()] || 'priority-medium'}>
                        {task.priority}
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {task.estimatedHours > 0 && (
                        <span className="flex items-center gap-1"><Clock size={11} />{task.estimatedHours}h</span>
                      )}
                      {task.tags?.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Tag size={11} />
                          {task.tags.slice(0, 2).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving || saved}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 mt-auto"
                style={{ background: saved ? '#16a34a' : 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
                id="save-plan-btn"
              >
                <Save size={15} />
                {saved ? '✓ Saved! Redirecting...' : saving ? 'Saving...' : 'Save as Project'}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
