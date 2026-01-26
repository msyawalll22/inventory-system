import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);

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

  // --- EXPORT LOGIC ---

  const exportToExcel = () => {
    try {
      if (transactions.length === 0) return alert("No logs to export");
      const data = transactions.map(t => ({
        Timestamp: new Date(t.createdAt).toLocaleString('en-GB'),
        Operator: t.user?.username || 'System',
        Role: t.user?.role || 'N/A',
        Product: t.product?.name || 'N/A',
        Description: t.description || 'Manual Adjustment',
        Qty_Change: t.quantity
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
      XLSX.writeFile(workbook, `Audit_Logs_${new Date().getTime()}.xlsx`);
      setShowExportOptions(false);
    } catch (err) {
      console.error("Excel Export Error:", err);
    }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      if (transactions.length === 0) return alert("No logs to export");

      doc.setFontSize(18);
      doc.text("INVENTORY AUDIT LOGS", 14, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Report Generated: ${new Date().toLocaleString()}`, 14, 28);

      const tableColumn = ["Date", "Operator", "Asset", "Description", "Change"];
      const tableRows = transactions.map(t => [
        new Date(t.createdAt).toLocaleDateString('en-GB'),
        t.user?.username || 'System',
        t.product?.name || 'N/A',
        t.description?.replace("null", "Unknown") || "Adj",
        t.quantity > 0 ? `+${t.quantity}` : t.quantity
      ]);

      autoTable(doc, {
        startY: 35,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 }
      });

      doc.save(`Audit_Report_${new Date().getTime()}.pdf`);
      setShowExportOptions(false);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Failed to generate PDF.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-12">
        <div className="max-w-7xl mx-auto animate-pulse">
          <div className="h-8 w-48 bg-slate-200 rounded mb-4"></div>
          <div className="h-4 w-64 bg-slate-200 rounded mb-12"></div>
          <div className="h-64 bg-white border border-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-8 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
              Audit <span className="text-indigo-600">Logs</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Tracking user activity and stock movements.</p>
          </div>

          <div className="mt-6 md:mt-0 flex items-center gap-4">
            <div className="flex bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
               <div className="text-center border-r border-slate-100 pr-4 mr-4">
                  <span className="text-[10px] block font-bold text-slate-400 uppercase tracking-widest">Total Events</span>
                  <span className="text-lg font-mono font-bold text-slate-700">{transactions.length}</span>
               </div>
               <div className="text-center">
                  <span className="text-[10px] block font-bold text-slate-400 uppercase tracking-widest">System Status</span>
                  <span className="text-xs font-bold text-emerald-500 uppercase tracking-tighter">Live Audit</span>
               </div>
            </div>

            {/* Export Dropdown */}
            <div className="relative">
                <button 
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2"
                >
                  Generate Report
                </button>
                
                {showExportOptions && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowExportOptions(false)}></div>
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                        <button onClick={exportToPDF} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-slate-600 hover:bg-slate-50 border-b border-slate-100">Export as PDF</button>
                        <button onClick={exportToExcel} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-slate-600 hover:bg-slate-50">Export as Excel</button>
                    </div>
                  </>
                )}
            </div>
          </div>
        </header>

        {/* Ledger Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-200">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Operator</th>
                  <th className="px-6 py-4">Asset Details</th>
                  <th className="px-6 py-4">Action Taken</th>
                  <th className="px-6 py-4 text-right">Qty Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-6 py-5 whitespace-nowrap border-l-4 border-transparent group-hover:border-indigo-500">
                      <div className="text-sm font-semibold text-slate-700">
                        {new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 border border-slate-200 uppercase">
                          {t.user?.username?.substring(0, 2) || '??'}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-800">{t.user?.username || 'Unknown User'}</div>
                          <div className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">{t.user?.role || 'SYSTEM'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-sm font-bold text-slate-800 block">{t.product?.name || "N/A"}</span>
                      <span className="text-[10px] font-mono text-slate-400">ID: {t.product?.id || '000'}</span>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-slate-500 font-medium italic leading-relaxed">
                        {t.description?.replace("null", "Unknown Source") || "Manual adjustment"}
                      </p>
                    </td>
                    <td className={`px-6 py-5 text-right font-mono font-bold text-sm ${
                      t.quantity > 0 ? 'text-emerald-600' : 'text-rose-500'
                    }`}>
                      {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 flex justify-between items-center px-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
               <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Security Active
            </span>
        </div>
      </div>
    </div>
  );
};

export default Transactions;