import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initialSettings, initialProducts, initialPromotions, initialRewards, initialOrders } from './src/data/initialData';
import { Product, Promotion, Reward, Settings, Order, Customer } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON request body up to 10MB for slip images
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // In-Memory Database State
  let settings: Settings = { ...initialSettings };
  let products: Product[] = [...initialProducts];
  let promotions: Promotion[] = [...initialPromotions];
  let rewards: Reward[] = [...initialRewards];
  let orders: Order[] = [...initialOrders];
  let customers: Customer[] = [
    {
      lineUserId: 'U987654321',
      name: 'คุณสมชาย สายเขียว',
      phone: '089-111-2233',
      points: 25,
      totalOrdersCount: 1,
      totalSpent: 250,
      lastOrderDate: new Date().toISOString(),
    },
  ];

  // API Routes
  app.get('/api/initial-data', (req, res) => {
    res.json({
      settings,
      products,
      promotions,
      rewards,
      orders,
      customers,
    });
  });

  // Submit Order
  app.post('/api/orders', (req, res) => {
    const body = req.body;
    const newOrderId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: newOrderId,
      lineUserId: body.lineUserId || 'GUEST',
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      deliveryAddress: body.deliveryAddress,
      lat: body.lat,
      lng: body.lng,
      distanceKm: body.distanceKm,
      items: body.items || [],
      itemsTotal: body.itemsTotal,
      shippingFee: body.shippingFee,
      discountAmount: body.discountAmount || 0,
      promoCodeApplied: body.promoCodeApplied,
      grandTotal: body.grandTotal,
      totalPointsEarned: body.totalPointsEarned || 0,
      slipUrl: body.slipUrl,
      status: 'PENDING',
      note: body.note || '',
      createdAt: now,
      updatedAt: now,
    };

    orders.unshift(newOrder);

    // Update Customer Database
    let cust = customers.find((c) => c.lineUserId === newOrder.lineUserId);
    if (cust) {
      cust.points += newOrder.totalPointsEarned;
      cust.totalOrdersCount += 1;
      cust.totalSpent += newOrder.grandTotal;
      cust.lastOrderDate = now;
    } else if (newOrder.lineUserId) {
      customers.push({
        lineUserId: newOrder.lineUserId,
        name: newOrder.customerName,
        phone: newOrder.customerPhone,
        points: newOrder.totalPointsEarned,
        totalOrdersCount: 1,
        totalSpent: newOrder.grandTotal,
        lastOrderDate: now,
      });
    }

    res.status(201).json(newOrder);
  });

  // Update Order Status
  app.patch('/api/orders/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const order = orders.find((o) => o.id === id);
    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }
    order.status = status;
    order.updatedAt = new Date().toISOString();
    res.json(order);
  });

  // Settings Update
  app.put('/api/settings', (req, res) => {
    settings = { ...settings, ...req.body };
    res.json(settings);
  });

  // Product CRUD
  app.post('/api/products', (req, res) => {
    const newProd: Product = {
      id: `P${Math.floor(100 + Math.random() * 900)}`,
      ...req.body,
    };
    products.push(newProd);
    res.status(201).json(newProd);
  });

  app.put('/api/products/:id', (req, res) => {
    const { id } = req.params;
    const idx = products.findIndex((p) => p.id === id);
    if (idx !== -1) {
      products[idx] = { ...products[idx], ...req.body };
      res.json(products[idx]);
    } else {
      res.status(404).json({ error: 'Product not found' });
    }
  });

  app.delete('/api/products/:id', (req, res) => {
    const { id } = req.params;
    products = products.filter((p) => p.id !== id);
    res.json({ success: true });
  });

  // Promotions CRUD
  app.post('/api/promotions', (req, res) => {
    const newPromo: Promotion = {
      id: `PR${Math.floor(10 + Math.random() * 90)}`,
      ...req.body,
    };
    promotions.push(newPromo);
    res.status(201).json(newPromo);
  });

  app.delete('/api/promotions/:id', (req, res) => {
    const { id } = req.params;
    promotions = promotions.filter((p) => p.id !== id);
    res.json({ success: true });
  });

  // Adjust Customer Points
  app.post('/api/customers/:lineUserId/points', (req, res) => {
    const { lineUserId } = req.params;
    const { delta } = req.body;
    const cust = customers.find((c) => c.lineUserId === lineUserId);
    if (cust) {
      cust.points = Math.max(0, cust.points + (delta || 0));
      res.json(cust);
    } else {
      res.status(404).json({ error: 'Customer not found' });
    }
  });

  // Vite Middleware setup for dev vs production static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Kratom Express Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
