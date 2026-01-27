import React, { useState, useEffect } from 'react';
import SuccessAlert from '../../components/SuccessAlert';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Custom Alert and Confirmation States
  const [alertConfig, setAlertConfig] = useState({ show: false, title: '', message: '', type: 'success' });
  const [confirmArchive, setConfirmArchive] = useState({ show: false, id: null, name: '' });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/suppliers');
      if (response.ok) {
        const data = await response.json();
        setSuppliers(data);
      }
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

  const executeArchive = async () => {
    const { id } = confirmArchive;
    setConfirmArchive({ show: false, id: null, name: '' });
    try {
      const response = await fetch(`http://localhost:8080/api/suppliers/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setAlertConfig({
          show: true,
          type: 'success',
          title: "ARCHIVED",
          message: "The vendor has been moved to the corporate archive."
        });
        fetchSuppliers();
      }
    } catch (err) {
      setAlertConfig({
        show: true,
        type: 'error',
        title: "SYNC ERROR",
        message: "Server connection failure during archival."
      });
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
        setAlertConfig({
          show: true,
          type: 'success',
          title: editingId ? "UPDATED" : "ONBOARDED",
          message: editingId ? "Vendor records updated successfully." : "New partner registered in system."
        });
        closeModal();
        fetchSuppliers(); 
      }
    } catch (err) {
      setAlertConfig({
        show: true,
        type: 'error',
        title: "SUBMISSION FAILED",
        message: "Could not sync data with the server."
      });
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: '', email: '', phone: '', address: '' });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      
      {/* PROFESSIONAL ALERT SYSTEM */}
      <SuccessAlert 
        show={alertConfig.show}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={() => setAlertConfig({ ...alertConfig, show: false })}
      />

      {/* CUSTOM ARCHIVE CONFIRMATION */}
      {confirmArchive.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3">
                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M10 8v11m4-11v11M4 4h16c1.1 0 2 .9 2 2v2H2V6c0-1.1.9-2 2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Archive Partner?</h3>
              <p className="text-sm text-slate-500 mt-2 px-4 leading-relaxed">
                Relocate <span className="font-bold text-slate-900">{confirmArchive.name}</span> to the archives? This will restrict new procurement orders.
              </p>
            </div>
            <div className="flex p-4 gap-3 bg-slate-50">
              <button onClick={() => setConfirmArchive({ show: false, id: null, name: '' })} className="flex-1 px-4 py-3 text-[10px] font-bold text-slate-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 uppercase">Cancel</button>
              <button onClick={executeArchive} className="flex-1 px-4 py-3 text-[10px] font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 uppercase">Archive Now</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-8 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">Vendor <span className="text-indigo-600 italic">Registry</span></h1>
            <p className="text-sm text-slate-500 mt-1 font-medium italic">Strategic supply chain management and partner logistics.</p>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="mt-6 md:mt-0 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-xl shadow-slate-200 active:scale-95"
          >
            <span className="text-lg">+</span> Add Partner
          </button>
        </header>

        {/* Data Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-200">
                <th className="px-8 py-5">Corporate Identity</th>
                <th className="px-8 py-5">Contact Gateway</th>
                <th className="px-8 py-5">Official Address</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="4" className="py-24 text-center text-slate-300 font-bold text-[10px] tracking-widest animate-pulse uppercase">Syncing Vendor Database...</td></tr>
              ) : suppliers.length === 0 ? (
                <tr><td colSpan="4" className="py-24 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Zero active partners found</td></tr>
              ) : suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xs">
                        {s.name.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 block text-sm tracking-tight">{s.name}</span>
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-tighter">REF-{s.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="text-xs font-bold text-slate-600">{s.email}</div>
                    <div className="text-[10px] text-slate-400 mt-1 font-medium">{s.phone}</div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-[240px] font-medium italic">
                      {s.address || 'Address pending verification'}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end items-center gap-6">
                      <button onClick={() => handleEdit(s)} className="text-indigo-600 font-bold text-[10px] uppercase tracking-widest hover:text-indigo-800 transition-all">Edit</button>
                      <button onClick={() => setConfirmArchive({ show: true, id: s.id, name: s.name })} className="text-slate-300 font-bold text-[10px] uppercase tracking-widest hover:text-rose-600 transition-all opacity-0 group-hover:opacity-100">Archive</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-[0.2em]">
                {editingId ? 'Modify Partner Profile' : 'Partner Onboarding'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-2xl transition-colors">×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Corporate Name</label>
                <input required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-bold text-sm" placeholder="Global Logistics Inc." value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Terminal</label>
                  <input type="email" required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-semibold" placeholder="office@vendor.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Contact Line</label>
                  <input required className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-bold" placeholder="+00 000 0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">HQ Physical Location</label>
                <textarea required className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-sm font-medium min-h-[100px] leading-relaxed" placeholder="Street, Suite, City, ZIP..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={closeModal} className="flex-1 py-4 text-slate-500 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all border border-slate-100">Discard</button>
                <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl shadow-xl hover:bg-indigo-600 transition-all active:scale-95">
                  {editingId ? 'Save Changes' : 'Authorize Partner'}
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