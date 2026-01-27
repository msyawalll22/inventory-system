import React, { useState, useEffect } from 'react';
import apiRequest from '../../utils/api.js';
import SuccessAlert from '../../components/SuccessAlert';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'STAFF' });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  
  const [alertConfig, setAlertConfig] = useState({ 
    show: false, title: '', message: '', type: 'success' 
  });
  
  const [confirmModal, setConfirmModal] = useState({ show: false, userId: null, username: '' });

  const fetchUsers = async () => {
    try {
      const response = await apiRequest('/auth/users');
      if (response.ok) {
        const data = await response.json();
        // Backend @Where clause already handles the soft-delete filter
        setUsers(data); 
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const startEdit = (user) => {
    setIsEditing(true);
    setEditingUserId(user.id);
    setFormData({ username: user.username, password: '', role: user.role });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditingUserId(null);
    setFormData({ username: '', password: '', role: 'STAFF' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = isEditing ? `/auth/users/${editingUserId}` : '/auth/register';
      const method = isEditing ? 'PUT' : 'POST';
      const response = await apiRequest(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        cancelEdit();
        fetchUsers();
        setAlertConfig({
          show: true,
          type: 'success',
          title: isEditing ? "ACCOUNT UPDATED" : "PROVISIONED",
          message: `@${formData.username} has been processed successfully.`
        });
      } else {
        const result = await response.text();
        throw new Error(result);
      }
    } catch (err) {
      setAlertConfig({
        show: true,
        type: 'error',
        title: "ACTION FAILED",
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const executeRevoke = async () => {
    const { userId, username } = confirmModal;
    setConfirmModal({ show: false, userId: null, username: '' });
    try {
      const response = await apiRequest(`/auth/users/${userId}`, { method: 'DELETE' });
      const message = await response.text();

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId));
        setAlertConfig({
          show: true,
          type: 'success',
          title: "ACCESS REVOKED",
          message: `@${username} is no longer active.`
        });
      } else {
        // This will catch the "Last Admin" error from the backend
        throw new Error(message);
      }
    } catch (err) {
      setAlertConfig({
        show: true,
        type: 'error',
        title: "REVOKE DENIED",
        message: err.message
      });
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <SuccessAlert 
        show={alertConfig.show}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={() => setAlertConfig({ ...alertConfig, show: false })}
      />

      {/* --- ADDED MODAL BACK IN --- */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 uppercase">Deactivate?</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Are you sure you want to revoke access for <span className="text-slate-900 font-bold">@{confirmModal.username}</span>?
              </p>
            </div>
            <div className="flex p-4 gap-3 bg-slate-50">
              <button onClick={() => setConfirmModal({ show: false, userId: null, username: '' })} className="flex-1 px-4 py-3 text-[10px] font-bold text-slate-500 hover:bg-white rounded-xl">BACK</button>
              <button onClick={executeRevoke} className="flex-1 px-4 py-3 text-[10px] font-bold bg-slate-900 text-white rounded-xl hover:bg-rose-600 shadow-lg uppercase">Confirm</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <header className="mb-10 pb-8 border-b border-slate-200">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
            Access <span className="text-indigo-600 italic">Control</span>
          </h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* PANEL START */}
          <div className="lg:col-span-4">
            <div className={`bg-white rounded-2xl border transition-all duration-300 shadow-sm overflow-hidden sticky top-8 ${isEditing ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-slate-200'}`}>
              <div className={`${isEditing ? 'bg-indigo-600 text-white' : 'bg-slate-50/50 text-slate-500'} px-6 py-4 border-b border-slate-200 flex justify-between items-center`}>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em]">{isEditing ? 'Edit Existing Account' : 'Provision New Account'}</h2>
                {isEditing && <button onClick={cancelEdit} className="text-[9px] font-bold bg-white/20 px-2 py-1 rounded">CANCEL</button>}
              </div>
              
              <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
                    <input required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-semibold" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">{isEditing ? 'New Password (Optional)' : 'Create Password'}</label>
                    <input required={!isEditing} type="password" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all text-sm font-semibold" placeholder={isEditing ? "Leave blank to keep current" : "••••••••"} value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Level</label>
                    <select className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 appearance-none font-bold text-xs text-slate-700 cursor-pointer" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                      <option value="STAFF">STAFF (Restricted)</option>
                      <option value="ADMIN">ADMIN (Full Access)</option>
                    </select>
                  </div>

                  <button type="submit" disabled={loading} className={`w-full text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 mt-4 ${isEditing ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                    {loading ? "Processing..." : isEditing ? "Update Credentials" : "Provision Account"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* TABLE START */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-200">
                      <th className="px-8 py-5">Identity</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className={`transition-colors group ${editingUserId === u.id ? 'bg-indigo-50/50' : 'hover:bg-slate-50/30'}`}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center font-bold text-xs">
                              {u.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="block font-bold text-slate-800 text-sm tracking-tight">{u.username}</span>
                              <span className="text-[9px] font-mono text-slate-400 uppercase">ID: {u.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${u.role === 'ADMIN' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(u)} className="bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Edit</button>
                            <button onClick={() => setConfirmModal({ show: true, userId: u.id, username: u.username })} className="bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">Revoke</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;