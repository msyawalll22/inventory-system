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
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchSalesHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/sales');
      if (response.ok) {
        const data = await response.json();
        
        // SORTING: Newest Invoice (Reference) at the top
        const sortedData = data.sort((a, b) => {
          const refA = a.reference || "";
          const refB = b.reference || "";
          return refB.localeCompare(refA);
        });
        
        setSalesHistory(sortedData);
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

  const totalRevenue = filteredSales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);

  // Helper to count total units in a multi-item sale
  const getTotalUnits = (items) => items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const exportToExcel = () => {
    try {
      const data = filteredSales.map(sale => ({
        Date: new Date(sale.createdAt).toLocaleDateString('en-GB'),
        Invoice_No: sale.reference,
        Total_Items: getTotalUnits(sale.items),
        Cashier: sale.user?.username || 'N/A',
        Method: sale.paymentMethod || 'CASH',
        Amount_RM: (sale.totalAmount || 0).toFixed(2)
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales");
      XLSX.writeFile(workbook, `Sales_Report_${new Date().getTime()}.xlsx`);
    } catch (err) { console.error(err); }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Date", "Invoice No", "Items", "Total (RM)"];
    const tableRows = filteredSales.map(sale => [
      new Date(sale.createdAt).toLocaleDateString('en-GB'),
      sale.reference,
      getTotalUnits(sale.items),
      (sale.totalAmount || 0).toFixed(2)
    ]);
    autoTable(doc, { head: [tableColumn], body: tableRows, theme: 'striped' });
    doc.save(`Sales_Report.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 pb-8 border-b border-slate-200 gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
              Sales <span className="text-indigo-600">Archive</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium italic underline decoration-indigo-200">Record Sales</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <input 
              type="text" placeholder="Search Invoice..." 
              className="pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold w-48 shadow-sm outline-none focus:border-indigo-500"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="bg-white border border-slate-200 px-6 py-3 rounded-xl shadow-sm min-w-[180px]">
                <span className="text-xl font-mono font-bold text-emerald-600">
                  RM {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
            </div>
            <button onClick={() => setShowExportOptions(!showExportOptions)} className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg">Generate Report</button>
            {showExportOptions && (
                <div className="absolute right-0 mt-40 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <button onClick={exportToPDF} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase hover:bg-slate-50 border-b">Export PDF</button>
                    <button onClick={exportToExcel} className="w-full text-left px-4 py-3 text-[10px] font-bold uppercase hover:bg-slate-50">Export Excel</button>
                </div>
            )}
          </div>
        </header>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-[0.15em] border-b border-slate-200">
                <th className="px-8 py-4">Date</th>
                <th className="px-8 py-4">Invoice No</th>
                <th className="px-8 py-4 text-center">Items Count</th>
                <th className="px-8 py-4 text-right">Total Amount</th>
                <th className="px-8 py-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-8 py-20 text-center font-bold text-slate-400 uppercase tracking-widest">Loading Records...</td></tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-5 text-sm font-bold text-slate-700">
                      {new Date(sale.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-8 py-5 font-mono text-xs font-bold text-indigo-600">
                      {sale.reference}
                    </td>
                    <td className="px-8 py-5 text-center font-bold text-slate-700">
                        {getTotalUnits(sale.items)} items
                    </td>
                    <td className="px-8 py-5 text-right font-mono font-black text-slate-800">
                      RM {(sale.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-8 py-5 text-center">
                      <button 
                        onClick={() => setSelectedSale(sale)}
                        className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase hover:bg-indigo-600 hover:text-white transition-all border border-slate-200"
                      >
                        View Receipt
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MULTI-ITEM RECEIPT MODAL */}
      {selectedSale && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8">
                <div className="text-center border-b-2 border-dashed border-slate-200 pb-6 mb-6">
                    <h2 className="text-xl font-black tracking-tighter text-slate-800 uppercase">Official Receipt</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Ref: {selectedSale.reference}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-[11px]">
                    <div>
                        <p className="font-bold text-slate-400 uppercase">Date</p>
                        <p className="font-mono font-bold text-slate-700">{new Date(selectedSale.createdAt).toLocaleString('en-GB')}</p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-slate-400 uppercase">Cashier</p>
                        <p className="font-bold text-slate-700 uppercase">{selectedSale.user?.username || 'N/A'}</p>
                    </div>
                </div>

                {/* ITEMS LIST TABLE */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden mb-6">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-100/50">
                            <tr className="text-[9px] font-bold uppercase text-slate-400 border-b border-slate-200">
                                <th className="px-4 py-2">Item</th>
                                <th className="px-4 py-2 text-center">Qty</th>
                                <th className="px-4 py-2 text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {selectedSale.items?.map((item, idx) => (
                                <tr key={idx} className="text-[11px]">
                                    <td className="px-4 py-3 font-bold text-slate-700 uppercase">
                                        {item.product?.name || "Unknown Product"}
                                    </td>
                                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-500">
                                        x{item.quantity}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                                        {(item.unitPrice * item.quantity).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-between items-center mb-8 px-2">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Method</p>
                        <p className="text-xs font-black text-slate-700 uppercase">{selectedSale.paymentMethod || 'CASH'}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Total Amount</p>
                        <p className="text-2xl font-mono font-black text-indigo-600">RM {selectedSale.totalAmount?.toFixed(2)}</p>
                    </div>
                </div>

                <button 
                  onClick={() => setSelectedSale(null)}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-lg"
                >
                  Close Receipt
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesHistory;