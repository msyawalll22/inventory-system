import React, { useState, useEffect } from 'react';
import apiRequest from '../../utils/api.js';

const Purchases = ({ products, refreshData }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseCount, setPurchaseCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isNewProduct, setIsNewProduct] = useState(false); 
  
  const loggedInUser = JSON.parse(localStorage.getItem('user'));

  const IT_CATEGORIES = [
    "Laptops & PCs", "Components (CPU/GPU/RAM)", "Storage (SSD/HDD)",
    "Networking", "Peripherals (Mouse/KB)", "Monitors",
    "Cables & Adapters", "Software/Licenses"
  ];

  const [formData, setFormData] = useState({
    productId: '', supplierId: '', quantity: '',
    unitPrice: '', newName: '', category: '', reference: '' 
  });

  const generateRef = (category, name, count, isRestock) => {
    if (!category || !name) return '';
    const prefix = isRestock ? 'RST' : 'INV';
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
        setSuppliers(await supRes.json());
        const purData = await purRes.json();
        setPurchaseCount(purData.length);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isNewProduct && formData.category && formData.newName) {
      setFormData(p => ({ ...p, reference: generateRef(formData.category, formData.newName, purchaseCount, false) }));
    }
  }, [formData.category, formData.newName, isNewProduct, purchaseCount]);

  useEffect(() => {
    if (!isNewProduct && formData.productId) {
      const item = products.find(p => p.id === parseInt(formData.productId));
      if (item) setFormData(p => ({ ...p, reference: generateRef(item.category, item.name, purchaseCount, true), category: item.category }));
    }
  }, [formData.productId, isNewProduct, purchaseCount, products]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      user: { id: loggedInUser.id },
      supplier: { id: parseInt(formData.supplierId) },
      reference: formData.reference,
      category: formData.category,
      product: isNewProduct ? {
        name: formData.newName, category: formData.category,
        price: parseFloat(formData.unitPrice) * 1.5, active: true, quantity: 0
      } : { id: parseInt(formData.productId) },
      quantity: parseInt(formData.quantity),
      unitPrice: parseFloat(formData.unitPrice),
      status: "COMPLETED"
    };

    try {
      const res = await apiRequest(isNewProduct ? '/purchases/new-product' : '/purchases', {
        method: 'POST', body: JSON.stringify(payload)
      });
      if (res.ok) {
        refreshData();
        setPurchaseCount(c => c + 1);
        setFormData({ productId: '', supplierId: '', quantity: '', unitPrice: '', newName: '', category: '', reference: '' });
        setIsNewProduct(false);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-sans text-slate-900">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-slate-200 pb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Inventory Procurement</h1>
            <p className="text-sm text-slate-500 mt-1">Log new assets or restock existing inventory into the system.</p>
          </div>
          <div className="mt-4 md:mt-0 flex bg-slate-200 p-1 rounded-lg">
            <button 
              onClick={() => { setIsNewProduct(false); setFormData({...formData, reference: ''}) }}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${!isNewProduct ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Restock Item
            </button>
            <button 
              onClick={() => { setIsNewProduct(true); setFormData({...formData, reference: ''}) }}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${isNewProduct ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:text-slate-900'}`}
            >
              New Registration
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Main Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold mb-4 text-slate-700 border-b pb-2">Product Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isNewProduct ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-600">Category</label>
                      <select required className="border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                        <option value="">Select Category</option>
                        {IT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-slate-600">Product Name</label>
                      <input required className="border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Enter Full Product Name" value={formData.newName} onChange={(e) => setFormData({...formData, newName: e.target.value})} />
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-600">Select Existing Asset</label>
                    <select required className="border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.productId} onChange={(e) => setFormData({...formData, productId: e.target.value})}>
                      <option value="">Search system inventory...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.category}</option>)}
                    </select>
                  </div>
                )}
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600">Vendor / Supplier</label>
                  <select required className="border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.supplierId} onChange={(e) => setFormData({...formData, supplierId: e.target.value})}>
                    <option value="">Select Vendor</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600">Quantity</label>
                  <input required type="number" min="1" className="border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold mb-4 text-slate-700 border-b pb-2">Financials</h3>
                <div className="flex flex-col gap-1.5 max-w-xs">
                  {/* Updated label from USD to RM */}
                  <label className="text-xs font-medium text-slate-600">Unit Cost (RM)</label>
                  <div className="relative">
                    {/* Updated icon to RM */}
                    <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-bold">RM</span>
                    <input required type="number" step="0.01" className="w-full border border-slate-300 rounded-lg p-2.5 pl-10 text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-mono" placeholder="0.00" value={formData.unitPrice} onChange={(e) => setFormData({...formData, unitPrice: e.target.value})} />
                  </div>
                </div>
            </div>
          </div>

          {/* Right Column: Reference & Actions */}
          <div className="space-y-6">
            <div className="bg-slate-800 text-white rounded-xl p-6 shadow-lg shadow-slate-200">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Order Reference</label>
              <div className="mt-2 text-2xl font-mono font-bold tracking-tight text-indigo-300">
                {formData.reference || 'REF-PENDING'}
              </div>
              <p className="text-[10px] text-slate-400 mt-4 border-t border-slate-700 pt-4 italic">
                Sequence: #{String(purchaseCount + 1).padStart(4, '0')}
              </p>
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all shadow-md flex items-center justify-center gap-2">
              {isNewProduct ? 'Complete Registration' : 'Update Inventory'}
            </button>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-[11px] text-amber-700 leading-relaxed">
                <strong>Note:</strong> Finalizing this transaction will update global stock levels and generate a permanent ledger entry.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Purchases;