import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Minus,
  Sparkles,
  MapPin,
  Clock,
  Phone,
  Gift,
  CheckCircle2,
  Upload,
  ArrowRight,
  ChevronRight,
  Tag,
  Search,
  X,
  RotateCcw,
  Bike,
  Flame,
  CheckCircle,
  Truck,
  PackageCheck,
  AlertCircle
} from 'lucide-react';
import { Product, Promotion, Reward, Settings, Order, OrderItem } from '../types';
import { PinMap } from './PinMap';
import { PromptPayQR } from './PromptPayQR';

interface CustomerAppProps {
  settings: Settings;
  products: Product[];
  promotions: Promotion[];
  rewards: Reward[];
  orders: Order[];
  onPlaceOrder: (newOrder: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Order>;
}

export const CustomerApp: React.FC<CustomerAppProps> = ({
  settings,
  products,
  promotions,
  rewards,
  orders,
  onPlaceOrder,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'rewards' | 'history'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart State: productId -> quantity
  const [cart, setCart] = useState<{ [productId: string]: number }>({});
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);

  // Customer Info State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [lat, setLat] = useState<number>(settings.storeLat + 0.01);
  const [lng, setLng] = useState<number>(settings.storeLng + 0.01);
  const [distanceKm, setDistanceKm] = useState<number>(1.2);
  const [shippingFee, setShippingFee] = useState<number>(settings.baseDeliveryFee);
  
  // Promo & Payment
  const [promoCode, setPromoCode] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<Promotion | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [orderNote, setOrderNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<Order | null>(null);

  // Mocked LINE User ID & Points
  const lineUserId = 'U_USER_LINE_DEMO';
  
  // Filter products by category and search
  const categories = ['ทั้งหมด', 'น้ำกระท่อมดิบ', 'สูตรพิเศษ/ผสม', 'ใบกระท่อมดิบ', 'ชุดพร้อมต้ม'];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart Calculations
  const cartItems: OrderItem[] = useMemo(() => {
    const items: OrderItem[] = [];
    Object.entries(cart).forEach(([pId, rawQty]) => {
      const qty = Number(rawQty) || 0;
      if (qty > 0) {
        const prod = products.find((p) => p.id === pId);
        if (prod) {
          items.push({
            productId: prod.id,
            productName: prod.name,
            size: prod.size,
            price: prod.price,
            quantity: qty,
            subtotal: prod.price * qty,
            points: prod.points * qty,
          });
        }
      }
    });
    return items;
  }, [cart, products]);

  const itemsTotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.subtotal, 0), [cartItems]);
  const totalPointsEarned = useMemo(() => cartItems.reduce((sum, item) => sum + item.points, 0), [cartItems]);
  const totalItemCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  // Discount calculation
  const discountAmount = useMemo(() => {
    if (!appliedPromo) return 0;
    if (itemsTotal < appliedPromo.minOrderAmount) return 0;
    return appliedPromo.discountAmount;
  }, [appliedPromo, itemsTotal]);

  const grandTotal = useMemo(() => {
    return Math.max(0, itemsTotal + shippingFee - discountAmount);
  }, [itemsTotal, shippingFee, discountAmount]);

  // Total Customer Points from completed orders
  const customerTotalPoints = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalPointsEarned, 0);
  }, [orders]);

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  };

  const handleApplyPromo = () => {
    setPromoError(null);
    if (!promoCode.trim()) {
      setAppliedPromo(null);
      return;
    }
    const found = promotions.find(
      (p) => p.code.toUpperCase() === promoCode.trim().toUpperCase() && p.isActive
    );
    if (!found) {
      setPromoError('รหัสส่วนลดไม่ถูกต้องหรือหมดอายุ');
      setAppliedPromo(null);
      return;
    }
    if (itemsTotal < found.minOrderAmount) {
      setPromoError(`ต้องสั่งซื้อสินค้าขั้นต่ำ ${found.minOrderAmount} บาทเพื่อใช้โค้ดนี้`);
      setAppliedPromo(null);
      return;
    }
    setAppliedPromo(found);
  };

  const handleSlipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLocationSelect = (newLat: number, newLng: number, address: string, distance: number, fee: number) => {
    setLat(newLat);
    setLng(newLng);
    setDeliveryAddress(address);
    setDistanceKm(distance);
    setShippingFee(fee);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('กรุณากรอกชื่อและเบอร์โทรศัพท์สำหรับจัดส่ง');
      return;
    }
    if (!deliveryAddress.trim()) {
      alert('กรุณาระบุที่อยู่และปักหมุดตำแหน่งจัดส่ง');
      return;
    }
    if (!slipImage) {
      alert('กรุณาอัปโหลดสลิปหลักฐานการโอนเงินก่อนกดสั่งซื้อ');
      return;
    }

    setIsSubmitting(true);
    try {
      const newOrderData = {
        lineUserId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        deliveryAddress: deliveryAddress.trim(),
        lat,
        lng,
        distanceKm,
        items: cartItems,
        itemsTotal,
        shippingFee,
        discountAmount,
        promoCodeApplied: appliedPromo?.code,
        grandTotal,
        totalPointsEarned,
        slipUrl: slipImage,
        status: 'PENDING' as const,
        note: orderNote.trim(),
      };

      const placedOrder = await onPlaceOrder(newOrderData);
      setCart({});
      setIsCheckoutOpen(false);
      setIsCartOpen(false);
      setSlipImage(null);
      setOrderNote('');
      setActiveTrackingOrder(placedOrder);
      setActiveTab('history');
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ โปรดลองอีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-slate-100 flex flex-col relative pb-28 border-x border-slate-800 shadow-2xl">
      {/* Top Header & Store Banner */}
      <header className="bg-gradient-to-b from-slate-900 to-slate-950 p-4 sticky top-0 z-30 border-b border-slate-800 backdrop-blur-lg bg-opacity-95">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <h1 className="font-extrabold text-sm text-white leading-tight">{settings.storeName}</h1>
              <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>เปิดบริการ {settings.openHours}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <a
              href={`tel:${settings.contactPhone}`}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-all"
              title="โทรติดต่อร้านค้า"
            >
              <Phone className="w-4 h-4" />
            </a>
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-2.5 py-1 text-right">
              <span className="text-[9px] text-slate-400 block leading-tight">แต้มสะสม</span>
              <span className="text-xs font-black text-emerald-400 flex items-center justify-end space-x-0.5">
                <Sparkles className="w-3 h-3 text-amber-400 mr-0.5" />
                {customerTotalPoints}
              </span>
            </div>
          </div>
        </div>

        {/* Promo Code Marquee / Badge */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="truncate">ใช้โค้ด <strong className="text-white underline">GREEN10</strong> ลด 10 บาท</span>
          </div>
          <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full font-bold shrink-0">
            โปรเด็ด!
          </span>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/80 px-2 pt-1 sticky top-[81px] z-20 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'catalog'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>เมนูสินค้า</span>
        </button>

        <button
          onClick={() => setActiveTab('rewards')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
            activeTab === 'rewards'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>แลกของรางวัล</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center space-x-1.5 relative cursor-pointer ${
            activeTab === 'history'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10 rounded-t-xl'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>ติดตามออเดอร์</span>
          {orders.filter((o) => o.status !== 'COMPLETED' && o.status !== 'CANCELLED').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-2 right-2" />
          )}
        </button>
      </div>

      {/* Main Tab Content */}
      <main className="p-4 space-y-5 flex-1">
        {activeTab === 'catalog' && (
          <>
            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาน้ำกระท่อมดิบ ใบกระท่อม หรือสูตรผสม..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product List Grid */}
            <div className="space-y-3">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-slate-500 space-y-2">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-xs">ไม่พบรายการสินค้าที่ค้นหา</p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const qtyInCart = cart[product.id] || 0;
                  return (
                    <div
                      key={product.id}
                      className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-2xl p-3 flex space-x-3 transition-all shadow-lg"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded-xl bg-slate-800"
                        />
                        <span className="absolute top-1.5 left-1.5 bg-slate-950/90 text-emerald-400 border border-emerald-500/40 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md">
                          +{product.points} แต้ม
                        </span>
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between space-x-1">
                            <h3 className="font-bold text-xs text-white line-clamp-2">{product.name}</h3>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{product.description}</p>
                          <span className="inline-block mt-1 bg-slate-800 text-slate-300 text-[10px] font-medium px-2 py-0.5 rounded-md">
                            ขนาด: {product.size}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mt-2">
                          <span className="text-emerald-400 font-extrabold text-sm">
                            ฿{product.price} <span className="text-[10px] text-slate-400 font-normal">บาท</span>
                          </span>

                          {/* Quick Quantity Buttons (+ / -) */}
                          {qtyInCart > 0 ? (
                            <div className="flex items-center bg-slate-950 border border-emerald-500/50 rounded-xl p-0.5 space-x-2">
                              <button
                                onClick={() => handleUpdateQuantity(product.id, -1)}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-bold text-xs text-white min-w-[16px] text-center">
                                {qtyInCart}
                              </span>
                              <button
                                onClick={() => handleUpdateQuantity(product.id, 1)}
                                className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleUpdateQuantity(product.id, 1)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1 transition-all active:scale-95 shadow-md shadow-emerald-500/20 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>เพิ่ม</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-4 rounded-2xl border border-emerald-500/30 text-center space-y-1">
              <Sparkles className="w-7 h-7 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300">แต้มสะสมทั้งหมดของคุณ</p>
              <p className="text-2xl font-black text-emerald-400">{customerTotalPoints} แต้ม</p>
              <p className="text-[10px] text-slate-400">ทุกการสั่งซื้อครบ 10 บาท รับสะสม 1 แต้มฟรี!</p>
            </div>

            <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider">รายการของรางวัลที่สามารถแลกได้</h3>
            <div className="space-y-3">
              {rewards.map((reward) => {
                const canRedeem = customerTotalPoints >= reward.pointsRequired;
                return (
                  <div
                    key={reward.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex space-x-3 items-center"
                  >
                    <img
                      src={reward.imageUrl}
                      alt={reward.title}
                      className="w-16 h-16 object-cover rounded-xl shrink-0"
                    />
                    <div className="flex-1">
                      <h4 className="font-bold text-xs text-white">{reward.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{reward.description}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-amber-400 font-bold text-xs flex items-center">
                          <Sparkles className="w-3.5 h-3.5 mr-1" />
                          {reward.pointsRequired} แต้ม
                        </span>
                        <button
                          disabled={!canRedeem}
                          onClick={() => alert(`คุณใช้ ${reward.pointsRequired} แต้มแลก "${reward.title}" เรียบร้อยแล้ว! ร้านค้าจะจัดส่งพร้อมออเดอร์ถัดไป`)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            canRedeem
                              ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          {canRedeem ? 'กดแลกเลย' : 'แต้มไม่พอ'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order History & Real-time Tracking Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider">ติดตามสถานะออเดอร์</h3>
            {orders.length === 0 ? (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Bike className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-xs">ยังไม่มีประวัติการสั่งซื้อ</p>
              </div>
            ) : (
              orders.map((ord) => {
                const statusMap = {
                  PENDING: { label: 'รอตรวจสอบสลิป', color: 'bg-amber-500/20 text-amber-400 border-amber-500/40', icon: Clock },
                  COOKING: { label: 'กำลังปรุง/ต้มสด', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40', icon: Flame },
                  DELIVERING: { label: 'กำลังจัดส่ง (Rider)', color: 'bg-purple-500/20 text-purple-400 border-purple-500/40', icon: Bike },
                  COMPLETED: { label: 'จัดส่งสำเร็จแล้ว', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', icon: CheckCircle },
                  CANCELLED: { label: 'ยกเลิกออเดอร์', color: 'bg-red-500/20 text-red-400 border-red-500/40', icon: X },
                };
                const currentStatus = statusMap[ord.status];
                const StatusIcon = currentStatus.icon;

                return (
                  <div
                    key={ord.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                      <div>
                        <span className="font-mono text-xs font-bold text-white block">{ord.id}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(ord.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center space-x-1 ${currentStatus.color}`}>
                        <StatusIcon className="w-3.5 h-3.5 mr-1" />
                        {currentStatus.label}
                      </span>
                    </div>

                    {/* Timeline Animation Step Tracker */}
                    {ord.status !== 'CANCELLED' && (
                      <div className="py-2">
                        <div className="grid grid-cols-4 gap-1 text-center text-[9px] relative">
                          <div className={`p-1.5 rounded-lg border ${ord.status === 'PENDING' ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                            1. รอยืนยัน
                          </div>
                          <div className={`p-1.5 rounded-lg border ${ord.status === 'COOKING' ? 'bg-blue-500/20 border-blue-400 text-blue-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                            2. กำลังปรุง
                          </div>
                          <div className={`p-1.5 rounded-lg border ${ord.status === 'DELIVERING' ? 'bg-purple-500/20 border-purple-400 text-purple-300 font-bold animate-pulse' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                            3. กำลังส่ง
                          </div>
                          <div className={`p-1.5 rounded-lg border ${ord.status === 'COMPLETED' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                            4. สำเร็จ
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Items Summary */}
                    <div className="space-y-1 text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                      {ord.items.map((item, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <span>
                            {item.productName} ({item.size}) x{item.quantity}
                          </span>
                          <span className="font-mono text-slate-200">฿{item.subtotal}</span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between font-bold text-emerald-400 text-xs">
                        <span>ยอดรวมสุทธิ (รวมค่าส่ง ฿{ord.shippingFee})</span>
                        <span className="text-sm font-black">฿{ord.grandTotal}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {totalItemCount > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-slate-950/90 border-t border-slate-800 backdrop-blur-xl z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-between shadow-xl shadow-emerald-500/25 transition-all active:scale-[0.99] cursor-pointer"
          >
            <div className="flex items-center space-x-2">
              <span className="bg-slate-950 text-emerald-400 px-2.5 py-0.5 rounded-full text-xs font-black">
                {totalItemCount} รายการ
              </span>
              <span className="text-sm">ดูตะกร้าสินค้า</span>
            </div>
            <div className="flex items-center space-x-1 text-base">
              <span>฿{itemsTotal}</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* Cart Modal / Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex flex-col justify-end max-w-md mx-auto">
          <div className="bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h2 className="font-bold text-base text-white">ตะกร้าสินค้าของคุณ</h2>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="space-y-3 divide-y divide-slate-800/60">
              {cartItems.map((item) => (
                <div key={item.productId} className="pt-3 first:pt-0 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-white">{item.productName}</h4>
                    <span className="text-[10px] text-slate-400">ขนาด {item.size} • ฿{item.price}/ชิ้น</span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, -1)}
                        className="w-6 h-6 rounded-lg bg-slate-800 text-emerald-400 flex items-center justify-center font-bold"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-xs text-white px-2.5">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, 1)}
                        className="w-6 h-6 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="font-mono font-bold text-xs text-emerald-400 min-w-[50px] text-right">
                      ฿{item.subtotal}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Promo Code Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              <span className="text-xs font-medium text-slate-300 block">กรอกโค้ดส่วนลด:</span>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="เช่น GREEN10"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all cursor-pointer"
                >
                  ใช้โค้ด
                </button>
              </div>
              {appliedPromo && (
                <p className="text-[11px] text-emerald-400 flex items-center">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  ใช้โค้ด {appliedPromo.code}: {appliedPromo.title} (-฿{appliedPromo.discountAmount})
                </p>
              )}
              {promoError && <p className="text-[11px] text-red-400">{promoError}</p>}
            </div>

            {/* Price Summary */}
            <div className="bg-slate-950/80 rounded-xl p-3 space-y-1.5 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>ยอดยอดรวมสินค้า</span>
                <span className="font-mono">฿{itemsTotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>ส่วนลดโปรโมชั่น</span>
                  <span className="font-mono">-฿{discountAmount}</span>
                </div>
              )}
              <div className="flex justify-between text-amber-400">
                <span>แต้มสะสมที่จะได้รับ</span>
                <span className="font-mono font-bold">+{totalPointsEarned} แต้ม</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsCartOpen(false);
                setIsCheckoutOpen(true);
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold py-3.5 rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <span>ดำเนินการปักหมุด & ชำระเงิน</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Checkout Screen Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-950 z-50 overflow-y-auto max-w-md mx-auto flex flex-col">
          <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 flex items-center justify-between">
            <h2 className="font-bold text-base text-white">เช็คเอาท์ & ปักหมุดจัดส่ง</h2>
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitOrder} className="p-4 space-y-5 flex-1 pb-12">
            {/* Customer Details Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-xs text-emerald-400 uppercase tracking-wider">1. ข้อมูลผู้รับสินค้า</h3>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">ชื่อผู้รับ <span className="text-emerald-400">*</span></label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="เช่น คุณสมชาย สายเขียว"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">เบอร์โทรศัพท์มือถือ <span className="text-emerald-400">*</span></label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Map & Location Pinning Component */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-emerald-400 uppercase tracking-wider">2. ปักหมุดตำแหน่งจัดส่ง & ค่าส่ง</h3>
              <PinMap
                storeLat={settings.storeLat}
                storeLng={settings.storeLng}
                baseDeliveryFee={settings.baseDeliveryFee}
                baseDistanceKm={settings.baseDistanceKm}
                feePerExtraKm={settings.feePerExtraKm}
                selectedLat={lat}
                selectedLng={lng}
                selectedAddress={deliveryAddress}
                onLocationSelect={handleLocationSelect}
              />
            </div>

            {/* PromptPay Payment QR Component */}
            <div className="space-y-2">
              <h3 className="font-bold text-xs text-emerald-400 uppercase tracking-wider">3. ชำระเงินผ่าน PromptPay QR</h3>
              <PromptPayQR
                phone={settings.promptPayPhone}
                amount={grandTotal}
                storeName={settings.storeName}
              />
            </div>

            {/* Slip Upload Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="font-bold text-xs text-emerald-400 uppercase tracking-wider">4. อัปโหลดสลิปโอนเงิน <span className="text-emerald-400">*</span></h3>
              <p className="text-[11px] text-slate-400">กรุณาแนบรูปภาพสลิปการโอนเงินเพื่อยืนยันออเดอร์</p>

              <label className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-950/60">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSlipUpload}
                  className="hidden"
                />
                {slipImage ? (
                  <div className="space-y-2">
                    <img
                      src={slipImage}
                      alt="สลิปโอนเงิน"
                      className="max-h-40 rounded-xl mx-auto border border-emerald-500/50"
                    />
                    <span className="text-xs text-emerald-400 font-bold block">✓ แนบสลิปเรียบร้อย (กดเพื่อเปลี่ยนรูป)</span>
                  </div>
                ) : (
                  <div className="space-y-1.5 py-2">
                    <Upload className="w-8 h-8 text-emerald-400 mx-auto" />
                    <span className="text-xs font-bold text-white block">คลิกเพื่อเลือกไฟล์รูปภาพสลิป</span>
                    <span className="text-[10px] text-slate-500 block">รองรับไฟล์ JPG, PNG, WEBP</span>
                  </div>
                )}
              </label>
            </div>

            {/* Note Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">หมายเหตุเพิ่มเติมถึงร้านค้า/ไรเดอร์ (ถ้ามี)</label>
              <input
                type="text"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                placeholder="เช่น ขอแช่เย็นเจี๊ยบๆ / โทรแจ้งก่อนส่ง"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Final Grand Total Summary */}
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/40 rounded-2xl p-4 space-y-2">
              <div className="flex justify-between text-xs text-slate-300">
                <span>ค่าสินค้าทั้งหมด ({totalItemCount} รายการ)</span>
                <span className="font-mono">฿{itemsTotal}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-300">
                <span>ค่าจัดส่ง ({distanceKm.toFixed(1)} กม.)</span>
                <span className="font-mono">฿{shippingFee}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-xs text-emerald-400">
                  <span>ส่วนลดโปรโมชั่น</span>
                  <span className="font-mono">-฿{discountAmount}</span>
                </div>
              )}
              <div className="pt-2 border-t border-emerald-500/30 flex justify-between items-center text-white">
                <span className="font-extrabold text-sm">ยอดรวมสุทธิชำระ</span>
                <span className="font-mono font-black text-xl text-emerald-400">฿{grandTotal}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-black py-4 rounded-2xl text-base shadow-xl shadow-emerald-500/25 transition-all disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>กำลังบันทึกสั่งซื้อ...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>ยืนยันการสั่งซื้อสินค้า</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
