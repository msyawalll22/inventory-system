import React, { useState, useEffect } from 'react';

const Dashboard = ({ inventory = [], refreshData }) => {
  const [combinedLogs, setCombinedLogs] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadLogs = async () => {
    try {
      const [transRes, salesRes] = await Promise.all([
        fetch('http://localhost:8080/api/inventory-transactions'),
        fetch('http://localhost:8080/api/sales')
      ]);

      const transData = await transRes.json();
      const salesData = await salesRes.json();

      const formattedTrans = (transData || []).map(t => {
        const roleContext = t.user?.role || 'SYSTEM';
        const userName = t.user?.username || 'AUTO';
        
        return {
          id: `t-${t.id}`,
          type: 'STOCK',
          label: t.quantity > 0 ? 'RESTOCK' : 'REMOVAL',
          message: `${t.product?.name || 'Item'} qty changed by ${t.quantity}`,
          meta: `Auth: ${roleContext} (${userName}) | Source: ${t.supplier?.name || 'Local'}`,
          date: t.createdAt,
          color: t.quantity > 0 ? 'text-emerald-400' : 'text-amber-400'
        };
      });

      const formattedSales = salesData.map(s => ({
        id: `s-${s.id}`,
        type: 'SALE',
        label: 'SALE RECORD',
        // Updated to RM
        message: `Revenue Inbound: RM ${s.totalAmount?.toFixed(2)}`,
        meta: `Settlement: ${s.paymentMethod || 'CASH'} | Auth: POS_TERMINAL`,
        date: s.createdAt,
        color: 'text-indigo-400'
      }));

      const merged = [...formattedTrans, ...formattedSales]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);

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

  const totalStockValue = inventory.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const outOfStock = inventory.filter(item => item.quantity === 0).length;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <header className="flex justify-between items-end pb-8 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
              System <span className="text-indigo-600">Intelligence</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium italic">Operational overview & real-time telemetry.</p>
          </div>
          
          <button 
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-5 py-2.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm disabled:opacity-50"
          >
            <span className={`h-2 w-2 rounded-full bg-indigo-500 ${isRefreshing ? 'animate-ping' : ''}`}></span>
            {isRefreshing ? "Synchronizing..." : "System Refresh"}
          </button>
        </header>

        {/* STAT TILES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm group hover:border-indigo-500 transition-colors">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Net Asset Valuation</span>
            <div className="flex items-baseline gap-2">
              {/* Updated to RM prefix and label */}
              <span className="text-3xl font-mono font-bold text-slate-900">RM {totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-[10px] font-bold text-emerald-500 uppercase">MYR</span>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm group hover:border-indigo-500 transition-colors">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Inventory Volume</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-bold text-slate-900">{totalItems}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Units In-House</span>
            </div>
          </div>

          <div className={`bg-white p-8 rounded-xl border-2 shadow-sm transition-all ${outOfStock > 0 ? 'border-rose-100 bg-rose-50/30' : 'border-slate-200'}`}>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-3">Critical Vulnerabilities</span>
            <div className="flex items-baseline gap-4">
              <span className={`text-3xl font-mono font-bold ${outOfStock > 0 ? 'text-rose-600' : 'text-slate-900'}`}>{outOfStock}</span>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${outOfStock > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                {outOfStock > 0 ? 'Stock Depletion Detected' : 'All Systems Nominal'}
              </span>
            </div>
          </div>
        </div>

        {/* LOGS PANEL */}
        <div className="bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]"></span>
              Live Telemetry Feed
            </h3>
            <span className="text-[9px] font-mono text-slate-600 uppercase tracking-widest font-bold">Encrypted Connection</span>
          </div>
          
          <div className="p-4 space-y-1">
            {combinedLogs.length === 0 ? (
              <div className="py-20 text-center">
                 <p className="text-slate-600 font-mono text-xs uppercase tracking-widest">Awaiting system trigger...</p>
              </div>
            ) : (
              combinedLogs.map((log) => (
                <div key={log.id} className="flex items-start md:items-center justify-between p-5 hover:bg-slate-800/30 rounded-lg transition-all group">
                  <div className="flex items-start md:items-center gap-6">
                    {/* Timestamp */}
                    <div className="hidden md:block text-[9px] font-mono font-bold text-slate-600 uppercase w-32">
                      {new Date(log.date).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>

                    {/* Type Badge */}
                    <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-tighter w-20 text-center ${
                      log.type === 'SALE' ? 'border-indigo-500/50 text-indigo-400' : 'border-slate-600 text-slate-400'
                    }`}>
                      {log.label}
                    </div>

                    {/* Content */}
                    <div>
                      <p className="text-sm font-bold text-slate-200 leading-tight group-hover:text-white transition-colors">
                        {log.message}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tight">
                        {log.meta}
                      </p>
                    </div>
                  </div>

                  {/* Classification Tag */}
                  <div className={`hidden md:block text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      log.type === 'SALE' ? 'border-indigo-500/20 text-indigo-500/60' : 'border-slate-700 text-slate-600'
                  }`}>
                    {log.type === 'SALE' ? 'FINANCIAL' : 'LOGISTICS'}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="bg-slate-800/20 px-8 py-4 border-t border-slate-800">
             <p className="text-[9px] font-mono text-slate-600 text-center uppercase tracking-widest">End of visible buffer - showing last 10 master events</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;