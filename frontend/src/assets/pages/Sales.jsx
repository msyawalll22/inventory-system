import React, { useState, useEffect } from 'react';

const SalesHistory = () => {
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSalesHistory = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/sales');
      if (response.ok) {
        const data = await response.json();
        console.log("Backend Data Check:", data); 
        setSalesHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesHistory();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin: Sales History</h1>
          <p className="text-slate-500">Official transaction records from the database.</p>
        </div>
        <button 
          onClick={fetchSalesHistory}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-md"
        >
          Refresh History
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                <th className="p-4 font-bold">Date</th>
                <th className="p-4 font-bold">Product ID</th>
                <th className="p-4 font-bold text-center">Qty</th>
                <th className="p-4 font-bold">Method</th>
                <th className="p-4 font-bold text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400 animate-pulse">
                    Fetching records...
                  </td>
                </tr>
              ) : salesHistory.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center text-slate-400 italic">
                    No sales found.
                  </td>
                </tr>
              ) : (
                salesHistory.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-sm text-slate-600">
                      {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 font-medium text-slate-900">
                      #{sale.productId}
                    </td>
                    <td className="p-4 text-center text-slate-700">
                      {sale.quantity}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded text-[10px] font-bold bg-slate-100 uppercase">
                        {sale.paymentMethod || 'CASH'}
                      </span>
                    </td>
                    <td className="p-4 text-right text-emerald-600 font-bold">
                      ${sale.totalAmount ? sale.totalAmount.toFixed(2) : "0.00"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SalesHistory;