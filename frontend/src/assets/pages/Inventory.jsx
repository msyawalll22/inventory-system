import React, { useState, useEffect } from 'react';

const Inventory = ({ inventory, loading, refreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showSuccess = (message) => setNotification(message);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingItem({ ...editingItem, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteProduct = async (id) => {
    // Updated message to reflect Soft Delete (Archiving)
    if (!window.confirm("Archive this product? History will be preserved.")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        refreshData();
        showSuccess("Archived Successfully");
      }
    } catch (err) { console.error("Delete failed", err); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:8080/api/products/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingItem)
      });
      if (res.ok) {
        setEditingItem(null);
        refreshData();
        showSuccess("Saved Successfully");
      }
    } catch (err) { console.error("Update failed", err); }
  };

  if (loading) return <div className="p-8 font-bold animate-pulse text-slate-400">Loading...</div>;

  // Filter logic with optional chaining to prevent "undefined" errors
  const filteredInventory = inventory?.filter(i => 
    i.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="p-8 space-y-6 relative min-h-screen">
      
      {/* --- CENTERED SUCCESS POPUP --- */}
      {notification && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none">
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-8 py-6 rounded-3xl shadow-2xl flex flex-col items-center gap-3 animate-bounce-in border border-white/10">
            <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/40">
              ✓
            </div>
            <span className="font-black text-sm tracking-widest uppercase">{notification}</span>
          </div>
        </div>
      )}

      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Stock Management</h1>
          <p className="text-slate-500 font-medium text-sm">Update product details and images.</p>
        </div>
        <input 
          type="text" placeholder="Search..." 
          className="pl-4 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-64 shadow-sm"
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </header>

      {/* --- TABLE AREA --- */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="p-5 text-[10px] font-black uppercase text-slate-400">Photo</th>
              <th className="p-5 text-[10px] font-black uppercase text-slate-400">Name</th>
              <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredInventory.length > 0 ? (
              filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-5 w-24">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-inner">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-slate-400 font-bold uppercase">No Img</div>
                      )}
                    </div>
                  </td>
                  <td className="p-5">
                    <p className="font-bold text-slate-800">{item.name}</p>
                    <p className="text-xs font-black text-indigo-600">${item.price?.toFixed(2)}</p>
                  </td>
                  <td className="p-5 text-right flex items-center justify-end gap-3">
                    <button 
                      onClick={() => setEditingItem(item)}
                      className="bg-slate-900 text-white px-5 py-2 rounded-xl text-xs font-black hover:bg-indigo-600 transition-all shadow-md active:scale-95"
                    >EDIT</button>
                    <button 
                      onClick={() => handleDeleteProduct(item.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 transition-colors text-lg"
                    >🗑</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="p-10 text-center text-slate-400 font-bold uppercase text-xs tracking-widest">
                  No active products found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL (Unchanged but ensuring it stays clean) --- */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleUpdate} 
            className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl space-y-6 animate-scale-in"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Product Details</h2>
              <button type="button" onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="relative w-28 h-28 shadow-xl">
                  <div className="w-full h-full rounded-2xl bg-white overflow-hidden flex items-center justify-center border-4 border-white shadow-inner">
                    {editingItem.imageUrl ? (
                      <img src={editingItem.imageUrl} className="w-full h-full object-cover" alt="preview" />
                    ) : (
                      <span className="text-[10px] text-slate-300 font-black uppercase">Upload Image</span>
                    )}
                  </div>
                  {editingItem.imageUrl && (
                    <button 
                      type="button"
                      onClick={() => setEditingItem({...editingItem, imageUrl: null})}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white w-7 h-7 rounded-full text-xs flex items-center justify-center shadow-lg border-2 border-white"
                    >✕</button>
                  )}
                </div>
                <label className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-[10px] font-black cursor-pointer hover:bg-indigo-100 transition-colors">
                  CHANGE PHOTO
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Name</label>
                  <input 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                    value={editingItem.name || ''}
                    onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price ($)</label>
                  <input 
                    type="number" step="0.01"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-bold text-slate-700"
                    value={editingItem.price || 0}
                    onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
            >
              SAVE CHANGES
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Inventory;