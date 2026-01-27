import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import * as XLSX from 'xlsx';

const SalesHistory = () => {
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState(null); 
  const [expandedDates, setExpandedDates] = useState({}); 

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchSalesHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/sales');
      if (response.ok) {
        const data = await response.json();
        const sortedData = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setSalesHistory(sortedData);
        
        if(sortedData.length > 0) {
            const firstDate = new Date(sortedData[0].createdAt).toLocaleDateString('en-GB');
            setExpandedDates({ [firstDate]: true });
        }
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
    const refID = (sale.reference || "").toLowerCase();
    const matchesSearch = refID.includes(searchTerm.toLowerCase());
    const saleDate = new Date(sale.createdAt).getTime();
    const start = startDate ? new Date(startDate).getTime() : -Infinity;
    const end = endDate ? new Date(endDate).getTime() : Infinity;
    const adjustedEnd = endDate ? end + 86400000 : end;
    const matchesDate = !sale.createdAt ? true : (saleDate >= start && saleDate <= adjustedEnd);
    return matchesSearch && matchesDate;
  });

  const groupedSales = filteredSales.reduce((groups, sale) => {
    const date = new Date(sale.createdAt).toLocaleDateString('en-GB');
    if (!groups[date]) {
      groups[date] = { items: [], dailyTotal: 0 };
    }
    groups[date].items.push(sale);
    groups[date].dailyTotal += (sale.totalAmount || 0);
    return groups;
  }, {});

  const totalRevenue = filteredSales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);

  const toggleDate = (date) => {
    setExpandedDates(prev => ({ ...prev, [date]: !prev[date] }));
  };

  const getTotalUnits = (items) => items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const exportToExcel = () => {
    const data = filteredSales.map(sale => ({
      Date: new Date(sale.createdAt).toLocaleDateString('en-GB'),
      Invoice_No: sale.reference,
      Total_Items: getTotalUnits(sale.items),
      Amount_RM: (sale.totalAmount || 0).toFixed(2)
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");
    XLSX.writeFile(workbook, `Sales_Report.xlsx`);
    setShowExportOptions(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableRows = filteredSales.map(sale => [
      new Date(sale.createdAt).toLocaleDateString('en-GB'),
      sale.reference,
      getTotalUnits(sale.items),
      (sale.totalAmount || 0).toFixed(2)
    ]);
    autoTable(doc, { head: [["Date", "Invoice No", "Items", "Total (RM)"]], body: tableRows });
    doc.save(`Sales_Report.pdf`);
    setShowExportOptions(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        
        {/* BIG SUMMARY CARD */}
        <div className="grid grid-cols-1 mb-10">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row md:items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-4 block">Archive Financial Summary</span>
              <h2 className="text-5xl font-mono font-black text-white">
                RM {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h2>
              <p className="text-xs text-slate-400 font-bold mt-4 uppercase tracking-widest">Grand Total Revenue Generated</p>
            </div>
            
            <div className="mt-8 md:mt-0 relative z-10 flex gap-4">
               <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl backdrop-blur-md">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Filtered Volume</p>
                  <p className="text-xl font-mono font-bold text-white">{filteredSales.length} Sales</p>
               </div>
            </div>

            {/* Decorative element */}
            <div className="absolute top-[-20%] right-[-5%] w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]"></div>
          </div>
        </div>

        {/* HEADER & CONTROLS */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 p-6 bg-white border border-slate-200 rounded-3xl shadow-sm gap-6">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800 uppercase">
              Sales <span className="text-indigo-600">Archive</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Historical Financial Records</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-xl">
              <input type="date" className="text-[10px] font-bold bg-transparent outline-none" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <span className="text-slate-300">→</span>
              <input type="date" className="text-[10px] font-bold bg-transparent outline-none" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>

            <div className="relative">
              <input 
                type="text" placeholder="Search Invoice..." 
                className="pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold w-44 shadow-sm outline-none focus:bg-white focus:border-indigo-500 transition-all"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-3 top-3.5 text-xs opacity-40">🔍</span>
            </div>

            <div className="relative">
                <button onClick={() => setShowExportOptions(!showExportOptions)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100">
                    Export Data
                </button>
                {showExportOptions && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-150">
                        <button onClick={exportToPDF} className="w-full text-left px-5 py-4 text-[10px] font-bold uppercase text-slate-600 hover:bg-slate-50 border-b flex justify-between items-center">PDF Report <span>📄</span></button>
                        <button onClick={exportToExcel} className="w-full text-left px-5 py-4 text-[10px] font-bold uppercase text-slate-600 hover:bg-slate-50 flex justify-between items-center">Excel Sheet <span>📊</span></button>
                    </div>
                )}
            </div>
          </div>
        </header>

        {loading ? (
           <div className="text-center py-20 font-black text-slate-300 animate-pulse tracking-[0.2em]">SYNCHRONIZING ARCHIVES...</div>
        ) : (
          <div className="space-y-4">
            {Object.keys(groupedSales).length === 0 && (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200 text-slate-300 font-bold uppercase tracking-widest">No matching records found</div>
            )}
            
            {Object.entries(groupedSales).map(([date, data]) => (
              <div key={date} className="bg-white border border-slate-200 rounded-[1.5rem] overflow-hidden shadow-sm hover:border-slate-300 transition-all">
                {/* DATE HEADER */}
                <div 
                    onClick={() => toggleDate(date)}
                    className="flex items-center justify-between px-8 py-6 bg-slate-50/50 cursor-pointer hover:bg-slate-50 transition-colors group"
                >
                    <div className="flex items-center gap-5">
                        <div className={`w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-[10px] transition-all ${expandedDates[date] ? 'bg-slate-900 text-white border-slate-900 rotate-90' : 'group-hover:bg-white'}`}>▶</div>
                        <div>
                          <h3 className="text-sm font-black text-slate-800 tracking-tight">{date}</h3>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{data.items.length} Transactions</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total Daily Revenue</p>
                        <p className="text-sm font-mono font-bold text-emerald-600">RM {data.dailyTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                {/* DROPDOWN TABLE */}
                {expandedDates[date] && (
                  <div className="overflow-x-auto border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50/30">
                        <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          <th className="px-8 py-4">Invoice No</th>
                          <th className="px-8 py-4">Payment Method</th>
                          <th className="px-8 py-4 text-center">Items</th>
                          <th className="px-8 py-4 text-right">Amount (RM)</th>
                          <th className="px-8 py-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {data.items.map((sale) => (
                          <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-8 py-5 font-mono text-xs font-bold text-indigo-600 group-hover:scale-105 transition-transform origin-left">{sale.reference}</td>
                            <td className="px-8 py-5">
                              <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-black uppercase">
                                {sale.paymentMethod || 'CASH'}
                              </span>
                            </td>
                            <td className="px-8 py-5 text-center text-xs font-bold text-slate-600">{getTotalUnits(sale.items)}</td>
                            <td className="px-8 py-5 text-right font-mono font-bold text-slate-900">
                                {sale.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-8 py-5 text-center">
                              <button 
                                onClick={() => setSelectedSale(sale)}
                                className="px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-xl text-[9px] font-black uppercase hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                              >
                                View Details
                              </button>
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
        )}
      </div>

      {/* RECEIPT MODAL */}
      {selectedSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="p-10">
                <div className="text-center border-b-2 border-dashed border-slate-100 pb-8 mb-8">
                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sale Summary</h2>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase mt-2 tracking-widest">Ref ID: {selectedSale.reference}</p>
                </div>

                <div className="space-y-5 mb-10 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {selectedSale.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{item.product?.name}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase">Qty: {item.quantity}</span>
                            </div>
                            <span className="font-mono font-bold text-xs">RM {(item.unitPrice * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl flex justify-between items-center mb-10 border border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Grand Total</span>
                    <span className="text-2xl font-mono font-black text-indigo-600">RM {selectedSale.totalAmount?.toFixed(2)}</span>
                </div>

                <button 
                  onClick={() => setSelectedSale(null)}
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200"
                >
                  Dismiss Archive
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;