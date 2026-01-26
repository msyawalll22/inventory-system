import React, { useState, useEffect } from 'react';
import apiRequest from '../../utils/api.js';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'STAFF' });
  const [loading, setLoading] = useState(false);
  
  // Custom UI State
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [confirmModal, setConfirmModal] = useState({ show: false, userId: null, username: '' });

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

  const notify = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 4000);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const result = await response.text();

      if (response.ok) {
        notify("User account provisioned successfully", "success");
        setFormData({ username: '', password: '', role: 'STAFF' });
        fetchUsers();
      } else {
        notify(result || "Registration failed", "error");
      }
    } catch (err) {
      notify("Network authentication failure", "error");
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = (id, username) => {
    setConfirmModal({ show: true, userId: id, username: username });
  };

  const executeRevoke = async () => {
    const { userId } = confirmModal;
    setConfirmModal({ show: false, userId: null, username: '' });

    try {
      const response = await apiRequest(`/auth/users/${userId}`, { method: 'DELETE' });
      if (response.ok) {
        notify("Access privileges revoked", "success");
        fetchUsers();
      } else {
        notify("Failed to revoke access", "error");
      }
    } catch (err) {
      notify("System error during revocation", "error");
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      
      {/* NOTIFICATION TOAST */}
      {notification.show && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center px-6 py-3 rounded-2xl shadow-2xl transition-all duration-500 animate-in fade-in slide-in-from-top-4
          ${notification.type === 'error' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white'}`}>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
             {notification.message}
          </span>
        </div>
      )}

      {/* CONFIRMATION POPUP (MIDDLE BOX) */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-300">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Revoke Access?</h3>
              <p className="text-sm text-slate-500 mt-2 px-4">
                You are about to permanently disable access for <span className="font-bold text-slate-900">@{confirmModal.username}</span>. This action is logged.
              </p>
            </div>
            
            <div className="flex p-4 gap-3 bg-slate-50">
              <button 
                onClick={() => setConfirmModal({ show: false, userId: null, username: '' })}
                className="flex-1 px-4 py-3 text-[10px] font-bold text-slate-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
              >
                CANCEL
              </button>
              <button 
                onClick={executeRevoke}
                className="flex-1 px-4 py-3 text-[10px] font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200"
              >
                REVOKE NOW
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Provision New Account</h2>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
                    <input
                      required
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold"
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
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Access Level</label>
                    <div className="relative">
                      <select
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none font-bold text-xs text-slate-700 cursor-pointer"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="STAFF">STAFF (Restricted)</option>
                        <option value="ADMIN">ADMIN (Full Access)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-[0.98] disabled:opacity-50 mt-4"
                  >
                    {loading ? "Authorizing..." : "Provision Account"}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* USER LIST PANEL */}
          <div className="lg:col-span-8">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-200">
                      <th className="px-8 py-5">Identity</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5 text-right">Security</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/30 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 flex items-center justify-center font-bold text-xs">
                              {u.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <span className="block font-bold text-slate-800 text-sm tracking-tight">{u.username}</span>
                              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">ID: {u.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                            u.role === 'ADMIN' 
                              ? 'bg-amber-50 text-amber-600 border-amber-100' 
                              : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${u.role === 'ADMIN' ? 'bg-amber-500' : 'bg-indigo-500'}`}></span>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => openConfirmModal(u.id, u.username)}
                            className="opacity-0 group-hover:opacity-100 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-200"
                          >
                            Revoke Access
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {users.length === 0 && (
                <div className="py-24 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-slate-50 rounded-full mb-4">
                     <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Zero secondary accounts found</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex items-center justify-between px-2">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic flex items-center gap-2">
                <span className="w-1 h-1 bg-indigo-400 rounded-full"></span>
                Security protocol: Admin users have write-access to core database.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Users;