import React, { useState, useEffect, useMemo } from 'react';

const Pos = ({ products, refreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState([]); 
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState({ id: null, username: 'Loading...' });

  const [showReceipt, setShowReceipt] = useState(false);
  const [lastTransaction, setLastTransaction] = useState(null);
  const [uiError, setUiError] = useState('');

  // 1. EXTRACT UNIQUE CATEGORIES FOR THE TOP BAR
  const categories = useMemo(() => {
    const unique = [...new Set(products.map(p => p.category))].filter(Boolean);
    return ['ALL', ...unique];
  }, [products]);

  // 2. GROUP PRODUCTS BY CATEGORY FOR SECTIONED DISPLAY
  const groupedProducts = useMemo(() => {
    // Apply search filter first
    const searchFiltered = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Apply category filter
    const finalFiltered = selectedCategory === 'ALL' 
      ? searchFiltered 
      : searchFiltered.filter(p => p.category === selectedCategory);

    // Group items by their category name
    return finalFiltered.reduce((acc, product) => {
      const cat = product.category || 'OTHERS';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(product);
      return acc;
    }, {});
  }, [products, searchTerm, selectedCategory]);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setCurrentUser({
          id: parsedUser.id || parsedUser.userId,
          username: parsedUser.username || parsedUser.name || 'Staff'
        });
      }
    } catch (err) {
      console.error("User session error:", err);
    }
  }, []);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(cart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      } else {
        setUiError("STOCK LIMIT REACHED");
        setTimeout(() => setUiError(''), 3000);
      }
    } else {
      setCart([...cart, { ...product, quantity: 1, stock: product.quantity }]);
    }
  };

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
      const activePrice = item.promoPrice || item.price;
      return sum + (activePrice * item.quantity);
  }, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!currentUser.id) {
        setUiError("⚠️ SESSION EXPIRED");
        return;
    }
    setLoading(true);

    try {
      const saleRequest = {
        paymentMethod: paymentMethod,
        status: "COMPLETED",
        items: cart.map(item => ({
          product: { id: item.id },
          quantity: item.quantity
        }))
      };

      const response = await fetch(`http://localhost:8080/api/sales?userId=${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleRequest)
      });

      if (response.ok) {
        const result = await response.json();
        setLastTransaction({
            invoice: result.reference, 
            items: [...cart],
            total: totalAmount,
            cashier: currentUser.username,
            date: new Date().toLocaleString(),
            method: paymentMethod
        });
        await refreshData();
        setCart([]);
        setShowReceipt(true); 
      } else {
        const errorText = await response.text();
        throw new Error(errorText || "Server error");
      }
    } catch (err) {
      setUiError(`⚠️ FAILED: ${err.message}`);
      setTimeout(() => setUiError(''), 4000);
    } finally {
      setLoading(false);
    }
  };

  const PrintableReceipt = ({ data }) => (
    <div id="thermal-receipt" className="hidden print:block bg-white p-4 text-black font-mono text-[12px] w-[80mm] mx-auto">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold">TERMINAL POS</h2>
        <p>OFFICIAL SALES RECEIPT</p>
      </div>
      <div className="border-b border-dashed border-black mb-2"></div>
      <div className="mb-2 space-y-1">
        <div className="flex justify-between"><span>ID:</span><span className="font-bold">{data.invoice}</span></div>
        <div className="flex justify-between"><span>DATE:</span><span>{data.date}</span></div>
        <div className="flex justify-between"><span>STAFF:</span><span>{data.cashier}</span></div>
      </div>
      <div className="border-b border-dashed border-black mb-2"></div>
      <table className="w-full mb-2 border-collapse">
        <thead>
          <tr className="text-left border-b border-black">
            <th className="py-1">ITEM</th>
            <th className="text-right">QTY</th>
            <th className="text-right">PRICE</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1">{item.name.substring(0, 20)}</td>
              <td className="text-right">{item.quantity}</td>
              <td className="text-right">{(item.promoPrice || item.price).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-black pt-2 space-y-1">
        <div className="flex justify-between font-bold text-sm">
          <span>GRAND TOTAL:</span>
          <span>RM {data.total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );

  const ReceiptModal = ({ data, onClose }) => (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 border-b border-dashed border-slate-200 text-center relative">
            <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
                <div className="relative w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-200 z-10 animate-success-burst">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path className="animate-checkmark" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Payment Successful</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{data.invoice}</p>
        </div>
        
        <div className="p-8 space-y-4">
            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Description</span>
                <span>Total</span>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {data.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-600">{item.quantity}x {item.name}</span>
                        <span className="font-mono font-bold">RM {((item.promoPrice || item.price) * item.quantity).toFixed(2)}</span>
                    </div>
                ))}
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <span className="text-sm font-black text-slate-900 uppercase">Grand Total</span>
                <span className="text-2xl font-mono font-black text-indigo-600">RM {data.total.toFixed(2)}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl text-[10px] text-slate-500 space-y-1 font-medium">
                <div className="flex justify-between"><span>Method:</span><span className="font-bold text-slate-700">{data.method}</span></div>
                <div className="flex justify-between"><span>Cashier:</span><span className="font-bold text-slate-700">{data.cashier}</span></div>
                <div className="flex justify-between"><span>Date:</span><span>{data.date}</span></div>
            </div>
        </div>

        <div className="p-6 bg-slate-50 flex gap-3">
            <button onClick={() => window.print()} className="flex-1 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">Print PDF</button>
            <button onClick={onClose} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-200">Done</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-10 max-w-[1800px] mx-auto h-screen flex flex-col gap-8 bg-slate-50 font-sans text-slate-900">
      
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #thermal-receipt, #thermal-receipt * { visibility: visible; }
            #thermal-receipt { position: absolute; left: 0; right: 0; top: 5mm; margin: 0 auto; width: 80mm; display: block; }
          }
          @keyframes success-burst {
            0% { transform: scale(0.5); opacity: 0; }
            70% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes checkmark-draw {
            0% { stroke-dasharray: 0, 100; opacity: 0; }
            100% { stroke-dasharray: 100, 100; opacity: 1; }
          }
          .animate-success-burst { animation: success-burst 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
          .animate-checkmark { animation: checkmark-draw 0.6s 0.3s ease-in-out forwards; stroke-dasharray: 100; }
        `}
      </style>

      {lastTransaction && <PrintableReceipt data={lastTransaction} />}
      {uiError && <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[60] bg-rose-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold text-xs animate-bounce uppercase tracking-widest">{uiError}</div>}
      {showReceipt && <ReceiptModal data={lastTransaction} onClose={() => setShowReceipt(false)} />}

      <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-200 pb-6 bg-white p-6 rounded-xl shadow-sm no-print">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-200">
            {currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : '??'}
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight italic">Terminal <span className="text-indigo-600">POS</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cashier: {currentUser?.username || 'Guest'}</p>
          </div>
        </div>
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <input type="text" placeholder="Search items..." className="w-full py-3 px-5 pl-12 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium text-sm transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <span className="absolute left-4 top-3.5 opacity-30">🔍</span>
        </div>
      </header>

      {/* CATEGORY BAR */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-print custom-scrollbar">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${
              selectedCategory === cat 
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300 hover:text-indigo-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden no-print">
        <div className="col-span-12 lg:col-span-8 overflow-y-auto pr-2 custom-scrollbar pb-10">
          
          {/* CATEGORY SECTION LOOP */}
          {Object.keys(groupedProducts).length > 0 ? (
            Object.entries(groupedProducts).map(([categoryName, items]) => (
              <div key={categoryName} className="mb-12">
                <div className="mb-6 flex items-center gap-4">
                  <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">{categoryName}</h2>
                  <div className="h-[1px] flex-1 bg-slate-200"></div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map(p => (
                    <button key={p.id} onClick={() => addToCart(p)} disabled={p.quantity <= 0} className="group bg-white rounded-xl border border-slate-200 overflow-hidden transition-all hover:border-indigo-500 hover:shadow-2xl hover:-translate-y-1 flex flex-col h-[300px] text-left disabled:opacity-40 relative">
                      <div className="h-36 w-full bg-slate-100 flex items-center justify-center overflow-hidden">
                        {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={p.name} /> : <span className="text-[10px] font-bold text-slate-300 uppercase">No Preview</span>}
                      </div>
                      <div className="p-4 flex flex-col justify-between flex-1">
                        <div>
                          <h3 className="font-bold text-slate-800 text-[11px] uppercase line-clamp-2 leading-tight tracking-tight">{p.name}</h3>
                        </div>
                        <div>
                          <p className="text-lg font-mono font-black text-slate-900">RM {(p.promoPrice || p.price).toFixed(2)}</p>
                          <p className={`text-[9px] font-black uppercase mt-1 px-2 py-1 inline-block rounded ${p.quantity < 5 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>QTY: {p.quantity}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <span className="text-6xl mb-4">🔍</span>
              <p className="font-black uppercase tracking-widest text-xs">No products found</p>
            </div>
          )}
        </div>

        {/* RIGHT SIDE CART */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-slate-200 flex flex-col shadow-xl overflow-hidden h-full relative">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
            <h2 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em]">Current Order</h2>
            <button onClick={() => setCart([])} className="text-[9px] font-black text-rose-500 hover:text-rose-700 uppercase tracking-widest transition-colors">Void Order</button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {cart.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 opacity-40"><div className="text-5xl">📦</div><span className="text-[10px] font-black uppercase tracking-[0.3em]">Scanner Ready</span></div> : cart.map(item => (
              <div key={item.id} className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-[11px] uppercase truncate tracking-tight">{item.name}</p>
                  <p className="text-[10px] font-mono font-black text-indigo-600">RM {(item.promoPrice || item.price).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
                  <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center font-bold hover:bg-slate-50 rounded text-slate-400 hover:text-rose-500">-</button>
                  <span className="text-[10px] font-black w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center font-bold hover:bg-slate-50 rounded text-slate-400 hover:text-indigo-600">+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-6 bg-slate-900 text-white">
            <div className="flex justify-between items-end mb-6">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Net Amount</span>
              <span className="text-3xl font-mono font-black text-indigo-400">RM {totalAmount.toFixed(2)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {['CASH', 'CARD'].map(m => (
                <button key={m} onClick={() => setPaymentMethod(m)} className={`py-3 text-[10px] font-black rounded-xl border transition-all uppercase tracking-widest ${paymentMethod === m ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}>{m}</button>
              ))}
            </div>
            <button onClick={handleCheckout} disabled={loading || cart.length === 0} className="w-full bg-indigo-500 text-white py-5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-indigo-400 transition-all disabled:opacity-20 shadow-2xl shadow-indigo-500/20">{loading ? 'Validating...' : 'Authorize Checkout'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pos;