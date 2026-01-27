import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/inventory-transactions');
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        setTransactions(data);
        setFilteredLogs(data);
      } catch (err) {
        console.error("Failed to load transactions:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Handle Filtering Logic (Search + Type + Date)
  useEffect(() => {
    let result = transactions;

    // 1. Search Filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.user?.username?.toLowerCase().includes(term) ||
        t.product?.name?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term)
      );
    }

    // 2. Type Filter
    if (typeFilter === 'IN') {
      result = result.filter(t => t.quantity > 0);
    } else if (typeFilter === 'OUT') {
      result = result.filter(t => t.quantity < 0);
    }

    // 3. Date Filter
    if (startDate) {
      result = result.filter(t => new Date(t.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      // Set end date to end of the day for inclusive filtering
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(t => new Date(t.createdAt) <= end);
    }

    setFilteredLogs(result);
  }, [searchTerm, typeFilter, startDate, endDate, transactions]);

  // --- EXPORT LOGIC ---

  const exportToExcel = () => {
    try {
      if (filteredLogs.length === 0) return alert("No data to export");
      const data = filteredLogs.map(t => ({
        Timestamp: new Date(t.createdAt).toLocaleString('en-GB'),
        Operator: t.user?.username || 'System',
        Product: t.product?.name || 'N/A',
        Description: t.description || 'Adjustment',
        Qty_Change: t.quantity
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
      XLSX.writeFile(workbook, `Filtered_Audit_${new Date().getTime()}.xlsx`);
      setShowExportOptions(false);
    } catch (err) { console.error(err); }
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      if (filteredLogs.length === 0) return alert("No data to export");
      doc.setFontSize(16).text("INVENTORY AUDIT REPORT", 14, 20);
      doc.setFontSize(9).setTextColor(100).text(`Generated: ${new Date().toLocaleString()}`, 14, 27);
      
      const tableColumn = ["Date", "Operator", "Asset", "Description", "Change"];
      const tableRows = filteredLogs.map(t => [
        new Date(t.createdAt).toLocaleDateString('en-GB'),
        t.user?.username || 'System',
        t.product?.name || 'N/A',
        t.description || "Adj",
        t.quantity > 0 ? `+${t.quantity}` : t.quantity
      ]);

      autoTable(doc, {
        startY: 35,
        head: [tableColumn],
        body: tableRows,
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 }
      });
      doc.save(`Audit_Report_${new Date().getTime()}.pdf`);
      setShowExportOptions(false);
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="p-20 text-center font-mono animate-pulse">Accessing Audit Database...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 pb-8 border-b border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
                Inventory <span className="text-indigo-600">Logs</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">Movement tracking & security oversight.</p>
            </div>

            {/* Filters Container */}
            <div className="flex flex-wrap items-center gap-4">
              
              {/* Date Inputs */}
              <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
                <input 
                  type="date" 
                  className="text-[10px] font-bold text-slate-600 outline-none p-1"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span className="text-slate-300">→</span>
                <input 
                  type="date" 
                  className="text-[10px] font-bold text-slate-600 outline-none p-1"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                {(startDate || endDate) && (
                  <button onClick={() => {setStartDate(''); setEndDate('');}} className="text-rose-500 text-[10px] font-black px-2">X</button>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <input 
                  type="text"
                  placeholder="Search logs..."
                  className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm w-48"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <svg className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>

              {/* Type Toggle */}
              <div className="flex bg-slate-200 p-1 rounded-xl">
                {['ALL', 'IN', 'OUT'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setTypeFilter(type)}
                    className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${typeFilter === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Export */}
              <div className="relative">
                <button 
                  onClick={() => setShowExportOptions(!showExportOptions)}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase hover:bg-slate-900 transition-all shadow-md"
                >
                  Export
                </button>
                {showExportOptions && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button onClick={exportToPDF} className="w-full text-left px-4 py-3 text-[10px] font-bold text-slate-600 hover:bg-slate-50 border-b border-slate-100">PDF Report</button>
                    <button onClick={exportToExcel} className="w-full text-left px-4 py-3 text-[10px] font-bold text-slate-600 hover:bg-slate-50">Excel Sheet</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Operator</th>
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4 text-right">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? filteredLogs.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-700">{new Date(t.createdAt).toLocaleDateString('en-GB')}</div>
                    <div className="text-[10px] font-mono text-slate-400">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-slate-800">{t.user?.username || 'System'}</div>
                    <div className="text-[9px] font-black text-indigo-500 uppercase">{t.user?.role || 'SYSTEM'}</div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-bold text-slate-800 block">{t.product?.name || "N/A"}</span>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs text-slate-500 italic">{t.description || "Manual adjustment"}</p>
                  </td>
                  <td className={`px-6 py-5 text-right font-mono font-bold text-sm ${t.quantity > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">No matching records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Transactions;