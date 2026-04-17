import { useEffect, useState, useRef } from 'react';
import { api } from '../api/client';
import { Calendar, X, Users, Filter, ArrowRight } from 'lucide-react';

function getDays(year, month) {
  const d = new Date(year, month + 1, 0);
  return Array.from({ length: d.getDate() }, (_, i) => i + 1);
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAY_W = 40; 
const WEEK_W = 120; 

export default function GanttChart() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [zoom, setZoom] = useState('days'); 
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const scrollRef = useRef(null);

  const today = new Date();

  const fetchData = async () => {
    try {
      const [tData, pData, uData] = await Promise.all([
        api.getTasks(),
        api.getProjects(),
        api.getUsers()
      ]);
      setTasks(tData || []);
      setProjects(pData || []);
      setUsers(uData || []);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  function parseDate(dString) {
    if (!dString) return null;
    const parts = dString.indexOf('T') === -1 ? dString.split('-') : dString.split('T')[0].split('-');
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(dString);
  }

  function getTaskDates(task) {
    let rawStart = task.start_date;
    let rawEnd = task.due_date;
    if (!rawStart && !rawEnd) {
      rawStart = today.toISOString();
      const fallbackDur = Math.max(1, Math.ceil((task.estimated_hours || 8) / 8));
      const fallbackEnd = new Date(today);
      fallbackEnd.setDate(today.getDate() + fallbackDur - 1);
      rawEnd = fallbackEnd.toISOString();
    }
    const start = rawStart ? parseDate(rawStart) : parseDate(rawEnd);
    const end = rawEnd ? parseDate(rawEnd) : (start || new Date());
    return { start, end };
  }

  const { allDays, groupedMonths, totalWidth, filteredTasks } = (() => {
    try {
      const ft = tasks.filter(t => {
        if (selected !== 'all' && t.project_id !== selected) return false;
        if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
        if (assigneeFilter !== 'all' && t.assignee !== assigneeFilter) return false;
        return true; 
      });

      if (ft.length === 0 && !loading) {
         return { allDays: [], groupedMonths: [], totalWidth: 0, filteredTasks: [] };
      }

      let min = new Date(today);
      let max = new Date(today);
      min.setDate(min.getDate() - 7);
      max.setDate(max.getDate() + 30);

      if (ft.length > 0) {
        let first = true;
        ft.forEach(task => {
          const { start, end } = getTaskDates(task);
          if (start && (start < min || first)) min = new Date(start);
          if (end && (end > max || first)) max = new Date(end);
          first = false;
        });
        min.setDate(min.getDate() - 7);
        max.setDate(max.getDate() + 14);
      }

      const diffDays = Math.ceil((max - min) / 86400000);
      const daysCount = Math.min(365, Math.max(30, diffDays));
      
      const days = [];
      let current = new Date(min);
      for (let i = 0; i < daysCount; i++) {
        days.push({
          year: current.getFullYear(),
          month: current.getMonth(),
          day: current.getDate(),
          date: new Date(current)
        });
        current.setDate(current.getDate() + 1);
      }

      const groups = [];
      let currentGroup = null;
      days.forEach(dInfo => {
        const key = `${dInfo.year}-${dInfo.month}`;
        if (!currentGroup || currentGroup.key !== key) {
          if (currentGroup) groups.push(currentGroup);
          currentGroup = { key, year: dInfo.year, month: dInfo.month, days: [] };
        }
        currentGroup.days.push(dInfo);
      });
      if (currentGroup) groups.push(currentGroup);

      return { allDays: days, groupedMonths: groups, totalWidth: days.length * DAY_W, filteredTasks: ft };
    } catch (err) {
      console.error("Gantt Calculation Error:", err);
      return { allDays: [], groupedMonths: [], totalWidth: 0, filteredTasks: [] };
    }
  })();

  const unitWidth = zoom === 'days' ? DAY_W : (WEEK_W / 7);

  useEffect(() => {
    if (!loading && scrollRef.current && allDays.length > 0) {
      const firstDay = allDays[0].date;
      const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const offset = (t - firstDay) / 86400000;
      scrollRef.current.scrollLeft = Math.max(0, (offset * unitWidth) - 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, zoom, allDays.length, unitWidth]);

  const stats = {
    total: filteredTasks.length,
    completed: filteredTasks.filter(t => t.status === 'done').length,
    overdue: filteredTasks.filter(t => t.status !== 'done' && parseDate(t.due_date) < today).length,
    percent: filteredTasks.length > 0 ? Math.round((filteredTasks.filter(t => t.status === 'done').length / filteredTasks.length) * 100) : 0,
    teamCount: new Set(filteredTasks.map(t => t.assignee).filter(Boolean)).size
  };

  const getAvatarFallback = (name) => {
    if (!name) return <div className="w-6 h-6 rounded-full bg-slate-200" />;
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500'];
    const color = colors[name.length % colors.length];
    return <div className={`w-6 h-6 rounded-full ${color} text-white flex items-center justify-center text-[10px] font-bold shadow-sm`}>{initials}</div>;
  };

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'critical': case 'high': return '#ef4444';
      case 'medium': return '#f97316';
      case 'low': return '#10b981';
      default: return '#3b82f6';
    }
  };

  const getBarStyle = (task) => {
    const { start, end } = getTaskDates(task);
    if (!allDays.length) return {};
    const firstDay = allDays[0].date;
    const startOffset = Math.max(0, Math.round((start - firstDay) / 86400000));
    const duration = Math.max(1, Math.round((end - start) / 86400000) + 1);
    
    return {
      left: `${startOffset * unitWidth}px`,
      width: `${Math.max(unitWidth - 4, duration * unitWidth - 4)}px`,
      backgroundColor: getPriorityColor(task.priority),
      zIndex: 10,
    };
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedTask) return;
    setIsSaving(true);
    try {
      await api.patchTask(selectedTask.id, { status: newStatus });
      await fetchData();
      setSelectedTask(prev => ({ ...prev, status: newStatus }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2 animate-fade-in max-w-[1400px] mx-auto pb-20">
      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Enterprise Gantt</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Manage team resources and dependencies.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => window.print()} className="btn-secondary py-2 px-4 flex items-center gap-2 text-sm font-bold">
            <Calendar size={16} /> Export PDF
          </button>
          <select className="form-select w-44 text-sm font-bold h-10 bg-white dark:bg-slate-800 dark:text-white dark:border-slate-700 pointer-events-auto" value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="all">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6 no-print">
        <div className="card p-5 bg-gradient-to-br from-indigo-500 to-indigo-600 border-none text-white shadow-lg shadow-indigo-200 dark:shadow-none">
           <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Project Progress</p>
           <h3 className="text-3xl font-black">{stats.percent}%</h3>
        </div>
        <div className="card p-5 flex flex-col justify-center">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Total Tasks</p>
           <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100">{stats.total}</h3>
        </div>
        <div className="card p-5 flex flex-col justify-center border-l-4 border-l-rose-500">
           <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1">Critical Overdue</p>
           <h3 className="text-3xl font-black text-rose-600 dark:text-rose-500">{stats.overdue}</h3>
        </div>
        <div className="card p-5 flex flex-col justify-center border-l-4 border-l-emerald-500">
           <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Active Team</p>
           <h3 className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{stats.teamCount}</h3>
        </div>
      </div>

      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm no-print">
        <div className="flex items-center gap-6">
          <div className="flex bg-slate-100 dark:bg-slate-700 p-1.5 rounded-xl">
            <button className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${zoom === 'days' ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-md' : 'text-slate-500 dark:text-slate-400'}`} onClick={() => setZoom('days')}>DAYS</button>
            <button className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${zoom === 'weeks' ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-md' : 'text-slate-500 dark:text-slate-400'}`} onClick={() => setZoom('weeks')}>WEEKS</button>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <select className="text-xs font-bold bg-transparent border-none focus:ring-0 text-slate-600 dark:text-slate-300 cursor-pointer" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
                <option value="all">Any Priority</option>
                <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Users size={14} className="text-slate-400" />
              <select className="text-xs font-bold bg-transparent border-none focus:ring-0 text-slate-600 dark:text-slate-300 cursor-pointer" value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}>
                <option value="all">Any Assignee</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-none bg-white dark:bg-slate-800">
        <div className="overflow-x-auto" ref={scrollRef}>
          <div style={{ minWidth: (allDays.length * unitWidth) + 200 }}>
            {/* Header */}
            <div className="flex bg-slate-50/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200 dark:border-slate-700">
              <div className="w-56 flex-shrink-0 px-6 py-4 border-r border-slate-200 dark:border-slate-700 font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <ArrowRight size={14} /> Task List
              </div>
              <div className="flex">
                {groupedMonths.map(g => (
                  <div key={g.key} style={{ width: g.days.length * unitWidth }}>
                    <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 px-3 py-1.5 border-b border-slate-200 dark:border-slate-700 uppercase tracking-tighter">
                      {MONTH_NAMES[g.month]} {g.year}
                    </div>
                    <div className="flex">
                      {zoom === 'days' ? g.days.map(d => (
                        <div key={d.date.toISOString()} style={{ width: unitWidth }} className={`text-[10px] text-center py-2 border-r border-slate-100 dark:border-slate-700/50 flex-shrink-0 font-bold ${d.date.toDateString() === today.toDateString() ? 'bg-primary-500 dark:bg-primary-600 text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                          {d.day}
                        </div>
                      )) : g.days.filter((_, i) => i % 7 === 0).map((d, i) => (
                        <div key={d.date.toISOString()} style={{ width: WEEK_W }} className="text-[10px] text-center py-2 border-r border-slate-200 dark:border-slate-700/50 flex-shrink-0 font-black text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-slate-800/50">
                          W{i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grid & Bars */}
            <div className="relative">
              {allDays.length > 0 && (
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500/40 z-30 pointer-events-none" 
                  style={{ left: `${Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - allDays[0].date) / 86400000) * unitWidth + 224}px` }} 
                />
              )}

              {/* Dependency SVG Layer */}
              <svg className="absolute inset-0 pointer-events-none z-10" style={{ left: 224, width: allDays.length * unitWidth, height: filteredTasks.length * 52 }}>
                <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                    <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" className="text-slate-400 dark:text-slate-600" />
                  </marker>
                </defs>
                {filteredTasks.map((task, rowIndex) => (
                  (task.dependencies || []).map(sid => {
                    const sIdx = filteredTasks.findIndex(t => t.id === sid);
                    if (sIdx === -1) return null;
                    const sTask = filteredTasks[sIdx];
                    const { end: sEnd } = getTaskDates(sTask);
                    const { start: tStart } = getTaskDates(task);
                    const firstDay = allDays[0].date;
                    
                    const x1 = (Math.round((sEnd - firstDay) / 86400000) + 1) * unitWidth;
                    const y1 = (sIdx * 52) + 26;
                    const x2 = Math.round((tStart - firstDay) / 86400000) * unitWidth;
                    const y2 = (rowIndex * 52) + 26;
                    
                    const isConflict = tStart < sEnd;
                    const color = isConflict ? "#f43f5e" : "#94a3b8"; 
                    const path = `M ${x1} ${y1} C ${x1 + 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`;
                    
                    return <path key={`${sid}-${task.id}`} d={path} stroke={color} strokeWidth="2" fill="none" markerEnd="url(#arrowhead)" />;
                  })
                ))}
              </svg>

              {loading ? (
                <div className="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Timeline...</div>
              ) : filteredTasks.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest text-xs">No tasks found</div>
              ) : (
                filteredTasks.map((task, i) => (
                  <div key={task.id} className="flex border-b border-slate-50 dark:border-slate-700/50 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors h-[52px]">
                    <div className="w-56 flex-shrink-0 px-6 py-3 border-r border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 flex items-center gap-3 z-20">
                       {task.assignee_details ? (
                         task.assignee_details.avatar ? <img src={task.assignee_details.avatar} className="w-6 h-6 rounded-full" alt="" /> : getAvatarFallback(task.assignee_details.name)
                       ) : <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700" />}
                       <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{task.title}</span>
                    </div>
                    <div className="relative flex-grow">
                       <div 
                         className="absolute h-8 rounded-lg shadow-sm flex items-center px-4 text-[10px] font-black text-white cursor-pointer hover:brightness-110 hover:scale-[1.02] transition-all z-20 active:scale-95 whitespace-nowrap overflow-hidden"
                         style={{ ...getBarStyle(task), top: '10px' }}
                         onClick={() => setSelectedTask(task)}
                       >
                         {task.title}
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={() => setSelectedTask(null)}>
          <div className="bg-white dark:bg-slate-800 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-scale-in border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="p-8">
               <div className="flex justify-between items-start mb-6">
                 <div className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: `${getPriorityColor(selectedTask.priority)}20`, color: getPriorityColor(selectedTask.priority) }}>
                   {selectedTask.priority} Priority
                 </div>
                 <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all text-slate-400"><X size={24} strokeWidth={2.5} /></button>
               </div>

               <div className="flex items-center gap-4 mb-8 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                  {selectedTask.assignee_details?.avatar ? (
                    <img src={selectedTask.assignee_details.avatar} className="w-12 h-12 rounded-full border-2 border-white dark:border-slate-800 shadow-md" alt="" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center font-black text-xl shadow-md uppercase">{selectedTask.assignee_details?.name?.[0] || '?'}</div>
                  )}
                  <div>
                    <h4 className="font-black text-slate-800 dark:text-white">{selectedTask.assignee_details?.name || 'Unassigned'}</h4>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{selectedTask.assignee_details?.role || 'Team Member'}</p>
                  </div>
               </div>

               <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2 leading-tight">{selectedTask.title}</h2>
               <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 font-medium leading-relaxed">{selectedTask.description || "No description provided."}</p>

               <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">STATUS</p>
                    <select className="w-full bg-transparent font-black text-slate-700 dark:text-slate-200 border-none p-0 focus:ring-0 cursor-pointer text-sm" value={selectedTask.status} onChange={e => handleUpdateStatus(e.target.value)} disabled={isSaving}>
                       <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="review">Review</option><option value="done">Done</option>
                    </select>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">ESTIMATED TIME</p>
                    <p className="font-black text-slate-700 dark:text-slate-200 text-sm">{selectedTask.estimated_hours || 0} HOURS</p>
                  </div>
               </div>

               <div className="flex gap-4">
                  <div className="flex-1 bg-primary-50/50 dark:bg-primary-900/20 p-4 rounded-2xl border border-primary-100/50 dark:border-primary-800/30">
                    <p className="text-[10px] font-black text-primary-400 uppercase mb-1">START</p>
                    <p className="font-black text-primary-700 dark:text-primary-300 text-sm">{getTaskDates(selectedTask).start.toLocaleDateString()}</p>
                  </div>
                  <div className="flex-1 bg-rose-50/50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-100/50 dark:border-rose-800/30">
                    <p className="text-[10px] font-black text-rose-400 uppercase mb-1">DUE DATE</p>
                    <p className="font-black text-rose-700 dark:text-rose-300 text-sm">{getTaskDates(selectedTask).end.toLocaleDateString()}</p>
                  </div>
               </div>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
               <button onClick={() => setSelectedTask(null)} className="px-8 py-3 bg-white dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-2xl font-black text-sm hover:border-primary-500 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-sm">
                 {isSaving ? 'SYNCING...' : 'CLOSE'}
               </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media print { .no-print { display: none !important; } .card { border: none !important; box-shadow: none !important; } }
      `}</style>
    </div>
  );
}
