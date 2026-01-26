import React, { useState, useEffect } from 'react';
import apiRequest from '../../utils/api.js';

const Purchases = ({ products = [], refreshData }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  // Custom Notification State
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

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

  const notify = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: '' }), 3000);
  };

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
      notify("Please fill in all required fields.", "error");
      return;
    }
    setShowModal(true);
  };

  const executeSubmit = async () => {
    setShowModal(false);
    
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
      const existingProduct = products.find(p => String(p.id) === String(formData.productId));
      productPayload = existingProduct;
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
        notify("Transaction completed successfully.");
      } else {
        const errData = await res.json();
        notify(errData.message || "Database error.", "error");
      }
    } catch (err) {
      notify("Network error. Check server logs.", "error");
    }
  };

  if (loading) return <div className="p-10 text-center font-mono">Loading procurement system...</div>;

  return (
    <div className="relative min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      
      {/* NOTIFICATION TOAST */}
      {notification.show && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[60] flex items-center px-6 py-3 rounded-full shadow-2xl transition-all duration-500
          ${notification.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-900 text-white'}`}>
          <span className="text-sm font-bold tracking-wide uppercase">
             {notification.message}
          </span>
        </div>
      )}

      {/* PROFESSIONAL MODAL POPUP */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Confirm Transaction</h3>
              <p className="text-sm text-slate-500 mt-2">
                You are about to authorize a purchase for <span className="font-bold text-slate-900">{isNewProduct ? formData.newName : products.find(p => p.id == formData.productId)?.name}</span>.
              </p>
              
              <div className="mt-6 bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-4 text-left border border-slate-100">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Qty</p>
                  <p className="font-mono text-slate-800">{formData.quantity} units</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Reference</p>
                  <p className="font-mono text-slate-800">{formData.reference}</p>
                </div>
              </div>
            </div>
            
            <div className="flex border-t border-slate-100">
              <button 
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={executeSubmit}
                className="flex-1 px-4 py-4 text-sm font-bold text-indigo-600 hover:bg-indigo-50 transition-colors border-l border-slate-100"
              >
                AUTHORIZE
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Inventory Procurement</h1>
            <p className="text-sm text-slate-500 mt-1">Stock and Asset Management Portal</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex bg-slate-200 p-1 rounded-lg">
            <button 
              type="button"
              onClick={() => { 
                setIsNewProduct(false); 
                setFormData({ ...formData, productId: '', newName: '', category: '', reference: '' });
              }}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${!isNewProduct ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              RESTOCK
            </button>
            <button 
              type="button"
              onClick={() => { 
                setIsNewProduct(true); 
                setFormData({ ...formData, productId: '', newName: '', category: '', reference: '' });
              }}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${isNewProduct ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              NEW ITEM
            </button>
          </div>
        </div>

        <form onSubmit={handleOpenConfirm} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4 text-slate-700 border-b pb-2">Product Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isNewProduct ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-600">Category</label>
                      <select required className="border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                        <option value="">Select Category</option>
                        {IT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-600">Product Name</label>
                      <input required className="border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. RTX 4090" value={formData.newName} onChange={(e) => setFormData({...formData, newName: e.target.value})} />
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-600">Select Asset to Restock</label>
                    <select required className="border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={formData.productId} onChange={(e) => setFormData({...formData, productId: e.target.value})}>
                      <option value="">Choose from inventory...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600">Vendor</label>
                  <select required className="border border-slate-300 rounded-lg p-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500" value={formData.supplierId} onChange={(e) => setFormData({...formData, supplierId: e.target.value})}>
                    <option value="">Select Supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600">Quantity</label>
                  <input required type="number" min="1" className="border border-slate-300 rounded-lg p-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold mb-4 text-slate-700 border-b pb-2">Financials</h3>
                <div className="flex flex-col gap-1.5 max-w-xs">
                  <label className="text-xs font-medium text-slate-600">Unit Cost (RM)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">RM</span>
                    <input required type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2.5 pl-10 text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" value={formData.unitPrice} onChange={(e) => setFormData({...formData, unitPrice: e.target.value})} />
                  </div>
                </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-800 text-white rounded-xl p-6 shadow-lg">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order Reference</label>
              <div className="mt-2 text-2xl font-mono font-bold text-indigo-300 uppercase">
                {formData.reference || '---'}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-700">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Commitment</label>
                <div className="text-xl font-mono">
                  RM {(parseFloat(formData.unitPrice || 0) * parseInt(formData.quantity || 0)).toFixed(2)}
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md">
              {isNewProduct ? 'REGISTER ASSET' : 'CONFIRM STOCK'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Purchases;