import React, { useState } from 'react';

const Pos = ({ products, refreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]); 
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);

  // Filter products based on search
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(cart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      } else {
        alert("Cannot add more! Out of stock.");
      }
    } else {
      setCart([...cart, { ...product, quantity: 1, stock: product.quantity }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const updateCartQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return (newQty > 0 && newQty <= item.stock) ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const totalAmount = cart.reduce((sum, item) => {
      // Use promoPrice if available, otherwise use regular price
      const activePrice = item.promoPrice || item.price;
      return sum + (activePrice * item.quantity);
  }, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setLoading(true);

    try {
      const promises = cart.map(item => {
        const url = `http://localhost:8080/api/sales?productId=${item.id}&quantitySold=${item.quantity}&paymentMethod=${paymentMethod}`;
        return fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: "COMPLETED" })
        });
      });

      await Promise.all(promises);
      await refreshData();
      alert("Checkout successful!");
      setCart([]);
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto h-[90vh] flex flex-col gap-6">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <h1 className="text-2xl font-black text-slate-800">Point of Sale</h1>
        <div className="relative w-1/3">
          <input 
            type="text" 
            placeholder="Search items..." 
            className="w-full p-3 pl-10 bg-slate-50 rounded-2xl outline-none border border-transparent focus:border-indigo-500"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-4 top-3.5 opacity-30">🔍</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* PRODUCT GRID */}
        <div className="col-span-8 overflow-y-auto pr-2">
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <button 
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.quantity <= 0}
                className="group bg-white rounded-3xl border-2 border-transparent hover:border-indigo-500 overflow-hidden transition-all shadow-sm flex flex-col h-72 disabled:opacity-50"
              >
                {/* Image Container */}
                <div className="h-40 w-full bg-slate-100 relative overflow-hidden">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold">NO IMAGE</div>
                  )}
                  {p.promoPrice && (
                    <div className="absolute top-2 right-2 bg-rose-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">SALE</div>
                  )}
                </div>

                {/* Info Container */}
                <div className="p-4 flex-1 flex flex-col justify-between text-left">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.category || 'Product'}</span>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight mt-0.5 line-clamp-2">{p.name}</h3>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-indigo-600">${(p.promoPrice || p.price).toFixed(2)}</span>
                      {p.promoPrice && <span className="text-[10px] text-slate-400 line-through">${p.price.toFixed(2)}</span>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${p.quantity < 5 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>
                      {p.quantity} PCS
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CART SIDEBAR */}
        <div className="col-span-4 bg-white rounded-[40px] border border-slate-200 flex flex-col shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="font-black text-slate-800 uppercase tracking-tighter">Current Order</h2>
            <button onClick={() => setCart([])} className="text-xs font-bold text-rose-500 hover:underline">Clear All</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <span className="text-4xl mb-2">🛒</span>
                <p className="font-bold">Cart is empty</p>
              </div>
            ) : cart.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                {/* Thumbnail in cart */}
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 flex-shrink-0">
                    <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm truncate">{item.name}</p>
                  <p className="text-xs font-bold text-indigo-500">${(item.promoPrice || item.price).toFixed(2)}</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl">
                  <button onClick={() => updateCartQty(item.id, -1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-slate-600">-</button>
                  <span className="font-black text-xs w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateCartQty(item.id, 1)} className="w-7 h-7 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-slate-600">+</button>
                </div>
                <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-rose-500 ml-2">✕</button>
              </div>
            ))}
          </div>

          <div className="p-8 bg-slate-50 border-t border-slate-100 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-bold uppercase text-xs tracking-widest">Total Payable</span>
              <span className="text-3xl font-black text-slate-900">${totalAmount.toFixed(2)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {['CASH', 'CARD'].map(m => (
                <button 
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-3 rounded-2xl font-black text-xs tracking-widest transition-all ${paymentMethod === m ? 'bg-slate-900 text-white shadow-lg' : 'bg-white text-slate-400 border border-slate-200'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button 
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-3xl font-black text-xl shadow-xl shadow-indigo-100 transition-all disabled:grayscale disabled:opacity-50"
            >
              {loading ? 'PROCESSING...' : 'PROCESS CHECKOUT'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pos;