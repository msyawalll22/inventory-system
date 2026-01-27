import React, { useState, useEffect } from 'react';
import SuccessAlert from '../../components/SuccessAlert';

const Inventory = ({ inventory, loading, refreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOrder, setSortOrder] = useState('default');
  const [editingItem, setEditingItem] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  
  const [alertConfig, setAlertConfig] = useState({ 
    show: false, 
    title: '', 
    message: '', 
    type: 'success' 
  });

  const IT_CATEGORIES = [
    "Laptops & PCs", "Components (CPU/GPU/RAM)", "Storage (SSD/HDD)",
    "Networking", "Peripherals (Mouse/KB)", "Monitors",
    "Cables & Adapters", "Software/Licenses"
  ];

  // Helper to count items per category
  const getCategoryCount = (cat) => {
    if (cat === 'All') return inventory?.length || 0;
    return inventory?.filter(i => i.category === cat).length || 0;
  };

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
        setAlertConfig({
          show: true,
          type: 'success',
          title: "SUCCESS",
          message: "Inventory record has been updated successfully."
        });
      } else {
        setAlertConfig({
          show: true,
          type: 'error',
          title: "ERROR",
          message: "Failed to update the inventory record."
        });
      }
    } catch (err) {
      setAlertConfig({
        show: true,
        type: 'error',
        title: "SYSTEM ERROR",
        message: "Could not connect to the server."
      });
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
        setAlertConfig({
          show: true,
          type: 'success',
          title: "DELETED",
          message: "The asset has been removed from the registry."
        });
      } else {
        setAlertConfig({
          show: true,
          type: 'error',
          title: "RESTRICTION",
          message: "Could not delete asset due to active transaction history."
        });
      }
    } catch (err) {
      setAlertConfig({
        show: true,
        type: 'error',
        title: "SYSTEM ERROR",
        message: "Deletion failed due to server error."
      });
    }
  };

  const filteredAndSortedInventory = inventory
    ?.filter(i => {
      const matchesSearch = i.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || i.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
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
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-900">
      
      <SuccessAlert 
        show={alertConfig.show}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={() => setAlertConfig({ ...alertConfig, show: false })}
      />

      {/* TOP NAVBAR / SEARCH AREA */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-[100] px-6 py-4 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 uppercase">
              Asset <span className="text-indigo-600 italic">Inventory</span>
            </h1>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input 
                type="text" 
                placeholder="Search serials or asset names..." 
                className="w-full px-4 py-2 pl-10 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-3 top-2.5 opacity-40">🔍</span>
            </div>
            <select 
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600 cursor-pointer"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="default">Sort: Default</option>
              <option value="low-high">Price: Low-High</option>
              <option value="high-low">Price: High-Low</option>
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full flex flex-col lg:flex-row gap-8 p-6 md:p-12">
        
        {/* LEFT SECTION: CATEGORY SIDEBAR */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <div className="sticky top-24">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 ml-1">Asset Classifications</h2>
            <nav className="flex flex-col gap-1">
              <button 
                onClick={() => setSelectedCategory('All')}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all border ${selectedCategory === 'All' ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                <span>ALL ASSETS</span>
                <span className={`text-[10px] ${selectedCategory === 'All' ? 'text-indigo-100' : 'text-slate-400'}`}>{getCategoryCount('All')}</span>
              </button>

              <hr className="my-2 border-slate-200" />

              {IT_CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-[11px] font-bold transition-all border ${selectedCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-transparent text-slate-500 border-transparent hover:border-slate-200 hover:bg-white'}`}
                >
                  <span className="uppercase">{cat}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${selectedCategory === cat ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    {getCategoryCount(cat)}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* RIGHT SECTION: MAIN CONTENT GRID */}
        <main className="flex-1">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                {selectedCategory} Section
              </h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Showing {filteredAndSortedInventory.length} Verified Records
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSortedInventory.map(p => (
              <div key={p.id} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 flex flex-col h-[380px]">
                <div className="h-44 w-full bg-slate-50 relative border-b border-slate-100 overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover grayscale-[10%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-[9px] tracking-widest uppercase">No Reference</div>
                  )}
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-[8px] font-black text-indigo-600 shadow-sm border border-slate-100 uppercase tracking-tighter">
                    {p.category || 'Asset'}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 uppercase tracking-tight">{p.name}</h3>
                    <p className="text-[11px] text-slate-400 font-medium mt-2 line-clamp-2 leading-relaxed italic">{p.description || 'No tech specs.'}</p>
                  </div>
                  
                  <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-slate-900 font-mono tracking-tighter">RM {p.price?.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      <span className={`text-[10px] font-bold uppercase mt-1 ${p.quantity < 5 ? 'text-rose-500' : 'text-slate-400'}`}>
                          {p.quantity < 5 && '⚠️ '}QTY: {p.quantity}
                      </span>
                    </div>
                    <button 
                      onClick={() => { setEditingItem(p); setShowConfirmDelete(false); }}
                      className="h-9 px-4 flex items-center justify-center bg-slate-900 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-indigo-600 transition-all shadow-sm active:scale-95"
                    >
                      Edit Asset
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAndSortedInventory.length === 0 && (
            <div className="py-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
               <div className="text-3xl mb-4 opacity-20">📦</div>
               <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No assets found in this category</p>
               <button 
                 onClick={() => {setSearchTerm(''); setSelectedCategory('All');}}
                 className="mt-4 text-indigo-600 font-bold text-[10px] uppercase tracking-widest hover:underline"
               >
                 View All Categories
               </button>
            </div>
          )}
        </main>
      </div>

      {/* EDITING MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative">
            
            {showConfirmDelete && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-200">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4 text-2xl text-rose-500">⚠️</div>
                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Confirm Deletion</h3>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed uppercase font-medium">Permanently remove <br/> <span className="text-slate-900 font-bold">"{editingItem.name}"</span></p>
                    <div className="flex gap-3 mt-8 w-full">
                        <button onClick={() => setShowConfirmDelete(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-widest rounded-lg">Cancel</button>
                        <button onClick={handleDelete} className="flex-1 py-3 bg-rose-600 text-white font-bold text-[10px] uppercase tracking-widest rounded-lg shadow-lg">Yes, Purge</button>
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
                    <input className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-sm text-slate-700" value={editingItem.name || ''} onChange={(e) => setEditingItem({...editingItem, name: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Classification</label>
                    <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-sm text-slate-700 appearance-none" value={editingItem.category || ''} onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}>
                      <option value="">Select Category</option>
                      {IT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unit Valuation (RM)</label>
                  <input type="number" step="0.01" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-lg outline-none font-mono font-bold text-sm text-slate-700" value={editingItem.price || 0} onChange={(e) => setEditingItem({...editingItem, price: e.target.value})} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Technical Specs</label>
                  <textarea rows="3" className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-sm text-slate-600 resize-none leading-relaxed" value={editingItem.description || ''} onChange={(e) => setEditingItem({...editingItem, description: e.target.value})} />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={() => setShowConfirmDelete(true)} className="px-6 py-3 text-rose-500 font-bold text-[10px] uppercase tracking-widest hover:bg-rose-50 rounded-lg transition-all">Purge Asset</button>
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