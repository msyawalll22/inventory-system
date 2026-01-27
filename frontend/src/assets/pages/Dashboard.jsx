import React, { useState, useEffect } from 'react';

const Dashboard = ({ inventory = [], refreshData }) => {
  const [combinedLogs, setCombinedLogs] = useState([]);
  const [salesStats, setSalesStats] = useState({ totalRevenue: 0, count: 0 });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLogs = async () => {
    try {
      const [transRes, salesRes] = await Promise.all([
        fetch('http://localhost:8080/api/inventory-transactions'),
        fetch('http://localhost:8080/api/sales')
      ]);

      const transData = await transRes.json();
      const salesData = await salesRes.json();

      // Calculate Sales Stats
      const totalRev = salesData.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
      setSalesStats({ totalRevenue: totalRev, count: salesData.length });

      const formattedTrans = (transData || []).map(t => ({
        id: `t-${t.id}`,
        type: 'STOCK',
        label: t.quantity > 0 ? 'RESTOCK' : 'REMOVAL',
        message: `${t.product?.name || 'Item'} qty changed by ${t.quantity}`,
        meta: `Auth: ${t.user?.username || 'AUTO'} | Source: ${t.supplier?.name || 'Local'}`,
        date: t.createdAt,
        color: t.quantity > 0 ? 'text-emerald-400' : 'text-amber-400'
      }));

      const formattedSales = salesData.map(s => ({
        id: `s-${s.id}`,
        type: 'SALE',
        label: 'SALE RECORD',
        message: `Revenue Inbound: RM ${s.totalAmount?.toFixed(2)}`,
        meta: `Settlement: ${s.paymentMethod || 'CASH'} | Ref: ${s.reference}`,
        date: s.createdAt,
        color: 'text-indigo-400'
      }));

      const merged = [...formattedTrans, ...formattedSales]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

      setCombinedLogs(merged);
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [inventory]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshData(); 
    await loadLogs();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const totalStockValue = inventory.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const outOfStock = inventory.filter(item => item.quantity === 0).length;
  
  // Logic for Top Products (Simplified)
  const topProducts = [...inventory]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 4);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-8 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">
              Command <span className="text-indigo-600">Center</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-bold uppercase tracking-widest">Real-time Terminal Analytics</p>
          </div>
          
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="group px-6 py-3 bg-slate-900 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-indigo-600 transition-all flex items-center gap-4 shadow-xl shadow-indigo-100 disabled:opacity-50"
          >
            <div className={`h-2 w-2 rounded-full bg-indigo-400 ${isRefreshing ? 'animate-ping' : 'group-hover:scale-125 transition-transform'}`}></div>
            {isRefreshing ? "Syncing..." : "System Refresh"}
          </button>
        </header>

        {/* TOP STAT TILES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Gross Revenue" value={`RM ${salesStats.totalRevenue.toLocaleString()}`} subtext={`${salesStats.count} Total Orders`} icon="💰" color="indigo" />
          <StatCard title="Inventory Value" value={`RM ${totalStockValue.toLocaleString()}`} subtext="Current Asset Worth" icon="🏦" color="slate" />
          <StatCard title="Total Units" value={totalItems.toLocaleString()} subtext="Stock on Hand" icon="📦" color="slate" />
          <StatCard 
            title="Health Alerts" 
            value={outOfStock} 
            subtext={outOfStock > 0 ? "Depletion Found" : "Systems Nominal"} 
            icon="🚨" 
            color={outOfStock > 0 ? "rose" : "emerald"}
            alert={outOfStock > 0}
          />
        </div>

        <div className="grid grid-cols-12 gap-8">
          
          {/* TOP PRODUCTS PANEL */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-indigo-600 rounded-full"></span>
                    Stock Velocity
                </h3>
                <div className="space-y-6">
                    {topProducts.map(product => (
                        <div key={product.id} className="space-y-2">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                                <span className="text-slate-600 truncate w-32">{product.name}</span>
                                <span className="text-slate-900">{product.quantity} Left</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${product.quantity < 10 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                                    style={{ width: `${Math.min((product.quantity / 100) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* QUICK ACTIONS / TIPS */}
            <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-lg shadow-indigo-200">
                <h4 className="font-black text-xs uppercase tracking-widest mb-2 opacity-80">Info</h4>
                <p className="text-sm font-medium leading-relaxed italic">
                    {outOfStock > 0 
                        ? `Critical: You have ${outOfStock} items out of stock. Customers cannot purchase these.` 
                        : "Inventory levels are healthy. Consider running a promotion on slow-moving items."}
                </p>
            </div>
          </div>

          {/* TELEMETRY LOGS */}
          <div className="col-span-12 lg:col-span-8 bg-slate-900 rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 overflow-hidden flex flex-col">
            <div className="px-10 py-8 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-3 mb-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_15px_rgba(99,102,241,1)]"></span>
                  Current Data
                </h3>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Active System Monitoring</p>
              </div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto custom-scrollbar min-h-[400px]">
              {combinedLogs.length === 0 ? (
                <div className="py-24 text-center">
                   <p className="text-slate-600 font-mono text-xs uppercase tracking-[0.4em] animate-pulse">Awaiting system trigger...</p>
                </div>
              ) : (
                combinedLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 hover:bg-slate-800/40 rounded-2xl transition-all group">
                    <div className="flex items-center gap-6">
                      <div className="text-[10px] font-mono font-black text-slate-700 uppercase group-hover:text-indigo-400 transition-colors">
                        {new Date(log.date).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit' })}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{log.message}</span>
                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter mt-0.5">{log.meta}</span>
                      </div>
                    </div>

                    <div className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 ${
                        log.type === 'SALE' ? 'border-indigo-500/10 text-indigo-500/80' : 'border-slate-800 text-slate-700'
                    }`}>
                      {log.type === 'SALE' ? 'Financial' : 'Logistic'}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="bg-black/20 px-10 py-6 border-t border-slate-800 flex justify-center">
               <p className="text-[9px] font-mono text-slate-700 uppercase tracking-[0.2em] font-bold italic">Buffer End - Realtime Data Streams Active</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// Sub-component for clean cards
const StatCard = ({ title, value, subtext, icon, color, alert }) => (
    <div className={`bg-white p-8 rounded-3xl border border-slate-200 shadow-sm transition-all hover:scale-[1.02] hover:shadow-xl hover:border-${color}-500 group relative overflow-hidden`}>
        <div className={`absolute top-0 right-0 w-24 h-24 bg-${color}-500/5 rounded-bl-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700`}></div>
        <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</span>
                <span className="text-xl">{icon}</span>
            </div>
            <div className="flex items-baseline gap-2">
                <span className={`text-2xl font-black text-slate-900 ${alert ? 'animate-pulse' : ''}`}>{value}</span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${alert ? 'text-rose-500' : 'text-slate-400'}`}>{subtext}</span>
            </div>
        </div>
    </div>
);

export default Dashboard;