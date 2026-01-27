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

  // 1. Fetch from your Spring Boot Backend
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

  // 2. Handle Filtering Logic
  useEffect(() => {
    let result = transactions;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.user?.username?.toLowerCase().includes(term) ||
        t.product?.name?.toLowerCase().includes(term) ||
        t.description?.toLowerCase().includes(term) ||
        t.reference?.toLowerCase().includes(term)
      );
    }

    if (typeFilter === 'IN') {
      result = result.filter(t => t.quantity > 0);
    } else if (typeFilter === 'OUT') {
      result = result.filter(t => t.quantity < 0);
    }

    if (startDate) {
      result = result.filter(t => new Date(t.createdAt) >= new Date(startDate));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(t => new Date(t.createdAt) <= end);
    }

    setFilteredLogs(result);
  }, [searchTerm, typeFilter, startDate, endDate, transactions]);

  // --- FINANCIAL CALCULATIONS (Adjusted to ensure Stock-Out is captured) ---
  const positiveFlow = filteredLogs
    .filter(t => t.quantity > 0)
    .reduce((acc, t) => acc + (Number(t.totalAmount) || 0), 0);

  const negativeFlow = filteredLogs
    .filter(t => t.quantity < 0)
    .reduce((acc, t) => acc + (Number(t.totalAmount) || 0), 0);

  const totalValue = positiveFlow - negativeFlow;

  // --- EXPORT & REPORT LOGIC ---
  const exportToExcel = () => {
    if (filteredLogs.length === 0) return alert("No data to export");
    const data = filteredLogs.map(t => ({
      Date: new Date(t.createdAt).toLocaleDateString('en-GB'),
      Reference: t.reference || 'N/A',
      Product: t.product?.name || 'N/A',
      Type: t.quantity > 0 ? 'STOCK-IN' : 'STOCK-OUT',
      Qty: t.quantity,
      Amount_RM: (Number(t.totalAmount) || 0).toFixed(2)
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ledger");
    XLSX.writeFile(workbook, `Inventory_Report_${Date.now()}.xlsx`);
    setShowExportOptions(false);
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    if (filteredLogs.length === 0) return alert("No data to report");

    // Report Branding
    doc.setFontSize(20).setTextColor(30, 41, 59).text("FINANCIAL AUDIT REPORT", 14, 22);
    doc.setFontSize(10).setTextColor(100).text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    // Summary Box
    doc.setFillColor(248, 250, 252);
    doc.rect(14, 35, 182, 25, 'F');
    doc.setFontSize(9).setTextColor(30, 41, 59).setFont(undefined, 'bold');
    doc.text(`Total Stock-In: RM ${positiveFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 20, 45);
    doc.text(`Total Stock-Out: RM ${negativeFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 20, 52);
    doc.text(`Net Balance: RM ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, 130, 49);

    const tableColumn = ["Date", "Reference", "Product", "Qty", "Total (RM)"];
    const tableRows = filteredLogs.map(t => [
      new Date(t.createdAt).toLocaleDateString('en-GB'),
      t.reference || 'N/A',
      t.product?.name || 'N/A',
      t.quantity > 0 ? `+${t.quantity}` : t.quantity,
      (Number(t.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
    ]);

    autoTable(doc, {
      startY: 65,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
      styles: { fontSize: 8 },
      columnStyles: { 4: { halign: 'right' } }
    });

    doc.save(`Audit_Report_${Date.now()}.pdf`);
    setShowExportOptions(false);
  };

  if (loading) return <div className="p-20 text-center font-mono animate-pulse uppercase tracking-widest text-slate-400">Syncing with Backend Ledger...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 pb-8 border-b border-slate-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
                Transaction <span className="text-indigo-600 italic">Ledger</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1 font-medium">Financial movement synced with Purchases & Sales.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm">
                <input type="date" className="text-[10px] font-bold text-slate-600 outline-none p-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <span className="text-slate-300">→</span>
                <input type="date" className="text-[10px] font-bold text-slate-600 outline-none p-1" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>

              <div className="relative">
                <input type="text" placeholder="Search Ref or Product..." className="pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none w-48 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                <span className="absolute left-3 top-3 text-slate-400 text-xs">🔍</span>
              </div>

              <div className="flex bg-slate-200 p-1 rounded-xl shadow-inner">
                {['ALL', 'IN', 'OUT'].map((type) => (
                  <button key={type} onClick={() => setTypeFilter(type)} className={`px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all ${typeFilter === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{type}</button>
                ))}
              </div>

              <div className="relative">
                <button onClick={() => setShowExportOptions(!showExportOptions)} className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase hover:bg-slate-900 shadow-md transition-all active:scale-95">Generate Report</button>
                {showExportOptions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <button onClick={generatePDFReport} className="w-full text-left px-5 py-4 text-[10px] font-bold text-slate-600 hover:bg-slate-50 border-b flex items-center justify-between">PDF Audit Report <span>📄</span></button>
                    <button onClick={exportToExcel} className="w-full text-left px-5 py-4 text-[10px] font-bold text-slate-600 hover:bg-slate-50 flex items-center justify-between">Excel Spreadsheet <span>📊</span></button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* --- FINANCIAL SUMMARY CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm group hover:border-indigo-200 transition-all">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Value Balance</p>
            <h3 className={`text-2xl font-mono font-bold mt-1 ${totalValue >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
              RM {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm border-l-4 border-l-emerald-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock-In (Purchases)</p>
            <h3 className="text-2xl font-mono font-bold mt-1 text-slate-800">
              RM {positiveFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm border-l-4 border-l-rose-500">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock-Out (Sales)</p>
            <h3 className="text-2xl font-mono font-bold mt-1 text-slate-800">
              RM {negativeFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest border-b">
                <th className="px-6 py-5">Timestamp</th>
                <th className="px-6 py-5">Asset & Reference</th>
                <th className="px-6 py-5">Description</th>
                <th className="px-6 py-5 text-right">Qty</th>
                <th className="px-6 py-5 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? filteredLogs.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="text-sm font-bold text-slate-700">{new Date(t.createdAt).toLocaleDateString('en-GB')}</div>
                    <div className="text-[10px] font-mono text-slate-400">{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{t.product?.name || 'Unknown Product'}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{t.reference || 'NO-REF'}</div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs text-slate-500 italic">{t.description || "System Log"}</p>
                  </td>
                  <td className={`px-6 py-5 text-right font-mono font-bold text-sm ${t.quantity > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                    {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                  </td>
                  <td className="px-6 py-5 text-right font-mono font-bold text-sm text-slate-900">
                    RM {(Number(t.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">No matching records found in database</td>
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