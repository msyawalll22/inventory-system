import React, { useState, useEffect } from 'react';
import apiRequest from '../../utils/api.js';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'STAFF' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await apiRequest('/auth/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setLoading(true);

    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const result = await response.text();

      if (response.ok) {
        setMessage({ text: "User account provisioned successfully", type: 'success' });
        setFormData({ username: '', password: '', role: 'STAFF' });
        fetchUsers();
      } else {
        setMessage({ text: result, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: "Network authentication failure", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id, username) => {
    if (window.confirm(`SECURITY ALERT: Are you sure you want to revoke access for ${username}?`)) {
      try {
        const response = await apiRequest(`/auth/users/${id}`, { method: 'DELETE' });
        if (response.ok) {
          fetchUsers();
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="mb-10 pb-8 border-b border-slate-200">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
            Access <span className="text-indigo-600">Control</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage administrative privileges and staff credentials.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* REGISTRATION PANEL */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Provision New Account</h2>
              </div>
              
              <div className="p-6">
                {message.text && (
                  <div className={`mb-6 p-4 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                    message.type === 'success' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                  }`}>
                    {message.type === 'success' ? '● ' : '○ '} {message.text}
                  </div>
                )}

                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
                    <input
                      required
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-semibold"
                      placeholder="e.g. jsmith_admin"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Temporary Password</label>
                    <input
                      required
                      type="password"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-semibold"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Level</label>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none font-bold text-xs text-slate-700 cursor-pointer"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="STAFF">STAFF (Restricted)</option>
                        <option value="ADMIN">ADMIN (Full Access)</option>
                      </select>
                      <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400 text-[8px]">▼</div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 mt-4"
                  >
                    {loading ? "Processing..." : "Authorize Account"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* USER LIST PANEL */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-200">
                    <th className="px-8 py-4">Identity</th>
                    <th className="px-8 py-4">Status</th>
                    <th className="px-8 py-4 text-right">Security</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 bg-slate-100 text-slate-500 rounded border border-slate-200 flex items-center justify-center font-bold text-xs uppercase">
                            {u.username.substring(0, 2)}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-800 text-sm tracking-tight">{u.username}</span>
                            <span className="text-[9px] font-mono text-slate-400">UID: {u.id.toString().padStart(4, '0')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider border ${
                          u.role === 'ADMIN' 
                            ? 'bg-amber-50 text-amber-600 border-amber-100' 
                            : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                        }`}>
                          <span className={`h-1 w-1 rounded-full ${u.role === 'ADMIN' ? 'bg-amber-500' : 'bg-indigo-500'}`}></span>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button
                          onClick={() => deleteUser(u.id, u.username)}
                          className="opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all"
                        >
                          Revoke Access
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {users.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-[0.2em]">Zero secondary accounts found</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex items-center justify-between px-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Note: Admin users can modify inventory and purge logs.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Users;