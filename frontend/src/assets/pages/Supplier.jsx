import React, { useState, useEffect } from 'react';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState(null); 
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/suppliers');
      const data = await response.json();
      setSuppliers(data);
    } catch (err) {
      console.error("Failed to fetch suppliers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleEdit = (supplier) => {
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Confirm: Move this vendor to archive?")) {
      try {
        const response = await fetch(`http://localhost:8080/api/suppliers/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          showToast("Vendor archived successfully");
          fetchSuppliers();
        }
      } catch (err) {
        showToast("Server connection failure", "error");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId 
      ? `http://localhost:8080/api/suppliers/${editingId}` 
      : 'http://localhost:8080/api/suppliers';

    try {
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        showToast(editingId ? "Records updated" : "Supplier onboarded");
        closeModal();
        fetchSuppliers(); 
      }
    } catch (err) {
      showToast("Sync error", "error");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto">
        
        {notification && (
          <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-lg shadow-xl font-semibold text-xs border animate-in fade-in slide-in-from-top-4 duration-300 ${
            notification.type === 'success' ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-rose-600 border-rose-100'
          }`}>
            <span className="mr-2">{notification.type === 'success' ? '●' : '○'}</span> {notification.message}
          </div>
        )}

        {/* Professional Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-slate-200 pb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">Vendor <span className="text-indigo-600 italic">Registry</span></h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Manage corporate supply chain partners and logistics endpoints.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="mt-4 md:mt-0 bg-slate-900 text-white px-5 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-indigo-600 transition-all flex items-center gap-2 shadow-sm"
          >
            <span>+</span> Add Partner
          </button>
        </header>

        {/* Data Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                <th className="px-6 py-4">Company Profile</th>
                <th className="px-6 py-4">Contact Gateway</th>
                <th className="px-6 py-4">Official Address</th>
                <th className="px-6 py-4 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="4" className="py-20 text-center text-slate-400 font-medium text-xs tracking-widest animate-pulse">RETRIVING PARTNER DATA...</td></tr>
              ) : suppliers.length === 0 ? (
                  <tr><td colSpan="4" className="py-20 text-center text-slate-400 text-sm">No active vendors registered in system.</td></tr>
              ) : suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-6 py-5">
                    <span className="font-bold text-slate-800 block text-base">{s.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">UID-{s.id}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-semibold text-slate-600">{s.email}</div>
                    <div className="text-xs text-slate-400 mt-0.5 font-medium">{s.phone}</div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs text-slate-500 leading-normal max-w-[240px] font-medium italic">
                      {s.address || 'Address pending verification'}
                    </p>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end items-center gap-4">
                      <button onClick={() => handleEdit(s)} className="text-indigo-600 font-bold text-[10px] uppercase tracking-tighter hover:text-indigo-800 transition-colors">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="text-slate-300 font-bold text-[10px] uppercase tracking-tighter hover:text-rose-600 transition-colors">Archive</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="mt-6">
            <p className="text-[10px] text-slate-400 font-medium">Showing {suppliers.length} Active System Vendors</p>
        </footer>
      </div>

      {/* Professional Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                {editingId ? 'Edit Partner Details' : 'Register New Partner'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Corporate Identity</label>
                <input required className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold text-sm" placeholder="Full Legal Company Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary Email</label>
                  <input type="email" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" placeholder="procurement@vendor.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Number</label>
                  <input className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-bold" placeholder="+00 000 0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Registered Office</label>
                <textarea 
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium min-h-[100px]" 
                  placeholder="HQ Street Address, Suite, City, ZIP..."
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-3 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-lg transition-all border border-slate-100">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg shadow-lg hover:bg-indigo-600 transition-all">
                  {editingId ? 'Apply Changes' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;