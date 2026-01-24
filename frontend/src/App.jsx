import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Inventory from './assets/pages/Inventory.jsx';
import Purchases from './assets/pages/Purchases.jsx';
import Sales from './assets/pages/Sales.jsx';
import Dashboard from './assets/pages/Dashboard.jsx';
import Transactions from './assets/pages/Transactions.jsx';
import Pos from './assets/pages/Pos.jsx'; // Make sure the path is correct
import Suppliers from './assets/pages/Supplier.jsx';

function App() {
  const [currentView, setCurrentView] = useState('inventory');
  const [inventory, setInventory] = useState([]); // Global Inventory State
  const [loading, setLoading] = useState(true);

  // Define the refresh function here
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
    fetchInventory();
  }, []);

  const renderContent = () => {
    switch (currentView) {
// Inside App.jsx switch statement
case 'dashboard':
  return <Dashboard inventory={inventory} refreshData={fetchInventory} />;
      case 'inventory':
        return <Inventory 
                  inventory={inventory} 
                  refreshData={fetchInventory} 
                  loading={loading} 
               />;
               case 'transactions':
  return <Transactions />;
  case 'pos': // 2. Added POS Case for the Cashier
        return <Pos 
                  products={inventory} 
                  refreshData={fetchInventory} 
               />;
               case 'suppliers':
  return <Suppliers />;
      case 'purchases':
        return <Purchases 
                  products={inventory} // Share the same product list
                  refreshData={fetchInventory} // Pass the refresh trigger
               />;
      case 'sales':
        return <Sales products={inventory} refreshData={fetchInventory} />;
      default:
        return <Inventory inventory={inventory} refreshData={fetchInventory} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>
    </div>
  );

return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Updated Sidebar call to include inventory prop */}
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        inventory={inventory} 
      />

      <main className="flex-1 overflow-y-auto">
        <div className="px-8 pt-8">
           <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
             System / {currentView}
           </span>
        </div>
        {renderContent()}
      </main>
    </div>
  );



}

export default App;