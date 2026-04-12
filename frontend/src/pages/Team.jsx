import { useEffect, useState } from 'react';
import { Users, Plus, Mail } from 'lucide-react';
import { api } from '../api/client';

const ROLE_COLORS = {
  Admin: 'bg-primary-600 text-white',
  Member: 'bg-slate-100 text-slate-600',
  Viewer: 'bg-green-100 text-green-700',
};

function MemberCard({ user }) {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const avatarColors = ['#7c3aed','#2563eb','#16a34a','#dc2626','#d97706','#0891b2'];
  const color = avatarColors[user.name.charCodeAt(0) % avatarColors.length];

  return (
    <div className="card p-5 flex items-center gap-4 hover:shadow-md transition-all duration-200 animate-fade-in">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900">{user.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Mail size={12} className="text-slate-400" />
          <p className="text-sm text-slate-500 truncate">{user.email}</p>
        </div>
      </div>
      <span className={`badge ${ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-600'}`}>
        {user.role}
      </span>
    </div>
  );
}

export default function Team() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.getUsers().then(setUsers).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createUser({ name, email, role });
      setName(''); setEmail(''); setRole('Member'); setShowForm(false);
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Team Directory</h1>
          <p className="page-subtitle">Connect with your workspace members.</p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
          id="add-member-btn"
        >
          <Plus size={16} />
          Add Member
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card p-6 animate-scale-in">
          <h3 className="font-bold text-slate-900 mb-4">Add Team Member</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="John Smith" value={name} onChange={e => setName(e.target.value)} required id="member-name-input" />
            </div>
            <div>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="john@company.com" value={email} onChange={e => setEmail(e.target.value)} required id="member-email-input" />
            </div>
            <div>
              <label className="form-label">Role</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)} id="member-role-select">
                <option>Admin</option>
                <option>Member</option>
                <option>Viewer</option>
              </select>
            </div>
            <div className="sm:col-span-3 flex gap-3 justify-end">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving} id="save-member-btn">
                {saving ? 'Saving...' : 'Add Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Member list */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-slate-400">Loading...</div>
      ) : users.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-slate-400">
          <Users size={40} className="mb-3 opacity-30" />
          <p className="font-medium">No team members yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.map(u => <MemberCard key={u.id} user={u} />)}
        </div>
      )}
    </div>
  );
}
