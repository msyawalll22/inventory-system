import { useState, useEffect } from 'react'

function App() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. CONNECT TO JAVA BACKEND
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        // This targets your Spring Boot Controller
        const response = await fetch('http://localhost:8080/api/products'); 
        const data = await response.json();
        setInventory(data);
      } catch (error) {
        console.error("Backend connection failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <h1 className="text-xl font-bold mb-10 text-indigo-400">Inventory Pro</h1>
        <nav className="space-y-4">
          <div className="bg-slate-800 p-3 rounded-lg cursor-pointer">📦 Dashboard</div>
          <div className="p-3 hover:bg-slate-800 rounded-lg cursor-pointer transition">👥 Suppliers</div>
          <div className="p-3 hover:bg-slate-800 rounded-lg cursor-pointer transition">📊 Reports</div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800">Inventory Overview</h2>
          <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700">
            + Add New Item
          </button>
        </header>

        {/* DATA TABLE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Product Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Stock Level</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Price</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="4" className="p-10 text-center text-slate-400 italic">Connecting to Java Spring Boot...</td></tr>
              ) : inventory.length === 0 ? (
                <tr><td colSpan="4" className="p-10 text-center text-slate-400">No products found in database.</td></tr>
              ) : (
                inventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700">{item.name}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono">{item.quantity}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">${item.price?.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {item.quantity < 10 ? (
                        <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">Low Stock</span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded-full uppercase">Healthy</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default App;