import { useState } from 'react';
import { X, Sparkles, Send, Check, Loader2, List, Clock, Tag } from 'lucide-react';
import { api } from '../api/client';

export default function AIModal({ onClose, onSave }) {
  const [step, setStep] = useState('input'); // 'input', 'generating', 'review'
  const [goals, setGoals] = useState('');
  const [projectName, setProjectName] = useState('');
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async (e) => {
    e?.preventDefault();
    if (!goals.trim()) return;

    setStep('generating');
    setError('');
    try {
      const data = await api.generatePlan({ goals: goals.trim(), projectName });
      setPlan(data);
      setStep('review');
    } catch (err) {
      setError(err.message || 'AI Generation failed');
      setStep('input');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await api.savePlan({
        projectName: plan.title || projectName || 'AI Project',
        tasks: plan.tasks
      });
      onSave?.(result.projectId);
      onClose();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-box max-w-2xl bg-white border border-purple-100 overflow-hidden animate-scale-in">
        
        {/* Header - Purple Gradient */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-5 -m-6 mb-6 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">AI Project Architect</h3>
              <p className="text-xs text-white/80">Transforming ideas into plans</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
            {error}
          </div>
        )}

        {/* Step 1: Input */}
        {step === 'input' && (
          <div className="flex flex-col gap-5 animate-fade-in">
            <div>
              <label className="form-label text-slate-900 font-semibold">Project Name (Optional)</label>
              <input 
                className="form-input focus:ring-purple-400" 
                placeholder="e.g. Modern E-commerce App"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label text-slate-900 font-semibold">What are you planning to build? *</label>
              <textarea 
                className="form-textarea min-h-[160px] focus:ring-purple-400" 
                placeholder="Describe your goals, tech stack, or specific requirements..."
                value={goals}
                onChange={e => setGoals(e.target.value)}
                required
              />
              <p className="text-xs text-slate-400 mt-2">I will generate a complete task breakdown, time estimates, and priorities for you.</p>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="btn-secondary">Cancel</button>
              <button 
                onClick={handleGenerate} 
                disabled={!goals.trim()}
                className="btn-ai"
              >
                <Sparkles size={16} />
                Generate Plan
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Generating */}
        {step === 'generating' && (
          <div className="py-12 flex flex-col items-center justify-center gap-6 animate-fade-in">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={24} className="text-purple-600 animate-pulse" />
              </div>
            </div>
            <div className="text-center">
              <h4 className="font-bold text-slate-800 text-lg">Architecting Your Project...</h4>
              <p className="text-sm text-slate-500 max-w-xs mt-1 italic">
                "Developing complex architectures takes a moment of brilliance..."
              </p>
            </div>
            <div className="w-full max-w-xs h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 'review' && plan && (
          <div className="flex flex-col gap-4 animate-fade-in max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="p-4 bg-violet-50 rounded-2xl border border-violet-100 border-l-4 border-l-violet-500">
              <h4 className="font-bold text-violet-900">{plan.title}</h4>
              <p className="text-sm text-violet-700 mt-1 leading-relaxed">{plan.summary}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-lg text-xs font-bold text-violet-600 border border-violet-100">
                  <Clock size={12} /> ~{plan.totalEstimatedHours}h Total
                </span>
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-lg text-xs font-bold text-violet-600 border border-violet-100">
                  <List size={12} /> {plan.tasks?.length} Tasks
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Proposed Roadmap</p>
              {plan.tasks?.map((task, idx) => (
                <div key={idx} className="group p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-purple-200 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h5 className="text-sm font-bold text-slate-800 group-hover:text-purple-700 transition-colors">{task.title}</h5>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">{task.description}</p>
                    </div>
                    <span className={`badge text-[10px] uppercase ${
                      task.priority === 'critical' ? 'priority-critical' : 
                      task.priority === 'high' ? 'priority-high' : 
                      task.priority === 'low' ? 'priority-low' : 'priority-medium'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Clock size={10} /> {task.estimatedHours}h
                    </div>
                    <div className="flex gap-1">
                        {task.tags?.map(tag => (
                            <span key={tag} className="flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-200 text-slate-600 rounded text-[9px] font-bold uppercase">
                                <Tag size={8} /> {tag}
                            </span>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white/80 backdrop-blur-sm pb-2">
              <button onClick={() => setStep('input')} className="btn-secondary">Edit Prompt</button>
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="btn-ai"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {loading ? 'Finalizing...' : 'Save & Build Board'}
              </button>
            </div>
          </div>
        )}

      </div>
      <style>{`
        @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(250%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
