import React, { useState, useEffect } from 'react';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/inventory-transactions');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setTransactions(data);
      } catch (err) {
        console.error("Failed to load transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) return <div className="p-8 text-slate-500 animate-pulse">Loading audit trail...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Audit Trail</h1>
        <p className="text-slate-500 font-medium">Complete history of every stock movement in the system.</p>
      </header>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-200">
            <tr>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-slate-400">Date & Time</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-slate-400">Product Details</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-slate-400">Activity Type</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Qty Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                {/* DATE COLUMN */}
                <td className="p-5">
                  <p className="text-sm font-bold text-slate-700">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </td>

                {/* PRODUCT NAME COLUMN - UPDATED */}
                <td className="p-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-indigo-600 group-hover:underline cursor-default">
                      {t.product?.name || "Unknown Product"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
                      SKU-ID: #{t.product?.id || "N/A"}
                    </span>
                  </div>
                </td>

                {/* ACTIVITY COLUMN */}
                <td className="p-5">
                  <div className="flex flex-col gap-1">
                    <span className={`w-fit px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      t.quantity > 0 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {t.quantity > 0 ? '➕ INBOUND' : '➖ OUTBOUND'}
                    </span>
                    <span className="text-xs text-slate-500 italic">
                      {t.description || "System adjusted"}
                    </span>
                  </div>
                </td>

                {/* CHANGE COLUMN */}
                <td className={`p-5 text-right font-mono font-black text-lg ${
                  t.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {transactions.length === 0 && (
          <div className="p-20 text-center">
            <div className="text-4xl mb-4">📜</div>
            <p className="text-slate-400 font-medium text-lg italic">No stock movements found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;