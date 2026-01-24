import React from 'react';

// 1. Add 'inventory' to the props here
const Sidebar = ({ currentView, onViewChange, inventory = [] }) => {
  
  // 2. Logic: Count how many items have less than 5 units
  const lowStockCount = inventory.filter(item => item.quantity < 5).length;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'purchases', label: 'Purchases', icon: '🛒' },
    { id: 'sales', label: 'Sales Log', icon: '💰' },
    { id: 'suppliers', label: 'Suppliers', icon: '🏢' },
    { id: 'transactions', label: 'History Logs', icon: '📜' },
    { id: 'pos', label: 'POS', icon: '📜' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white p-6 hidden md:flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold">I</div>
        <h1 className="text-xl font-bold tracking-tight">Inventory Pro</h1>
      </div>

      <nav className="space-y-2 flex-1">
        {menuItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`p-3 rounded-xl cursor-pointer flex items-center gap-3 transition-all ${
              currentView === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium flex-1">{item.label}</span>

            {/* 3. ADD THIS LOGIC HERE: Show badge only for Inventory link if count > 0 */}
            {item.id === 'inventory' && lowStockCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                {lowStockCount}
              </span>
            )}
          </div>
        ))}
      </nav>

      <div className="mt-auto p-4 bg-slate-800 rounded-2xl text-xs text-slate-400 border border-slate-700">
        Connected to Database: <br/>
        <span className="text-emerald-400 font-mono text-[10px]">Active Session</span>
      </div>
    </aside>
  );
};

export default Sidebar;