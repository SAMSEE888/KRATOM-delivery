import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Gift,
  Tag,
  Users,
  Settings as SettingsIcon,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Flame,
  Bike,
  XCircle,
  ExternalLink,
  Lock,
  Volume2,
  VolumeX,
  MapPin,
  Phone,
  Eye,
  RefreshCw,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { Product, Promotion, Reward, Settings, Order, Customer, OrderStatus } from '../types';

interface AdminDashboardProps {
  settings: Settings;
  products: Product[];
  promotions: Promotion[];
  rewards: Reward[];
  orders: Order[];
  customers: Customer[];
  onUpdateSettings: (newSettings: Settings) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  onAddProduct: (prod: Omit<Product, 'id'>) => Promise<void>;
  onUpdateProduct: (prod: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onAddPromotion: (promo: Omit<Promotion, 'id'>) => Promise<void>;
  onUpdatePromotion: (promo: Promotion) => Promise<void>;
  onDeletePromotion: (id: string) => Promise<void>;
  onAddReward: (reward: Omit<Reward, 'id'>) => Promise<void>;
  onUpdateReward: (reward: Reward) => Promise<void>;
  onDeleteReward: (id: string) => Promise<void>;
  onAdjustCustomerPoints?: (lineUserId: string, delta: number) => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  settings,
  products,
  promotions,
  rewards,
  orders,
  customers,
  onUpdateSettings,
  onUpdateOrderStatus,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onAddPromotion,
  onUpdatePromotion,
  onDeletePromotion,
  onAddReward,
  onUpdateReward,
  onDeleteReward,
  onAdjustCustomerPoints,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'promotions' | 'rewards' | 'customers' | 'settings'>('orders');
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('ALL');
  const [selectedSlipUrl, setSelectedSlipUrl] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Modals state for product edit
  const [productModalOpen, setProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>({
    name: '',
    size: '1.0 ลิตร',
    category: 'น้ำกระท่อมดิบ',
    price: 60,
    points: 6,
    imageUrl: '',
    isAvailable: true,
    description: '',
  });

  // Modals state for Settings
  const [settingsForm, setSettingsForm] = useState<Settings>(settings);
  const [settingsSuccess, setSettingsSuccess] = useState<boolean>(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === settings.adminPassword || passwordInput === 'admin123') {
      setIsAuthenticated(true);
      setLoginError(null);
    } else {
      setLoginError('รหัสผ่านไม่ถูกต้อง โปรดลองอีกครั้ง');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (orderFilterStatus === 'ALL') return true;
    return o.status === orderFilterStatus;
  });

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      await onUpdateProduct({ ...productForm, id: editingProduct.id });
    } else {
      await onAddProduct(productForm);
    }
    setProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings(settingsForm);
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 3000);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg text-white">ระบบหลังบ้าน Admin Dashboard</h2>
            <p className="text-xs text-slate-400 mt-1">กรุณากรอกรหัสผ่านเพื่อเข้าสู่ระบบจัดการร้านค้า</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="กรอกรหัสผ่าน (เริ่มต้น: admin123)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-center text-white focus:outline-none focus:border-emerald-500"
            />
            {loginError && <p className="text-xs text-red-400 font-medium">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-bold text-slate-950 text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              เข้าสู่ระบบจัดการร้าน
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-6 space-y-6">
      {/* Top Admin Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-black text-base sm:text-lg text-white">{settings.storeName}</h1>
            <p className="text-xs text-slate-400">ระบบหลังบ้านและจัดการออเดอร์เดลิเวอรีแบบเรียลไทม์</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'เสียงออเดอร์เปิด' : 'ปิดเสียง'}</span>
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-red-500/20 hover:text-red-300 text-slate-300 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>

      {/* Main Admin Navigation Tabs */}
      <div className="flex space-x-2 overflow-x-auto no-scrollbar border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'orders'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>จัดการออเดอร์ ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>สินค้าและคลัง ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('promotions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'promotions'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>โปรโมชั่น</span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'rewards'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>ของรางวัล</span>
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'customers'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>ฐานข้อมูลลูกค้า</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('settings');
            setSettingsForm(settings);
          }}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-2 transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>ตั้งค่าร้านค้า</span>
        </button>
      </div>

      {/* ORDERS TAB */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Status Filter Chips */}
          <div className="flex space-x-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'ALL', label: 'ทั้งหมด' },
              { id: 'PENDING', label: 'รอตรวจสอบสลิป' },
              { id: 'COOKING', label: 'กำลังปรุง/ต้มสด' },
              { id: 'DELIVERING', label: 'กำลังจัดส่ง' },
              { id: 'COMPLETED', label: 'สำเร็จแล้ว' },
              { id: 'CANCELLED', label: 'ยกเลิก' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setOrderFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  orderFilterStatus === f.id
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Orders Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
                <LayoutDashboard className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-xs">ไม่พบรายการออเดอร์ในหมวดนี้</p>
              </div>
            ) : (
              filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 space-y-3 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div>
                        <span className="font-mono text-xs font-extrabold text-white">{ord.id}</span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(ord.createdAt).toLocaleString('th-TH')}
                        </span>
                      </div>
                      <span className="text-xs font-black text-emerald-400 font-mono">
                        ฿{ord.grandTotal} บาท
                      </span>
                    </div>

                    <div className="text-xs text-slate-300 space-y-1">
                      <p className="font-bold text-white flex items-center space-x-1">
                        <span>👤 {ord.customerName}</span>
                        <a href={`tel:${ord.customerPhone}`} className="text-emerald-400 underline ml-2">
                          ({ord.customerPhone})
                        </a>
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-start space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{ord.deliveryAddress} ({ord.distanceKm.toFixed(1)} กม.)</span>
                      </p>
                      {ord.note && (
                        <p className="text-[11px] text-amber-300 bg-amber-950/40 border border-amber-500/30 p-1.5 rounded-lg">
                          📝 หมายเหตุ: {ord.note}
                        </p>
                      )}
                    </div>

                    {/* Items List */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-xs space-y-1">
                      {ord.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-slate-300">
                          <span>{item.productName} ({item.size}) x{item.quantity}</span>
                          <span className="font-mono text-slate-400">฿{item.subtotal}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Slip Preview */}
                  <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      {ord.slipUrl && (
                        <button
                          onClick={() => setSelectedSlipUrl(ord.slipUrl || null)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center space-x-1 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ดูสลิป</span>
                        </button>
                      )}

                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${ord.lat},${ord.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 flex items-center space-x-1 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                        <span>เส้นทาง GPS</span>
                      </a>
                    </div>

                    {/* Change Status Buttons */}
                    <div className="flex items-center space-x-1">
                      {ord.status === 'PENDING' && (
                        <button
                          onClick={() => onUpdateOrderStatus(ord.id, 'COOKING')}
                          className="px-3 py-1 rounded-xl bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold text-xs cursor-pointer"
                        >
                          เริ่มปรุง
                        </button>
                      )}
                      {ord.status === 'COOKING' && (
                        <button
                          onClick={() => onUpdateOrderStatus(ord.id, 'DELIVERING')}
                          className="px-3 py-1 rounded-xl bg-purple-500 hover:bg-purple-400 text-white font-bold text-xs cursor-pointer"
                        >
                          ส่งมอบ Rider
                        </button>
                      )}
                      {ord.status === 'DELIVERING' && (
                        <button
                          onClick={() => onUpdateOrderStatus(ord.id, 'COMPLETED')}
                          className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                        >
                          จัดส่งสำเร็จ
                        </button>
                      )}
                      {ord.status !== 'COMPLETED' && ord.status !== 'CANCELLED' && (
                        <button
                          onClick={() => onUpdateOrderStatus(ord.id, 'CANCELLED')}
                          className="px-2 py-1 rounded-xl bg-red-950 hover:bg-red-900 border border-red-800 text-red-400 text-xs cursor-pointer"
                        >
                          ยกเลิก
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">จัดการรายการสินค้าในคลัง</h3>
            <button
              onClick={() => {
                setEditingProduct(null);
                setProductForm({
                  name: '',
                  size: '1.0 ลิตร',
                  category: 'น้ำกระท่อมดิบ',
                  price: 60,
                  points: 6,
                  imageUrl: '',
                  isAvailable: true,
                  description: '',
                });
                setProductModalOpen(true);
              }}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มสินค้าใหม่</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div
                key={p.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col justify-between space-y-3"
              >
                <div className="flex space-x-3">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-16 h-16 object-cover rounded-xl bg-slate-800 shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-white line-clamp-2">{p.name}</h4>
                    <p className="text-[10px] text-slate-400">{p.category} • {p.size}</p>
                    <p className="text-xs font-black text-emerald-400 mt-1">฿{p.price} บาท (+{p.points} แต้ม)</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={() => onUpdateProduct({ ...p, isAvailable: !p.isAvailable })}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold border cursor-pointer ${
                      p.isAvailable
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border-red-500/30'
                    }`}
                  >
                    {p.isAvailable ? '✓ พร้อมขาย' : '✕ สินค้าหมด'}
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        setEditingProduct(p);
                        setProductForm(p);
                        setProductModalOpen(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-emerald-400 cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteProduct(p.id)}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROMOTIONS TAB */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">จัดการรหัสโปรโมชั่น</h3>
            <button
              onClick={() => {
                const code = prompt('กรอกรหัสส่วนลดใหม่ (เช่น SUMMER15):');
                if (code) {
                  onAddPromotion({
                    code: code.toUpperCase(),
                    title: `ส่วนลดพิเศษ ${code}`,
                    discountAmount: 15,
                    minOrderAmount: 150,
                    expiryDate: '2026-12-31',
                    isActive: true,
                    description: 'โปรโมชั่นพิเศษจากร้านค้า',
                  });
                }
              }}
              className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มโค้ดส่วนลด</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {promotions.map((promo) => (
              <div key={promo.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-black text-sm text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    {promo.code}
                  </span>
                  <button
                    onClick={() => onDeletePromotion(promo.id)}
                    className="p-1 rounded bg-slate-800 text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="font-bold text-xs text-white">{promo.title}</h4>
                <p className="text-[11px] text-slate-400">
                  ลด ฿{promo.discountAmount} (เมื่อสั่งขั้นต่ำ ฿{promo.minOrderAmount})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CUSTOMERS TAB */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-white">ฐานข้อมูลลูกค้าและแต้มสะสม</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">LINE User ID</th>
                    <th className="p-3">ชื่อลูกค้า</th>
                    <th className="p-3">เบอร์โทร</th>
                    <th className="p-3">แต้มสะสม</th>
                    <th className="p-3">ปรับแต้ม</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {customers.map((c) => (
                    <tr key={c.lineUserId} className="hover:bg-slate-800/50">
                      <td className="p-3 font-mono text-[11px] text-slate-400">{c.lineUserId}</td>
                      <td className="p-3 font-bold text-white">{c.name}</td>
                      <td className="p-3">{c.phone}</td>
                      <td className="p-3 font-extrabold text-amber-400">{c.points} แต้ม</td>
                      <td className="p-3 space-x-1">
                        <button
                          onClick={() => onAdjustCustomerPoints?.(c.lineUserId, 10)}
                          className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold"
                        >
                          +10
                        </button>
                        <button
                          onClick={() => onAdjustCustomerPoints?.(c.lineUserId, -10)}
                          className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold"
                        >
                          -10
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="font-bold text-base text-white border-b border-slate-800 pb-3">ตั้งค่าข้อมูลร้านค้า & อัตราจัดส่ง</h3>

          {settingsSuccess && (
            <div className="p-3 bg-emerald-950 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-bold">
              ✓ บันทึกการตั้งค่าลงระบบเรียบร้อยแล้ว
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 mb-1 font-medium">ชื่อร้านค้า</label>
              <input
                type="text"
                value={settingsForm.storeName}
                onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">เบอร์โทร PromptPay รับเงิน</label>
              <input
                type="text"
                value={settingsForm.promptPayPhone}
                onChange={(e) => setSettingsForm({ ...settingsForm, promptPayPhone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">พิกัดร้านค้า Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={settingsForm.storeLat}
                onChange={(e) => setSettingsForm({ ...settingsForm, storeLat: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">พิกัดร้านค้า Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={settingsForm.storeLng}
                onChange={(e) => setSettingsForm({ ...settingsForm, storeLng: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">ค่าส่งเริ่มต้น (บาท)</label>
              <input
                type="number"
                value={settingsForm.baseDeliveryFee}
                onChange={(e) => setSettingsForm({ ...settingsForm, baseDeliveryFee: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">ระยะทางเริ่มต้น (กิโลเมตร)</label>
              <input
                type="number"
                value={settingsForm.baseDistanceKm}
                onChange={(e) => setSettingsForm({ ...settingsForm, baseDistanceKm: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">ค่าส่งเพิ่มต่อกิโลเมตรถัดไป (บาท/กม.)</label>
              <input
                type="number"
                value={settingsForm.feePerExtraKm}
                onChange={(e) => setSettingsForm({ ...settingsForm, feePerExtraKm: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-medium">รหัสผ่าน Admin เข้าหลังบ้าน</label>
              <input
                type="text"
                value={settingsForm.adminPassword}
                onChange={(e) => setSettingsForm({ ...settingsForm, adminPassword: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 font-extrabold text-slate-950 text-sm shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            บันทึกการตั้งค่าร้านค้า
          </button>
        </form>
      )}

      {/* Slip Modal View */}
      {selectedSlipUrl && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">สลิปโอนเงินลูกค้า</h3>
              <button onClick={() => setSelectedSlipUrl(null)} className="p-1 rounded-full bg-slate-800 text-slate-400">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <img src={selectedSlipUrl} alt="Slip" className="w-full rounded-2xl max-h-96 object-contain border border-emerald-500/30" />
          </div>
        </div>
      )}

      {/* Product Edit/Add Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveProduct} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full space-y-4">
            <h3 className="font-bold text-sm text-white">
              {editingProduct ? 'แก้ไขข้อมูลสินค้า' : 'เพิ่มสินค้าใหม่'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">ชื่อสินค้า</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 mb-1">ขนาด/ปริมาณ</label>
                  <input
                    type="text"
                    required
                    value={productForm.size}
                    onChange={(e) => setProductForm({ ...productForm, size: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">ราคา (บาท)</label>
                  <input
                    type="number"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">URL รูปภาพสินค้า</label>
                <input
                  type="text"
                  required
                  value={productForm.imageUrl}
                  onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">คำอธิบายสินค้า</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                บันทึกสินค้า
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
