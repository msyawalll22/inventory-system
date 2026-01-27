import React, { useState, useEffect } from 'react';
import apiRequest from '../../utils/api.js';
import SuccessAlert from '../../components/SuccessAlert';

const Purchases = ({ products = [], refreshData }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Alert State for Success/Error feedback
  const [alertConfig, setAlertConfig] = useState({ 
    show: false, 
    title: '', 
    message: '', 
    type: 'success' 
  });

  const loggedInUser = JSON.parse(localStorage.getItem('user')) || { id: null };

  const IT_CATEGORIES = [
    "Laptops & PCs", "Components (CPU/GPU/RAM)", "Storage (SSD/HDD)",
    "Networking", "Peripherals (Mouse/KB)", "Monitors",
    "Cables & Adapters", "Software/Licenses"
  ];

  const [formData, setFormData] = useState({
    productId: '', supplierId: '', quantity: '',
    unitPrice: '', newName: '', category: '', reference: ''
  });

  const generateRef = (category, count, isRestock) => {
    if (!category) return '';
    const prefix = isRestock ? 'RST' : 'REG';
    const catCode = category.substring(0, 3).toUpperCase();
    const orderNum = String(count + 1).padStart(3, '0');
    return `${prefix}-${catCode}-${orderNum}`;
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [supRes, purRes] = await Promise.all([
          apiRequest('/suppliers'),
          apiRequest('/purchases')
        ]);
        if (supRes.ok) setSuppliers(await supRes.json());
        if (purRes.ok) {
          const purData = await purRes.json();
          setPurchaseCount(purData.length);
        }
      } catch (err) {
        console.error("Initial fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isNewProduct) {
      if (formData.category) {
        const ref = generateRef(formData.category, purchaseCount, false);
        setFormData(p => ({ ...p, reference: ref }));
      }
    } else {
      if (formData.productId) {
        const item = products.find(p => String(p.id) === String(formData.productId));
        if (item) {
          const ref = generateRef(item.category, purchaseCount, true);
          setFormData(p => ({ ...p, reference: ref, category: item.category }));
        }
      }
    }
  }, [formData.productId, formData.category, isNewProduct, purchaseCount, products]);

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    if (!formData.supplierId || !formData.quantity || !formData.unitPrice) {
      setAlertConfig({
        show: true,
        type: 'error',
        title: "INCOMPLETE FORM",
        message: "Please ensure all required procurement fields are populated."
      });
      return;
    }
    setShowConfirmModal(true);
  };

  const executeSubmit = async () => {
    setShowConfirmModal(false);
    
    const qty = parseInt(formData.quantity);
    const uPrice = parseFloat(formData.unitPrice);
    const sId = parseInt(formData.supplierId);

    let productPayload;
    if (isNewProduct) {
      productPayload = {
        name: formData.newName,
        category: formData.category,
        price: uPrice * 1.5,
        active: true,
        quantity: 0
      };
    } else {
      productPayload = products.find(p => String(p.id) === String(formData.productId));
    }

    const payload = {
      user: { id: loggedInUser.id },
      supplier: { id: sId },
      product: productPayload,
      reference: formData.reference,
      category: formData.category,
      quantity: qty,
      unitPrice: uPrice,
      status: "COMPLETED"
    };

    try {
      const endpoint = isNewProduct ? '/purchases/new-product' : '/purchases';
      const res = await apiRequest(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        await refreshData();
        setPurchaseCount(c => c + 1);
        setFormData({ productId: '', supplierId: '', quantity: '', unitPrice: '', newName: '', category: '', reference: '' });
        setIsNewProduct(false);
        setAlertConfig({
          show: true,
          type: 'success',
          title: "TRANSACTION SUCCESS",
          message: `Procurement reference ${payload.reference} has been logged and inventory updated.`
        });
      } else {
        const errData = await res.json();
        setAlertConfig({
          show: true,
          type: 'error',
          title: "DATABASE REJECTION",
          message: errData.message || "The transaction was rejected by the server."
        });
      }
    } catch (err) {
      setAlertConfig({
        show: true,
        type: 'error',
        title: "NETWORK ERROR",
        message: "Failed to reach the procurement server. Transaction aborted."
      });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-slate-500 font-mono text-xs uppercase tracking-widest">Initializing Procurement...</p>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      
      {/* SUCCESS/ERROR ALERT */}
      <SuccessAlert 
        show={alertConfig.show}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={() => setAlertConfig({ ...alertConfig, show: false })}
      />

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 rotate-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Authorize Transaction</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Confirm procurement of <span className="font-bold text-slate-900">{isNewProduct ? formData.newName : products.find(p => p.id == formData.productId)?.name}</span>.
              </p>
              
              <div className="mt-6 bg-slate-50 rounded-xl p-4 grid grid-cols-2 gap-4 text-left border border-slate-100">
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Quantity</p>
                  <p className="font-mono text-sm font-bold text-slate-800">{formData.quantity} Units</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Reference</p>
                  <p className="font-mono text-sm font-bold text-indigo-600">{formData.reference}</p>
                </div>
              </div>
            </div>
            
            <div className="flex p-4 gap-3 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-3 text-[10px] font-bold text-slate-500 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200"
              >
                CANCEL
              </button>
              <button 
                onClick={executeSubmit}
                className="flex-1 px-4 py-3 text-[10px] font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 uppercase"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Header with Mode Toggle */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 pb-8 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 uppercase">
              Inventory <span className="text-indigo-600 italic">Procurement</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Add assets and manage supplier transactions.</p>
          </div>
          
          <div className="mt-6 md:mt-0 flex bg-slate-200 p-1 rounded-xl w-fit">
            <button 
              type="button"
              onClick={() => { 
                setIsNewProduct(false); 
                setFormData({ ...formData, productId: '', newName: '', category: '', reference: '' });
              }}
              className={`px-6 py-2.5 text-[10px] font-black rounded-lg transition-all tracking-widest ${!isNewProduct ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              RESTOCK ITEM
            </button>
            <button 
              type="button"
              onClick={() => { 
                setIsNewProduct(true); 
                setFormData({ ...formData, productId: '', newName: '', category: '', reference: '' });
              }}
              className={`px-6 py-2.5 text-[10px] font-black rounded-lg transition-all tracking-widest ${isNewProduct ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              NEW REGISTRY
            </button>
          </div>
        </div>

        <form onSubmit={handleOpenConfirm} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Form Fields */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                <span className="w-4 h-[2px] bg-indigo-600"></span> Asset Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isNewProduct ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Category</label>
                      <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                        <option value="">Select Category</option>
                        {IT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Asset Name</label>
                      <input required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold" placeholder="e.g. Dell UltraSharp 27" value={formData.newName} onChange={(e) => setFormData({...formData, newName: e.target.value})} />
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2 flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Inventory Asset</label>
                    <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-bold" value={formData.productId} onChange={(e) => setFormData({...formData, productId: e.target.value})}>
                      <option value="">Search Inventory...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Current Stock: {p.quantity})</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Authorized Vendor</label>
                  <select required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-semibold" value={formData.supplierId} onChange={(e) => setFormData({...formData, supplierId: e.target.value})}>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Inbound Quantity</label>
                  <input required type="number" min="1" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-mono font-bold" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                  <span className="w-4 h-[2px] bg-indigo-600"></span> Financial Valuation
                </h3>
                <div className="flex flex-col gap-2 max-w-xs">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Unit Cost</label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400 text-xs font-bold">RM</span>
                    <input required type="number" step="0.01" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl pl-12 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-mono font-bold" placeholder="0.00" value={formData.unitPrice} onChange={(e) => setFormData({...formData, unitPrice: e.target.value})} />
                  </div>
                </div>
            </div>
          </div>

          {/* Sticky Summary Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-2xl sticky top-8">
              <div className="mb-8">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">System Reference</label>
                <div className="mt-2 text-3xl font-mono font-bold text-indigo-400 tracking-tighter">
                  {formData.reference || '---'}
                </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Commitment</span>
                  <span className="font-mono text-lg font-bold text-white">
                    RM {(parseFloat(formData.unitPrice || 0) * parseInt(formData.quantity || 0)).toLocaleString(undefined, {minimumFractionDigits: 2})}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tax Provision</span>
                  <span className="font-mono text-slate-400 text-sm">RM 0.00</span>
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/20 mt-10 active:scale-95">
                {isNewProduct ? 'Authorize Registry' : 'Confirm Restock'}
              </button>
              
              <p className="mt-6 text-[9px] text-slate-500 font-medium text-center leading-relaxed">
                Submitting this form updates real-time inventory levels and logs a permanent financial transaction.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Purchases;