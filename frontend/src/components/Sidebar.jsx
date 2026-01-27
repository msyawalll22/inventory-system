import React, { useState, useEffect } from 'react';

const Sidebar = ({ currentView, onViewChange, inventory = [], user, onLogout }) => {
  const lowStockCount = Array.isArray(inventory) 
    ? inventory.filter(item => item.quantity < 5).length 
    : 0;

  const inventorySubItems = [
    { id: 'inventory', label: 'Hardware Assets', icon: '💻' },
    { id: 'transactions', label: 'Inventory Logs', icon: '🔄' },
    { id: 'purchases', label: 'Procurement', icon: '📑' },
    { id: 'suppliers', label: 'Vendor Portal', icon: '🤝' },
  ];

  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const isInventoryActive = inventorySubItems.some(sub => sub.id === currentView);

  useEffect(() => {
    if (isInventoryActive) setIsInventoryOpen(true);
  }, [isInventoryActive]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '🛰️', adminOnly: true },
    { id: 'pos', label: 'Terminal (POS)', icon: '📟', adminOnly: false },
    { id: 'sales', label: 'Billing Records', icon: '🧾', adminOnly: false },
    { id: 'users', label: 'Access Control', icon: '🔐', adminOnly: true },
  ];

  return (
    <aside className="w-72 bg-slate-950 text-white p-6 hidden md:flex flex-col h-screen sticky top-0 border-r border-slate-800 shadow-2xl">
      
      {/* BRAND LOGO */}
      <div className="flex items-center gap-4 mb-12 px-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-black italic shadow-[0_0_15px_rgba(79,70,229,0.4)]">
          TF
        </div>
        <div>
          <h1 className="text-sm font-black tracking-[0.2em] uppercase leading-none">
            Tech<span className="text-indigo-500">Flow</span>
          </h1>
          <p className="text-[9px] text-slate-500 font-bold tracking-[0.3em] uppercase mt-1.5">V1 Version</p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-2">
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 px-3">Main Console</p>
        
        {menuItems
          .filter(item => !item.adminOnly || user?.role === 'ADMIN')
          .map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full group p-3.5 rounded-lg flex items-center gap-4 transition-all border ${
                currentView === item.id 
                  ? 'bg-indigo-600/10 border-indigo-500/50 text-white shadow-[inset_0_0_10px_rgba(99,102,241,0.1)]' 
                  : 'border-transparent text-slate-500 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <span className={`text-base transition-transform group-hover:scale-110 ${currentView === item.id ? 'opacity-100' : 'opacity-40'}`}>
                {item.icon}
              </span>
              <span className="font-bold text-[11px] uppercase tracking-widest">{item.label}</span>
              {currentView === item.id && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,1)]"></div>
              )}
            </button>
          ))}

        {/* LOGISTICS SECTION - ONLY VISIBLE TO ADMIN */}
        {user?.role === 'ADMIN' && (
          <div className="pt-6">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 px-3">Logistics</p>
            <button
              onClick={() => setIsInventoryOpen(!isInventoryOpen)}
              className={`w-full p-3.5 rounded-lg flex items-center gap-4 transition-all border ${
                isInventoryActive 
                  ? 'text-white border-slate-700 bg-slate-900/50' 
                  : 'border-transparent text-slate-500 hover:text-white hover:bg-slate-900/50'
              }`}
            >
              <span className="text-base opacity-40">🛠️</span>
              <span className="font-bold text-[11px] uppercase tracking-widest text-left">Resources</span>
              <span className={`ml-auto text-[8px] transition-transform duration-300 ${isInventoryOpen ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>

            {isInventoryOpen && (
              <div className="ml-6 mt-2 border-l border-slate-800 space-y-1 animate-in fade-in slide-in-from-left-2">
                {inventorySubItems.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => onViewChange(sub.id)}
                    className={`w-full p-3 pl-6 flex items-center gap-3 transition-all relative ${
                      currentView === sub.id 
                        ? 'text-indigo-400 font-black' 
                        : 'text-slate-600 hover:text-slate-300'
                    }`}
                  >
                    {currentView === sub.id && (
                      <div className="absolute left-0 w-1 h-4 bg-indigo-500 rounded-r-full"></div>
                    )}
                    <span className="text-xs">{sub.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">{sub.label}</span>
                    
                    {sub.id === 'inventory' && lowStockCount > 0 && (
                      <span className="ml-auto bg-rose-500/10 text-rose-500 border border-rose-500/20 text-[9px] px-2 py-0.5 rounded-md font-black animate-pulse">
                        {lowStockCount} ALERT
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* USER FOOTER */}
      <div className="mt-auto pt-8">
        <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-4 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 bg-slate-800 border border-slate-700 rounded-lg flex items-center justify-center font-bold text-indigo-400">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-900 ${user?.role === 'ADMIN' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </div>
            <div className="overflow-hidden">
              <p className="text-[11px] font-black text-white uppercase tracking-tight truncate">
                {user?.username || 'SYSTEM_USER'}
              </p>
              <p className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                {user?.role || 'GUEST_MODE'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full group py-3 rounded-lg border border-slate-700 hover:border-rose-500/50 hover:bg-rose-500/5 transition-all flex items-center justify-center gap-3"
          >
            <span className="text-[10px] font-black text-slate-500 group-hover:text-rose-500 uppercase tracking-[0.2em]">LOG OUT</span>
            <span className="text-xs group-hover:translate-x-1 transition-transform">⚡</span>
          </button>
        </div>
        
        <p className="text-center text-[8px] text-slate-700 font-bold uppercase tracking-[0.4em] mt-6">
          POS & INVENTORY MANAGEMENT SYSTEM
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;