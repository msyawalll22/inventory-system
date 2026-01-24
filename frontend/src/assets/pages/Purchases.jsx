import React, { useState, useEffect } from 'react';

const Purchases = ({ products, refreshData }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [isNewProduct, setIsNewProduct] = useState(false); 
  
  const [formData, setFormData] = useState({
    productId: '',
    supplierId: '',
    quantity: '',
    unitPrice: '',
    newName: '',
    newCategory: 'General',
    newDescription: ''
  });

  useEffect(() => {
    fetch('http://localhost:8080/api/suppliers')
      .then(res => res.json())
      .then(data => {
        setSuppliers(data);
        setLoadingSuppliers(false);
      })
      .catch(err => console.error("Error fetching suppliers:", err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Construct the payload to match the backend Java Models
    const purchasePayload = {
      supplier: { id: parseInt(formData.supplierId) },
      product: isNewProduct ? {
        name: formData.newName,
        description: formData.newDescription,
        price: parseFloat(formData.unitPrice) * 1.5, // 50% Markup
        active: true, // Crucial for Soft Delete logic
        quantity: 0
      } : { id: parseInt(formData.productId) },
      quantity: parseInt(formData.quantity),
      unitPrice: parseFloat(formData.unitPrice),
      status: "COMPLETED"
    };

    // Correct URLs to match the new Controller endpoints
    const url = isNewProduct 
      ? `http://localhost:8080/api/purchases/new-product` 
      : `http://localhost:8080/api/purchases`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchasePayload)
      });

      if (response.ok) {
        await refreshData(); 
        alert(isNewProduct ? "✅ New Product Created & Stocked!" : "✅ Stock Updated!");
        // Reset form
        setFormData({ 
            productId: '', supplierId: '', quantity: '', unitPrice: '', 
            newName: '', newCategory: 'General', newDescription: '' 
        }); 
        setIsNewProduct(false);
      } else {
        const errorMsg = await response.text();
        alert(`❌ Error: ${errorMsg || "Could not record purchase."}`);
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("❌ Connection to server failed.");
    }
  };

  if (loadingSuppliers) return <div className="p-8 animate-pulse text-slate-500 font-medium text-center">Syncing with database...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-sans tracking-tight">Purchase Order</h1>
          <p className="text-slate-500 font-medium">Restock existing items or register new arrivals.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
                type="button"
                onClick={() => setIsNewProduct(false)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${!isNewProduct ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
            >EXISTING</button>
            <button 
                type="button"
                onClick={() => setIsNewProduct(true)}
                className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${isNewProduct ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
            >NEW ITEM</button>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="md:col-span-2">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Supplier (Vendor)</label>
            <select 
              required
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none"
              value={formData.supplierId}
              onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
            >
              <option value="">-- Select Registered Supplier --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
              ))}
            </select>
          </div>

          {isNewProduct ? (
            <div className="md:col-span-2 space-y-4 p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                <h3 className="text-indigo-900 font-bold text-sm uppercase tracking-wider">Product Registration</h3>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Item Name</label>
                    <input 
                        required
                        className="w-full p-3 bg-white border border-indigo-200 rounded-xl outline-none" 
                        placeholder="e.g. Wireless Mouse"
                        value={formData.newName}
                        onChange={(e) => setFormData({...formData, newName: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                    <input 
                        className="w-full p-3 bg-white border border-indigo-200 rounded-xl outline-none" 
                        placeholder="Brief product details..."
                        value={formData.newDescription}
                        onChange={(e) => setFormData({...formData, newDescription: e.target.value})}
                    />
                </div>
            </div>
          ) : (
            <div className="md:col-span-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Product to Restock</label>
              <select 
                required
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none"
                value={formData.productId}
                onChange={(e) => setFormData({...formData, productId: e.target.value})}
              >
                <option value="">-- Search Inventory --</option>
                {products.filter(p => p.active !== false).map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantity})</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Quantity Received</label>
            <input 
              required
              type="number"
              min="1"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.quantity}
              onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">Cost Price (Unit)</label>
            <input 
              required
              type="number"
              step="0.01"
              min="0.01"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="$ 0.00"
              value={formData.unitPrice}
              onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
            />
          </div>
        </div>

        <button 
          type="submit" 
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl hover:bg-slate-800 transition-all shadow-xl active:scale-[0.98] flex justify-center items-center gap-3"
        >
          <span>📦</span> {isNewProduct ? 'REGISTER & PURCHASE' : 'CONFIRM RESTOCK'}
        </button>
      </form>
    </div>
  );
};

export default Purchases;