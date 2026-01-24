import React, { useState, useEffect } from 'react';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // FIXED: Added missing comma and initialized category
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    category: 'General'
  });

  const categories = ["Electronics", "Hardware", "Groceries", "Furniture", "General"];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplier)
      });
      if (response.ok) {
        setShowModal(false);
        // Reset form with category default
        setNewSupplier({ name: '', email: '', phone: '', address: '', category: 'General' });
        fetchSuppliers(); 
      }
    } catch (err) {
      console.error("Error saving supplier:", err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Supplier Directory</h1>
          <p className="text-slate-500 font-medium">Manage vendor contacts and categories.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
        >
          <span>+</span> Add New Supplier
        </button>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-slate-400 text-[11px] font-black uppercase tracking-widest border-b border-slate-100">
              <th className="p-6">Supplier Name</th>
              <th className="p-6">Contact Info</th>
              <th className="p-6">Category</th>
              <th className="p-6">Address</th>
              <th className="p-6">Registered</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr><td colSpan="5" className="p-12 text-center text-slate-400 animate-pulse font-medium">Retrieving vendor data...</td></tr>
            ) : suppliers.length === 0 ? (
              <tr><td colSpan="5" className="p-12 text-center text-slate-400 italic">No suppliers found.</td></tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="p-6">
                    <span className="font-bold text-slate-900 block">{s.name}</span>
                    <span className="text-xs text-slate-400">ID: #{s.id}</span>
                  </td>
                  <td className="p-6">
                    <div className="text-sm font-semibold text-slate-700">{s.email}</div>
                    <div className="text-xs text-slate-500">{s.phone}</div>
                  </td>
                  <td className="p-6">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-full border border-indigo-100">
                      {s.category || 'General'}
                    </span>
                  </td>
                  <td className="p-6 text-sm text-slate-600 max-w-xs truncate">
                    {s.address}
                  </td>
                  <td className="p-6 text-sm text-slate-400">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">New Supplier</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Company Name</label>
                <input 
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newSupplier.name}
                  onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                  <input 
                    type="email"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newSupplier.email}
                    onChange={e => setNewSupplier({...newSupplier, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Phone</label>
                  <input 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newSupplier.phone}
                    onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Category</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  value={newSupplier.category}
                  onChange={e => setNewSupplier({...newSupplier, category: e.target.value})}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Office Address</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  rows="2"
                  value={newSupplier.address}
                  onChange={e => setNewSupplier({...newSupplier, address: e.target.value})}
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                >
                  Save Supplier
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