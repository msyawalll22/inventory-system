import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Inventory from './assets/pages/Inventory.jsx';
import Purchases from './assets/pages/Purchases.jsx';
import Sales from './assets/pages/Sales.jsx';
import Dashboard from './assets/pages/Dashboard.jsx';
import Transactions from './assets/pages/Transactions.jsx';
import Pos from './assets/pages/Pos.jsx'; 
import Suppliers from './assets/pages/Supplier.jsx';
import Auth from './assets/pages/Auth.jsx';
import Users from './assets/pages/Users.jsx';

function App() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Load user from localStorage
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // FIX: Determine initial view based on role instead of hardcoded 'inventory'
  const [currentView, setCurrentView] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // Logic: Admin -> dashboard, Staff -> pos
      return parsedUser.role === 'ADMIN' ? 'dashboard' : 'pos';
    }
    return 'inventory'; // Fallback
  });

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/products');
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      console.error("Fetch failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchInventory();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard inventory={inventory} refreshData={fetchInventory} />;
      case 'inventory': return <Inventory inventory={inventory} refreshData={fetchInventory} loading={loading} />;
      case 'transactions': return <Transactions />;
      case 'pos': return <Pos products={inventory} refreshData={fetchInventory} />;
      case 'suppliers': return <Suppliers />;
      case 'purchases': return <Purchases products={inventory} refreshData={fetchInventory} />;
      case 'sales': return <Sales products={inventory} refreshData={fetchInventory} />;
      case 'users': 
        return user.role === 'ADMIN' ? <Users /> : <Inventory inventory={inventory} />;
      default: 
        // Default landing after login if something goes wrong
        return user.role === 'ADMIN' ? 
          <Dashboard inventory={inventory} refreshData={fetchInventory} /> : 
          <Pos products={inventory} refreshData={fetchInventory} />;
    }
  };

  if (!user) {
    return <Auth onLoginSuccess={(userData) => {
      setUser(userData);
      // Also update view immediately upon login
      setCurrentView(userData.role === 'ADMIN' ? 'dashboard' : 'pos');
    }} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        inventory={inventory}
        user={user} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 pt-8 flex justify-between items-center no-print">
           <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
             System / {currentView}
           </span>
           <div className="text-right">
             <p className="text-xs font-bold text-slate-900">{user.username}</p>
             <p className="text-[10px] text-slate-400 font-mono uppercase">{user.role}</p>
           </div>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}

export default App;