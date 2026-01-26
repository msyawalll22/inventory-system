import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import * as XLSX from 'xlsx';

const SalesHistory = () => {
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchSalesHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/sales');
      if (response.ok) {
        const data = await response.json();
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

  const filteredSales = salesHistory.filter(sale => {
    if (!sale.createdAt) return true;
    const saleDate = new Date(sale.createdAt).getTime();
    const start = startDate ? new Date(startDate).getTime() : -Infinity;
    const end = endDate ? new Date(endDate).getTime() : Infinity;
    const adjustedEnd = endDate ? end + 86400000 : end;
    return saleDate >= start && saleDate <= adjustedEnd;
  });

  const totalRevenue = filteredSales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);

  // UPDATED: Added Cashier to Excel Export
  const exportToExcel = () => {
    try {
      if (filteredSales.length === 0) return alert("No data to export");
      
      const data = filteredSales.map(sale => ({
        Date: new Date(sale.createdAt).toLocaleDateString('en-GB'),
        Transaction_ID: `TXN-${String(sale.id).padStart(5, '0')}`,
        Cashier: sale.user?.username || 'N/A', // <--- Added this
        Units_Sold: sale.quantity,
        Method: sale.paymentMethod || 'CASH',
        Amount_RM: sale.totalAmount.toFixed(2)
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");
      XLSX.writeFile(workbook, `Sales_Report_${new Date().getTime()}.xlsx`);
      setShowExportOptions(false);
    } catch (err) {
      console.error("Excel Export Error:", err);
    }
  };

  // UPDATED: Added Cashier to PDF Export
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      if (filteredSales.length === 0) return alert("No data available to export.");

      doc.setFontSize(18);
      doc.text("SALES ARCHIVE REPORT", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`, 14, 30);
      doc.text(`Total Revenue: RM ${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 14, 37);

      // Added "Cashier" to the header array
      const tableColumn = ["Date", "Transaction ID", "Cashier", "Units", "Method", "Total (RM)"];
      const tableRows = filteredSales.map(sale => [
        new Date(sale.createdAt).toLocaleDateString('en-GB'),
        `TXN-${String(sale.id).padStart(5, '0')}`,
        sale.user?.username || 'N/A', // <--- Added this
        sale.quantity,
        sale.paymentMethod || 'CASH',
        sale.totalAmount.toFixed(2)
      ]);

      autoTable(doc, {
        startY: 45,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { fontSize: 8 } // Slightly smaller font to fit extra column
      });

      doc.save(`Sales_Report_${new Date().getTime()}.pdf`);
      setShowExportOptions(false);
    } catch (error) {
      console.error("PDF Export Error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 pb-8 border-b border-slate-200 gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
              Sales <span className="text-indigo-600">Archive</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Historical transaction data and revenue records.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-xl shadow-sm">
                <div className="flex flex-col px-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">From</label>
                    <input type="date" className="text-xs font-bold outline-none bg-transparent" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="h-8 w-[1px] bg-slate-100"></div>
                <div className="flex flex-col px-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">To</label>
                    <input type="date" className="text-xs font-bold outline-none bg-transparent" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                {(startDate || endDate) && <button onClick={() => {setStartDate(''); setEndDate('');}} className="px-2 text-rose-500 font-bold text-xs">✕</button>}
            </div>

            <div className="bg-white border border-slate-200 px-6 py-3 rounded-xl shadow-sm min-w-[180px]">
               <span className="text-[10px] block font-bold text-slate-400 uppercase tracking-widest mb-1">Total Revenue</span>
               <span className="text-xl font-mono font-bold text-emerald-600">
                 RM {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
               </span>
            </div>

            <div className="relative">
                <button onClick={() => setShowExportOptions(!showExportOptions)} className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2">Generate Report</button>
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

            <button onClick={fetchSalesHistory} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </header>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-200">
                  <th className="px-8 py-4">Transaction Date</th>
                  <th className="px-8 py-4">Cashier</th> {/* NEW COLUMN HEADER */}
                  <th className="px-8 py-4 text-center">Volume</th>
                  <th className="px-8 py-4">Settlement</th>
                  <th className="px-8 py-4 text-right">Gross Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="px-8 py-20 text-center text-[10px] uppercase font-bold text-slate-400">Loading Records...</td></tr>
                ) : filteredSales.length === 0 ? (
                  <tr><td colSpan="5" className="px-8 py-20 text-center text-slate-400 text-xs italic">No data found for this period.</td></tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <div className="text-sm font-bold text-slate-700">{new Date(sale.createdAt).toLocaleDateString('en-GB')}</div>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">ID: TXN-{String(sale.id).padStart(5, '0')}</div>
                      </td>
                      {/* NEW COLUMN: Cashier Name */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-indigo-600 border border-indigo-100">
                            {sale.user?.username?.substring(0,2).toUpperCase() || '??'}
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">
                            {sale.user?.username || 'System'}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="text-sm font-bold text-slate-700">{sale.quantity}</span>
                        <span className="text-[9px] text-slate-400 block uppercase font-bold tracking-tighter">Units Sold</span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${sale.paymentMethod === 'CARD' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                          {sale.paymentMethod || 'CASH'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right font-mono font-black text-slate-800">
                        RM {sale.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesHistory;