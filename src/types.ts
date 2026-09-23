export interface Settings {
  storeName: string;
  promptPayPhone: string;
  storeLat: number;
  storeLng: number;
  baseDeliveryFee: number;
  baseDistanceKm: number;
  feePerExtraKm: number;
  adminPassword: string;
  lineNotifyToken?: string;
  storeAddress: string;
  contactPhone: string;
  openHours: string;
}

export interface Product {
  id: string;
  name: string;
  size: string; // e.g. "1 ลิตร", "1.5 ลิตร", "500 กรัม"
  category: 'น้ำกระท่อมดิบ' | 'สูตรพิเศษ/ผสม' | 'ใบกระท่อมดิบ' | 'ชุดพร้อมต้ม';
  price: number;
  points: number;
  imageUrl: string;
  isAvailable: boolean;
  description: string;
}

export interface Promotion {
  id: string;
  code: string;
  title: string;
  discountAmount: number;
  minOrderAmount: number;
  expiryDate: string;
  isActive: boolean;
  description: string;
}

export interface Reward {
  id: string;
  title: string;
  pointsRequired: number;
  imageUrl: string;
  isAvailable: boolean;
  description: string;
}

export interface Customer {
  lineUserId: string;
  name: string;
  phone: string;
  points: number;
  totalOrdersCount: number;
  totalSpent: number;
  lastOrderDate?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  size: string;
  price: number;
  quantity: number;
  subtotal: number;
  points: number;
}

export type OrderStatus = 'PENDING' | 'COOKING' | 'DELIVERING' | 'COMPLETED' | 'CANCELLED';

export interface Order {
  id: string;
  lineUserId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  lat: number;
  lng: number;
  distanceKm: number;
  items: OrderItem[];
  itemsTotal: number;
  shippingFee: number;
  discountAmount: number;
  promoCodeApplied?: string;
  grandTotal: number;
  totalPointsEarned: number;
  slipUrl?: string; // Base64 or URL
  status: OrderStatus;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationCoordinates {
  lat: number;
  lng: number;
  addressName?: string;
}
