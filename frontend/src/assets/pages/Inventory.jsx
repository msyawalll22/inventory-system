import React, { useState, useEffect } from 'react';

const Inventory = ({ inventory, loading, refreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [editingItem, setEditingItem] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false); // New state for custom confirm
  
  const [notification, setNotification] = useState({ message: null, type: 'success' });

  const IT_CATEGORIES = [
    "Laptops & PCs", "Components (CPU/GPU/RAM)", "Storage (SSD/HDD)",
    "Networking", "Peripherals (Mouse/KB)", "Monitors",
    "Cables & Adapters", "Software/Licenses"
  ];

  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => setNotification({ message: null, type: 'success' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const res = await fetch(`http://localhost:8080/api/products/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingItem,
          price: parseFloat(editingItem.price),
        })
      });

      if (res.ok) {
        setEditingItem(null);
        refreshData();
        setNotification({ message: "Inventory database updated", type: 'success' });
      }
    } catch (err) {
      console.error("Update failed:", err);
      setNotification({ message: "System Error: Connection Failed", type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;
    
    try {
      const res = await fetch(`http://localhost:8080/api/products/${editingItem.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setShowConfirmDelete(false);
        setEditingItem(null);
        refreshData();
        setNotification({ message: "Asset purged from registry", type: 'delete' });
      } else {
        setShowConfirmDelete(false);
        setNotification({ message: "RESTRICTION: Active transaction history", type: 'error' });
      }
    } catch (err) {
      console.error("Delete failed:", err);
      setNotification({ message: "System Error: Deletion Failed", type: 'error' });
    }
  };

  const filteredAndSortedInventory = inventory
    ?.filter(i => i.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => {
      if (sortOrder === 'low-high') return a.price - b.price;
      if (sortOrder === 'high-low') return b.price - a.price;
      return 0;
    }) || [];

  if (loading) return (
    <div className="p-12 flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Syncing Asset Database</p>
    </div>
  );

  return (
    <div className="p-6 md:p-12 bg-slate-50 min-h-screen font-sans text-slate-900">
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-notification {
          animation: slideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        
        {/* Animated Notification Badge */}
        {notification.message && (
          <div className="fixed top-6 right-6 z-[150] animate-notification">
            <div className={`bg-white border ${notification.type === 'delete' || notification.type === 'error' ? 'border-rose-200' : 'border-slate-200'} text-slate-800 px-6 py-4 rounded-xl shadow-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-4`}>
              <span className={`h-3 w-3 rounded-full animate-pulse ${
                notification.type === 'delete' || notification.type === 'error' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
              }`}></span> 
              {notification.message}
            </div>
          </div>
        )}

        <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 border-b border-slate-200 pb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">Asset <span className="text-indigo-600 italic">Inventory</span></h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Global hardware repository and stock management system.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input 
                type="text" 
                placeholder="Insert product name..." 
                className="w-full px-5 py-3 pl-12 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-sm shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-4 top-3.5 text-slate-300 text-lg">🔍</span>
            </div>

            <select 
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-xs uppercase tracking-wider text-slate-600 appearance-none cursor-pointer min-w-[160px] shadow-sm"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="default">Sort: Default</option>
              <option value="low-high">Price: Low to High</option>
              <option value="high-low">Price: High to Low</option>
            </select>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredAndSortedInventory.map(p => (
            <div key={p.id} className="group bg-white rounded-xl border border-slate-200 overflow-hidden transition-all hover:shadow-md flex flex-col h-[380px]">
              <div className="h-44 w-full bg-slate-50 relative border-b border-slate-100 overflow-hidden">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-[10px] tracking-widest uppercase">No Image Reference</div>
                )}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded text-[9px] font-bold text-indigo-600 shadow-sm border border-slate-100 uppercase tracking-tighter">
                  {p.category || 'Standard Asset'}
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm leading-snug line-clamp-2 uppercase tracking-tight">{p.name}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-2 line-clamp-2 leading-relaxed italic">{p.description || 'No technical documentation provided.'}</p>
                </div>
                
                <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-slate-900 font-mono tracking-tighter">RM {p.price?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                    <span className={`text-[10px] font-bold uppercase mt-1 ${p.quantity < 5 ? 'text-rose-500' : 'text-slate-400'}`}>
                        {p.quantity < 5 && '⚠️ '}QTY: {p.quantity} Units
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                        setEditingItem(p);
                        setShowConfirmDelete(false);
                    }}
                    className="h-10 w-10 flex items-center justify-center bg-slate-900 text-white rounded-lg hover:bg-indigo-600 transition-all shadow-sm active:scale-95"
                  >
                    <span className="text-xs">Edit</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {filteredAndSortedInventory.length === 0 && (
             <div className="col-span-full py-20 text-center">
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No matching assets found in registry.</p>
             </div>
          )}
        </div>
      </div>

      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative">
            
            {/* Custom confirmation overlay replacing window.confirm */}
            {showConfirmDelete && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl text-rose-500">⚠️</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Confirm Deletion</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed uppercase font-medium">This action will permanently remove <br/> <span className="text-slate-900 font-bold">"{editingItem.name}"</span> <br/> from active records.</p>
                    <div className="flex gap-3 mt-8 w-full">
                        <button onClick={() => setShowConfirmDelete(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-slate-200 transition-all">Cancel</button>
                        <button onClick={handleDelete} className="flex-1 py-3 bg-rose-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all">Yes, Purge</button>
                    </div>
                </div>
            )}

            <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Modify System Asset</h2>
              <button type="button" onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-600 text-xl transition-colors">✕</button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="w-16 h-16 rounded-lg bg-white shadow-sm overflow-hidden border border-slate-200 flex-shrink-0">
                  {editingItem.imageUrl ? <img src={editingItem.imageUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[8px] text-slate-300 font-bold uppercase">Nil</div>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-indigo-600 cursor-pointer uppercase tracking-wider hover:underline">
                    Change Media Reference
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                  <p className="text-[10px] text-slate-400">Accepted formats: JPG, PNG, WEBP</p>
                </div>
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Label</label>
                    <input className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-sm text-slate-700" value={editingItem.name || ''} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Classification</label>
                    <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-sm text-slate-700 appearance-none cursor-pointer" value={editingItem.category || ''} onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}>
                      <option value="">Select Category</option>
                      {IT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unit Valuation (RM)</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-bold text-sm text-slate-700" value={editingItem.price || 0} onChange={(e) => setEditingItem({...editingItem, price: e.target.value})} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Technical Specs / Description</label>
                  <textarea rows="3" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-sm text-slate-600 resize-none leading-relaxed" value={editingItem.description || ''} onChange={(e) => setEditingItem({...editingItem, description: e.target.value})} />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowConfirmDelete(true)} className="px-6 py-3 text-rose-500 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 rounded-lg transition-all border border-transparent">Purge Asset</button>
                  <div className="flex-1 flex gap-3">
                    <button type="button" onClick={() => setEditingItem(null)} className="flex-1 py-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 rounded-lg border border-slate-100">Dismiss</button>
                    <button type="submit" className="flex-[2] py-3 bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg shadow-lg hover:bg-indigo-600 transition-all">Commit Changes</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;