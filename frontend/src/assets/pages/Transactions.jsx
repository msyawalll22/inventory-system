import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const InventoryLog = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [expandedDates, setExpandedDates] = useState({});

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 1. Fetch from Backend
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/inventory-transactions?t=${Date.now()}`);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        const sorted = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setTransactions(sorted);
        setFilteredLogs(sorted);
        
        if(sorted.length > 0) {
            const latest = new Date(sorted[0].createdAt).toLocaleDateString('en-GB');
            setExpandedDates({ [latest]: true });
        }
      } catch (err) {
        console.error("Failed to load inventory logs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // 2. Filtering Logic
  useEffect(() => {
    let result = transactions;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.product?.name?.toLowerCase().includes(term) ||
        t.reference?.toLowerCase().includes(term)
      );
    }
    if (typeFilter === 'IN') result = result.filter(t => t.quantity > 0);
    else if (typeFilter === 'OUT') result = result.filter(t => t.quantity < 0);

    if (startDate) result = result.filter(t => new Date(t.createdAt) >= new Date(startDate));
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(t => new Date(t.createdAt) <= end);
    }
    setFilteredLogs(result);
  }, [searchTerm, typeFilter, startDate, endDate, transactions]);

  // --- Financial Stats ---
  const positiveFlow = filteredLogs.filter(t => t.quantity > 0).reduce((acc, t) => acc + (parseFloat(t.totalAmount) || 0), 0);
  const negativeFlow = filteredLogs.filter(t => t.quantity < 0).reduce((acc, t) => acc + (parseFloat(t.totalAmount) || 0), 0);
  const totalValue = positiveFlow - negativeFlow;

  const groupedLogs = filteredLogs.reduce((groups, log) => {
    const date = new Date(log.createdAt).toLocaleDateString('en-GB');
    if (!groups[date]) groups[date] = { items: [], dailyIn: 0, dailyOut: 0 };
    groups[date].items.push(log);
    const amt = parseFloat(log.totalAmount) || 0;
    if (log.quantity > 0) groups[date].dailyIn += amt;
    else groups[date].dailyOut += amt;
    return groups;
  }, {});

  // --- FIXED EXPORT LOGIC ---
  const exportToExcel = () => {
    const data = filteredLogs.map(t => ({
      Date: new Date(t.createdAt).toLocaleDateString('en-GB'),
      Reference: t.reference || 'N/A',
      Product: t.product?.name || 'N/A',
      Type: t.quantity > 0 ? 'INFLOW' : 'OUTFLOW',
      Qty: t.quantity,
      Amount: (parseFloat(t.totalAmount) || 0).toFixed(2)
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Logs");
    XLSX.writeFile(workbook, `Inventory_Log_${new Date().toISOString().split('T')[0]}.xlsx`);
    setShowExportOptions(false);
  };

  const generatePDFReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Inventory Movement Log Report", 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);
    
    const tableRows = filteredLogs.map(t => [
      new Date(t.createdAt).toLocaleDateString('en-GB'),
      t.reference || 'N/A',
      t.product?.name || 'N/A',
      t.quantity > 0 ? `+${t.quantity}` : t.quantity,
      (parseFloat(t.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })
    ]);

    autoTable(doc, {
      startY: 40,
      head: [["Date", "Reference", "Product", "Qty", "Amount (RM)"]],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save(`Inventory_Log_Report.pdf`);
    setShowExportOptions(false);
  };

  const toggleDate = (date) => setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));

  if (loading) return <div className="p-20 text-center font-mono animate-pulse text-slate-400 uppercase tracking-widest">Accessing Secure Logs...</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* BIG SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Assets Inflow</span>
            <h2 className="text-4xl font-mono font-black text-emerald-600">RM {positiveFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            <div className="mt-4 h-1 w-12 bg-emerald-500 rounded-full"></div>
          </div>

          <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm flex flex-col justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Total Assets Outflow</span>
            <h2 className="text-4xl font-mono font-black text-rose-500">RM {negativeFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            <div className="mt-4 h-1 w-12 bg-rose-500 rounded-full"></div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Net Logged Value</span>
              <h2 className="text-4xl font-mono font-black text-indigo-400">RM {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
              <p className="text-[9px] text-slate-500 font-bold mt-2">Current filtered balance</p>
            </div>
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* HEADER & CONTROLS */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">
              Inventory <span className="text-indigo-600">Log</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Internal Asset Movement Tracking</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
              <input type="date" className="text-[10px] font-bold bg-transparent outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span className="text-slate-300">→</span>
              <input type="date" className="text-[10px] font-bold bg-transparent outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="relative">
              <input type="text" placeholder="Search logs..." className="pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none w-44 focus:bg-white transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              <span className="absolute left-3 top-3.5 text-xs grayscale opacity-50">🔍</span>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              {['ALL', 'IN', 'OUT'].map((type) => (
                <button key={type} onClick={() => setTypeFilter(type)} className={`px-4 py-2 text-[10px] font-bold rounded-lg transition-all ${typeFilter === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>{type}</button>
              ))}
            </div>

            <div className="relative">
              <button onClick={() => setShowExportOptions(!showExportOptions)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-200">
                Export Data
              </button>
              
              {/* EXPORT DROPDOWN MENU */}
              {showExportOptions && (
                <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-150">
                  <button onClick={generatePDFReport} className="w-full text-left px-5 py-4 text-[10px] font-bold text-slate-600 hover:bg-slate-50 border-b flex justify-between items-center">
                    PDF Log Report <span>📄</span>
                  </button>
                  <button onClick={exportToExcel} className="w-full text-left px-5 py-4 text-[10px] font-bold text-slate-600 hover:bg-slate-50 flex justify-between items-center">
                    Excel Spreadsheet <span>📊</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* LOG CONTENT */}
        <div className="space-y-4">
          {Object.entries(groupedLogs).map(([date, data]) => (
            <div key={date} className="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm transition-all hover:border-slate-300">
              <div onClick={() => toggleDate(date)} className="px-8 py-6 flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-5">
                  <div className={`w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-[10px] transition-all ${expandedDates[date] ? 'bg-slate-900 text-white border-slate-900 rotate-90' : 'group-hover:bg-slate-50'}`}>▶</div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">{date}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{data.items.length} Activities Logged</p>
                  </div>
                </div>
                <div className="flex gap-10">
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Stock In</p>
                    <p className="text-sm font-mono font-bold text-emerald-600">+RM {data.dailyIn.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Stock Out</p>
                    <p className="text-sm font-mono font-bold text-rose-500">-RM {data.dailyOut.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {expandedDates[date] && (
                <div className="border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                      <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                        <th className="px-8 py-4">Item & Ref</th>
                        <th className="px-8 py-4">Activity Description</th>
                        <th className="px-8 py-4 text-right">Units</th>
                        <th className="px-8 py-4 text-right">Valuation (RM)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.items.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-8 py-5">
                            <div className="text-xs font-bold text-slate-800 uppercase group-hover:text-indigo-600">{t.product?.name}</div>
                            <div className="text-[9px] font-mono font-bold text-slate-400">{t.reference}</div>
                          </td>
                          <td className="px-8 py-5 text-xs text-slate-500 font-medium italic">{t.description || "Automated System Log"}</td>
                          <td className={`px-8 py-5 text-right font-mono font-bold text-xs ${t.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                          </td>
                          <td className="px-8 py-5 text-right font-mono font-bold text-xs text-slate-900">
                            {(parseFloat(t.totalAmount) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryLog;