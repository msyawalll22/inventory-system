import React, { useState, useEffect } from 'react';
import apiRequest from '../../utils/api.js';
import SuccessAlert from '../../components/SuccessAlert';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ username: '', password: '', role: 'STAFF' });
  const [loading, setLoading] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState({ 
    show: false, 
    title: '', 
    message: '', 
    type: 'success' 
  });
  
  const [confirmModal, setConfirmModal] = useState({ show: false, userId: null, username: '' });

  const fetchUsers = async () => {
    try {
      const response = await apiRequest('/auth/users');
      if (response.ok) {
        const data = await response.json();
        // SOFT DELETE FILTER: Only show users who are not deleted
        // If your backend doesn't filter this automatically, we do it here
        const activeUsers = data.filter(user => user.deleted !== true);
        setUsers(activeUsers);
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
    setLoading(true);

    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      const result = await response.text();

      if (response.ok) {
        setFormData({ username: '', password: '', role: 'STAFF' });
        fetchUsers();
        setAlertConfig({
          show: true,
          type: 'success',
          title: "PROVISIONED",
          message: `User account for @${formData.username} has been created.`
        });
      } else {
        setAlertConfig({
          show: true,
          type: 'error',
          title: "REGISTRATION FAILED",
          message: result || "The system could not create this account."
        });
      }
    } catch (err) {
      setAlertConfig({
        show: true,
        type: 'error',
        title: "AUTH ERROR",
        message: "Network authentication failure."
      });
    } finally {
      setLoading(false);
    }
  };

  const openConfirmModal = (id, username) => {
    setConfirmModal({ show: true, userId: id, username: username });
  };

  // UPDATED FOR SOFT DELETE
  const executeRevoke = async () => {
    const { userId, username } = confirmModal;
    setConfirmModal({ show: false, userId: null, username: '' });

    try {
      /** * NOTE: For Soft Delete, your Backend DELETE route should simply set 
       * 'deleted = true' in the DB instead of executing 'DELETE FROM users...'
       */
      const response = await apiRequest(`/auth/users/${userId}`, { 
        method: 'DELETE' // Or 'PATCH' if your API uses a status update route
      });

      if (response.ok) {
        // UI OPTIMISTIC UPDATE: Remove user from list immediately
        setUsers(users.filter(u => u.id !== userId));
        
        setAlertConfig({
          show: true,
          type: 'success',
          title: "ACCESS REVOKED",
          message: `@${username} has been deactivated. Data remains in archive.`
        });
      } else {
        throw new Error();
      }
    } catch (err) {
      setAlertConfig({
        show: true,
        type: 'error',
        title: "SYSTEM ERROR",
        message: "Could not deactivate user account."
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

      {confirmModal.show && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Deactivate User?</h3>
              <p className="text-sm text-slate-500 mt-2 px-4 leading-relaxed font-medium">
                This will soft-delete <span className="font-bold text-slate-900">@{confirmModal.username}</span>. 
                They will no longer be able to log in.
              </p>
            </div>
            
            <div className="flex p-4 gap-3 bg-slate-50">
              <button 
                onClick={() => setConfirmModal({ show: false, userId: null, username: '' })}
                className="flex-1 px-4 py-3 text-[10px] font-bold text-slate-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
              >
                BACK
              </button>
              <button 
                onClick={executeRevoke}
                className="flex-1 px-4 py-3 text-[10px] font-bold bg-slate-900 text-white rounded-xl hover:bg-rose-600 transition-all shadow-lg uppercase"
              >
                Confirm Deactivation
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <header className="mb-10 pb-8 border-b border-slate-200">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
            Access <span className="text-indigo-600 italic">Control</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Manage administrative privileges and staff credentials.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* REGISTRATION PANEL */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-8">
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Create Password</label>
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
                    <select
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none appearance-none font-bold text-xs text-slate-700 cursor-pointer"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="STAFF">STAFF (Restricted)</option>
                      <option value="ADMIN">ADMIN (Full Access)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 mt-4"
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
                      <th className="px-8 py-5 text-right">Actions</th>
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
                            <span className={`h-1.5 w-1.5 rounded-full ${u.role === 'ADMIN' ? 'bg-amber-500' : 'bg-indigo-500'}`}></span>
                            {u.role}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <button
                            onClick={() => openConfirmModal(u.id, u.username)}
                            className="opacity-0 group-hover:opacity-100 bg-slate-100 text-slate-600 hover:bg-rose-600 hover:text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-200"
                          >
                            Deactivate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {users.length === 0 && (
                <div className="py-24 text-center">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Zero active accounts found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;