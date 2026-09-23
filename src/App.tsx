import React, { useState, useEffect } from 'react';
import { Smartphone, LayoutDashboard, Terminal, RefreshCw, Flame, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { Product, Promotion, Reward, Settings, Order, Customer, OrderStatus } from './types';
import { initialSettings, initialProducts, initialPromotions, initialRewards, initialOrders } from './data/initialData';
import { CustomerApp } from './components/CustomerApp';
import { AdminDashboard } from './components/AdminDashboard';
import { GasDeploymentModal } from './components/GasDeploymentModal';

export default function App() {
  const [viewMode, setViewMode] = useState<'customer' | 'admin'>('customer');
  const [isGasModalOpen, setIsGasModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // App Data State
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [promotions, setPromotions] = useState<Promotion[]>(initialPromotions);
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Fetch initial data from server API
  const loadData = async () => {
    try {
      const res = await fetch('/api/initial-data');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.products) setProducts(data.products);
        if (data.promotions) setPromotions(data.promotions);
        if (data.rewards) setRewards(data.rewards);
        if (data.orders) setOrders(data.orders);
        if (data.customers) setCustomers(data.customers);
      }
    } catch (err) {
      console.warn('API fetch failed, falling back to local memory state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // API Action Handlers
  const handlePlaceOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      if (res.ok) {
        const createdOrder = await res.json();
        setOrders((prev) => [createdOrder, ...prev]);
        loadData(); // refresh customers & state
        return createdOrder;
      }
    } catch (err) {
      console.error(err);
    }

    // Fallback local creation
    const newId = `ORD-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();
    const created: Order = { ...orderData, id: newId, createdAt: now, updatedAt: now };
    setOrders((prev) => [created, ...prev]);
    return created;
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o))
    );
    try {
      await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSettings = async (newSettings: Settings) => {
    setSettings(newSettings);
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddProduct = async (prod: Omit<Product, 'id'>) => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prod),
      });
      if (res.ok) {
        const created = await res.json();
        setProducts((prev) => [...prev, created]);
        return;
      }
    } catch (e) {
      console.error(e);
    }
    setProducts((prev) => [...prev, { ...prod, id: `P${Math.floor(100 + Math.random() * 900)}` }]);
  };

  const handleUpdateProduct = async (prod: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === prod.id ? prod : p)));
    try {
      await fetch(`/api/products/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prod),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPromotion = async (promo: Omit<Promotion, 'id'>) => {
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promo),
      });
      if (res.ok) {
        const created = await res.json();
        setPromotions((prev) => [...prev, created]);
        return;
      }
    } catch (e) {
      console.error(e);
    }
    setPromotions((prev) => [...prev, { ...promo, id: `PR${Date.now().toString().slice(-3)}` }]);
  };

  const handleDeletePromotion = async (id: string) => {
    setPromotions((prev) => prev.filter((p) => p.id !== id));
    try {
      await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdatePromotion = async (promo: Promotion) => {
    setPromotions((prev) => prev.map((p) => (p.id === promo.id ? promo : p)));
  };

  const handleAddReward = async (reward: Omit<Reward, 'id'>) => {
    setRewards((prev) => [...prev, { ...reward, id: `RW${Date.now().toString().slice(-3)}` }]);
  };

  const handleUpdateReward = async (reward: Reward) => {
    setRewards((prev) => prev.map((r) => (r.id === reward.id ? reward : r)));
  };

  const handleDeleteReward = async (id: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAdjustCustomerPoints = async (lineUserId: string, delta: number) => {
    setCustomers((prev) =>
      prev.map((c) => (c.lineUserId === lineUserId ? { ...c, points: Math.max(0, c.points + delta) } : c))
    );
    try {
      await fetch(`/api/customers/${lineUserId}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delta }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Global Mode Control Bar */}
      <nav className="bg-slate-900 border-b border-slate-800 p-2.5 sticky top-0 z-50 backdrop-blur-xl bg-opacity-95 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Status */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Flame className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-xs text-white block leading-tight">
                {settings.storeName}
              </span>
              <span className="text-[10px] text-emerald-400 font-medium block">
                ระบบเดลิเวอรี & หลังบ้านครบวงจร
              </span>
            </div>
          </div>

          {/* View Mode Selector Tabs */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setViewMode('customer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'customer'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>📱 หน้าลูกค้า (LINE LIFF)</span>
            </button>

            <button
              onClick={() => setViewMode('admin')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer ${
                viewMode === 'admin'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>🛠️ หลังบ้าน (Admin)</span>
            </button>
          </div>

          {/* Google Apps Script Export Kit Button */}
          <button
            onClick={() => setIsGasModalOpen(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center space-x-1 cursor-pointer"
            title="ดูโค้ด Google Apps Script & คู่มือติดตั้ง"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden md:inline">โค้ด GAS & Deploy</span>
          </button>
        </div>
      </nav>

      {/* Main View Render */}
      {loading ? (
        <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-xs text-slate-400 font-medium">กำลังโหลดข้อมูลระบบเดลิเวอรี...</p>
        </div>
      ) : viewMode === 'customer' ? (
        <CustomerApp
          settings={settings}
          products={products}
          promotions={promotions}
          rewards={rewards}
          orders={orders}
          onPlaceOrder={handlePlaceOrder}
        />
      ) : (
        <AdminDashboard
          settings={settings}
          products={products}
          promotions={promotions}
          rewards={rewards}
          orders={orders}
          customers={customers}
          onUpdateSettings={handleUpdateSettings}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onAddProduct={handleAddProduct}
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct}
          onAddPromotion={handleAddPromotion}
          onUpdatePromotion={handleUpdatePromotion}
          onDeletePromotion={handleDeletePromotion}
          onAddReward={handleAddReward}
          onUpdateReward={handleUpdateReward}
          onDeleteReward={handleDeleteReward}
          onAdjustCustomerPoints={handleAdjustCustomerPoints}
        />
      )}

      {/* Google Apps Script Export & Deployment Modal */}
      <GasDeploymentModal
        isOpen={isGasModalOpen}
        onClose={() => setIsGasModalOpen(false)}
      />
    </div>
  );
}
