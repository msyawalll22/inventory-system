import React, { useState, useEffect } from 'react';

const Pos = ({ products, refreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]); 
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [loading, setLoading] = useState(false);
  
  // ADJUSTED: Changed 'name' to 'username' to match your DB table
  const [currentUser, setCurrentUser] = useState({ id: null, username: 'Loading...' });

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        console.log("POS Session Data:", parsedUser); // Check your console F12 to see this
        
        setCurrentUser({
          id: parsedUser.id || parsedUser.userId,
          // Fallback logic: check for 'username', then 'name', then default to 'Staff'
          username: parsedUser.username || parsedUser.name || 'Staff'
        });
      }
    } catch (err) {
      console.error("User session error:", err);
    }
  }, []);

  // Format: SLS - [Item] - [Method] - [ID]
  const generateComplexInvoiceId = (dbId, cartItems, method) => {
    const modelTag = cartItems.length > 0 
      ? cartItems[0].name.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 8)
      : 'ITEM';
    const methodTag = method === 'CASH' ? 'CSH' : 'CRD';
    const orderNum = String(dbId || Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `SLS-${modelTag}-${methodTag}-${orderNum}`;
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      if (existingItem.quantity < product.quantity) {
        setCart(cart.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ));
      } else {
        alert("STOCK LIMIT REACHED");
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
        alert("⚠️ SESSION EXPIRED: Please log in again.");
        return;
    }
    setLoading(true);

    try {
      const salesPromises = cart.map(item => {
        const queryParams = new URLSearchParams({
          productId: item.id,
          quantitySold: item.quantity,
          paymentMethod: paymentMethod,
          userId: currentUser.id // Sending the numeric ID (5, 8, etc.)
        });

        const url = `http://localhost:8080/api/sales?${queryParams.toString()}`;
        
        return fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: "COMPLETED" })
        });
      });

      const responses = await Promise.all(salesPromises);
      const allSuccessful = responses.every(res => res.ok);

      if (allSuccessful) {
        const firstResult = await responses[0].json();
        const customInvoice = generateComplexInvoiceId(firstResult.id, cart, paymentMethod);
        
        await refreshData();
        alert(`✅ TRANSACTION SUCCESSFUL\n\nInvoice: ${customInvoice}\nCashier: ${currentUser.username}\nTotal: RM ${totalAmount.toFixed(2)}`);
        setCart([]);
      } else {
        const errorText = await responses[0].text();
        throw new Error(errorText || "Server rejected request");
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("⚠️ CHECKOUT FAILED: User ID not found in database.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-[1800px] mx-auto h-screen flex flex-col gap-8 bg-slate-50 font-sans text-slate-900">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-200 pb-6 bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-200">
            {/* ADJUSTED: Changed name to username */}
            {currentUser?.username ? currentUser.username.substring(0, 2).toUpperCase() : '??'}
          </div>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight italic">Terminal <span className="text-indigo-600">POS</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
               {/* ADJUSTED: Changed name to username */}
               User: <span className="text-slate-900">{currentUser?.username || 'Guest'}</span> • ID: {currentUser?.id || '--'}
            </p>
          </div>
        </div>
        <div className="relative w-full md:w-1/2 lg:w-1/3">
          <input 
            type="text" 
            placeholder="Search items..." 
            className="w-full py-3 px-5 pl-12 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium text-sm transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-4 top-3.5 opacity-30">🔍</span>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 flex-1 overflow-hidden">
        
        {/* PRODUCT GRID */}
        <div className="col-span-12 lg:col-span-8 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <button 
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.quantity <= 0}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden transition-all hover:border-indigo-500 hover:shadow-xl flex flex-col h-[300px] text-left disabled:opacity-40 relative"
              >
                {p.promoPrice && (
                  <span className="absolute top-2 right-2 bg-rose-500 text-white text-[8px] font-bold px-2 py-1 rounded-full z-10">PROMO</span>
                )}
                <div className="h-36 w-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                  {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" alt={p.name} /> : 'NO IMAGE'}
                </div>
                <div className="p-4 flex flex-col justify-between flex-1">
                  <h3 className="font-bold text-slate-800 text-[11px] uppercase line-clamp-2">{p.name}</h3>
                  <div>
                    <p className="text-lg font-mono font-bold text-slate-900">RM {(p.promoPrice || p.price).toFixed(2)}</p>
                    <p className={`text-[9px] font-black uppercase mt-1 ${p.quantity < 5 ? 'text-rose-500' : 'text-slate-400'}`}>
                       Stock: {p.quantity}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CART */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-xl border border-slate-200 flex flex-col shadow-sm overflow-hidden h-full">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800 text-[10px] uppercase tracking-widest">Active Order</h2>
            <button onClick={() => setCart([])} className="text-[9px] font-black text-rose-500 hover:underline uppercase">Clear All</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                   <span className="text-3xl">🛒</span>
                   <span className="text-[10px] font-bold uppercase tracking-widest">Cart Empty</span>
                </div>
            ) : cart.map(item => (
              <div key={item.id} className="flex items-center gap-4 group">
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-[11px] uppercase truncate">{item.name}</p>
                  <p className="text-[10px] font-mono font-bold text-indigo-600">RM {(item.promoPrice || item.price).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg p-1">
                  <button onClick={() => updateCartQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center font-bold hover:text-rose-500 transition-colors">-</button>
                  <span className="text-[10px] font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateCartQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center font-bold hover:text-indigo-600 transition-colors">+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-slate-900 text-white">
            <div className="flex justify-between items-end mb-6">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Payable</span>
              <span className="text-3xl font-mono font-black text-indigo-400">RM {totalAmount.toFixed(2)}</span>
            </div>

            <div className="flex gap-2 mb-4">
              {['CASH', 'CARD'].map(m => (
                <button 
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`flex-1 py-3 text-[10px] font-bold rounded-lg border transition-all ${paymentMethod === m ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button 
              onClick={handleCheckout}
              disabled={loading || cart.length === 0}
              className="w-full bg-indigo-500 text-white py-4 rounded-lg font-black text-[11px] uppercase tracking-widest hover:bg-indigo-400 transition-all disabled:opacity-20 active:scale-95 shadow-lg shadow-indigo-900/20"
            >
              {loading ? 'Processing...' : 'Complete Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pos;