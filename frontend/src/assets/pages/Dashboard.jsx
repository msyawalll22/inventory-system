import React, { useState, useEffect } from 'react';

const Dashboard = ({ inventory = [], refreshData }) => {
  const [combinedLogs, setCombinedLogs] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLogs = async () => {
    try {
      // 1. Fetch both data sources simultaneously
      const [transRes, salesRes] = await Promise.all([
        fetch('http://localhost:8080/api/inventory-transactions'),
        fetch('http://localhost:8080/api/sales')
      ]);

      const transData = await transRes.json();
      const salesData = await salesRes.json();

      // 2. Format them into a unified "activity" object
     const formattedTrans = (transData || []).map(t => ({
  id: `t-${t.id}`,
  type: 'STOCK',
  label: t.quantity > 0 ? 'RESTOCK' : 'REMOVAL',
  // 1. Access the name through the product object: t.product.name
  // 2. Access quantity through t.quantity
  message: `${t.product?.name || 'Unknown Item'} qty changed by ${t.quantity}`,
  date: t.createdAt,
  color: t.quantity > 0 ? 'text-emerald-400' : 'text-amber-400'
}));

      const formattedSales = salesData.map(s => ({
        id: `s-${s.id}`,
        type: 'SALE',
        label: 'SALE RECORD',
        message: `New sale: $${s.totalAmount?.toFixed(2)} via ${s.paymentMethod || 'CASH'}`,
        date: s.createdAt,
        color: 'text-indigo-400'
      }));

      // 3. Merge and Sort by newest first
      const merged = [...formattedTrans, ...formattedSales]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8); // Show top 8 latest activities

      setCombinedLogs(merged);
    } catch (err) {
      console.error("Failed to load logs:", err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshData(); 
    await loadLogs();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Calculations
  const totalStockValue = inventory.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const outOfStock = inventory.filter(item => item.quantity === 0).length;

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Business Overview</h1>
          <p className="text-slate-500">Real-time summary of sales and inventory.</p>
        </div>
        
        <button 
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
        >
          <span className={isRefreshing ? "animate-spin" : ""}>🔄</span>
          {isRefreshing ? "Syncing..." : "Refresh Data"}
        </button>
      </header>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-indigo-500">
          <p className="text-slate-500 text-sm font-medium">Total Inventory Value</p>
          <h3 className="text-3xl font-bold text-slate-900">${totalStockValue.toLocaleString()}</h3>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-emerald-500">
          <p className="text-slate-500 text-sm font-medium">Total Items in Stock</p>
          <h3 className="text-3xl font-bold text-slate-900">{totalItems}</h3>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-rose-500">
          <p className="text-slate-500 text-sm font-medium">Out of Stock Alerts</p>
          <h3 className={`text-3xl font-bold ${outOfStock > 0 ? 'text-rose-500' : 'text-slate-900'}`}>
            {outOfStock}
          </h3>
        </div>
      </div>

      {/* COMBINED ACTIVITY LOG */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <span className="p-2 bg-slate-800 rounded-lg text-sm">📊</span> 
          Recent Activity (Sales & Stock)
        </h3>
        
        <div className="space-y-4">
          {combinedLogs.length === 0 ? (
            <p className="text-slate-500 italic">No activity recorded yet.</p>
          ) : (
            combinedLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className={`text-xs font-black uppercase px-2 py-1 rounded ${
                    log.type === 'SALE' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {log.label}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{log.message}</p>
                    <p className="text-[10px] text-slate-500">
                      {new Date(log.date).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className={`text-xs font-bold ${log.color}`}>
                  {log.type === 'SALE' ? 'Income' : 'Inventory'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;