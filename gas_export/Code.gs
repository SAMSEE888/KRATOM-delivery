/**
 * ============================================================================
 * ระบบเดลิเวอรีสั่งซื้อน้ำกระท่อมดิบอัตโนมัติและจัดการร้านค้าครบวงจร (สไตล์ LINE Man)
 * Google Apps Script Backend (Code.gs)
 * ============================================================================
 */

// 1. Web App Entry Point: Route to Customer or Admin view based on URL parameter
function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'customer';
  
  if (page === 'admin') {
    var template = HtmlService.createTemplateFromFile('Admin');
    return template.evaluate()
      .setTitle('ระบบจัดการร้านค้า - Admin Dashboard')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } else {
    var template = HtmlService.createTemplateFromFile('Customer');
    return template.evaluate()
      .setTitle('สั่งซื้อน้ำกระท่อมดิบเดลิเวอรี - ร้านน้ำกระท่อมเขียว')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

// Helper to include partial HTML files if needed
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// 2. Database Initialization: Auto Setup Sheets & Initial Sample Data
function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sheet [Settings]
  var settingsSheet = getOrCreateSheet(ss, 'Settings');
  if (settingsSheet.getLastRow() === 0) {
    settingsSheet.appendRow(['Key', 'Value', 'Description']);
    settingsSheet.appendRow(['storeName', 'กระท่อมเขียวเดลิเวอรี (Kratom Green Express)', 'ชื่อร้านค้า']);
    settingsSheet.appendRow(['promptPayPhone', '0812345678', 'เบอร์พร้อมเพย์รับเงิน']);
    settingsSheet.appendRow(['storeLat', '13.7563', 'ละติจูดร้าน']);
    settingsSheet.appendRow(['storeLng', '100.5018', 'ลองจิจูดร้าน']);
    settingsSheet.appendRow(['baseDeliveryFee', '10', 'ค่าส่งเริ่มต้น (บาท)']);
    settingsSheet.appendRow(['baseDistanceKm', '1', 'ระยะทางเริ่มต้น (กิโลเมตร)']);
    settingsSheet.appendRow(['feePerExtraKm', '10', 'ค่าส่งเพิ่มต่อกิโลเมตรถัดไป']);
    settingsSheet.appendRow(['adminPassword', 'admin123', 'รหัสผ่าน Admin']);
    settingsSheet.appendRow(['lineNotifyToken', '', 'LINE Notify Token']);
  }

  // Sheet [Products]
  var productsSheet = getOrCreateSheet(ss, 'Products');
  if (productsSheet.getLastRow() === 0) {
    productsSheet.appendRow(['รหัสสินค้า', 'ชื่อสินค้า', 'ขนาด', 'หมวดหมู่', 'ราคา', 'แต้มสะสม', 'รูปภาพ', 'สถานะ', 'คำอธิบาย']);
    productsSheet.appendRow(['P001', 'น้ำกระท่อมดิบแท้ 100% (ต้มสด)', '1.0 ลิตร', 'น้ำกระท่อมดิบ', 60, 6, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574', 'พร้อมขาย', 'น้ำกระท่อมดิบต้มสดกรอง 3 ชั้น']);
    productsSheet.appendRow(['P002', 'น้ำกระท่อมดิบเข้มข้นพิเศษ', '1.5 ลิตร', 'น้ำกระท่อมดิบ', 90, 9, 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd', 'พร้อมขาย', 'สูตรต้มเข้มข้นพิเศษ หอมสด']);
    productsSheet.appendRow(['P003', 'น้ำกระท่อมผสมชาดำเย็น', '1.0 ลิตร', 'สูตรพิเศษ/ผสม', 70, 7, 'https://images.unsplash.com/photo-155679343-c7306c1976bc', 'พร้อมขาย', 'รสชาดำตรามือหอมหวาน']);
    productsSheet.appendRow(['P004', 'น้ำกระท่อมผสมเก๊กฮวยต้มสด', '1.0 ลิตร', 'สูตรพิเศษ/ผสม', 70, 7, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3', 'พร้อมขาย', 'เก๊กฮวยต้มสด หวานน้อย']);
    productsSheet.appendRow(['P005', 'ใบกระท่อมดิบก้านแดงคัดเกรด A', '500 กรัม', 'ใบกระท่อมดิบ', 150, 15, 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d', 'พร้อมขาย', 'ใบก้านแดงสดจากสวนใต้']);
  }

  // Sheet [Promotions]
  var promoSheet = getOrCreateSheet(ss, 'Promotions');
  if (promoSheet.getLastRow() === 0) {
    promoSheet.appendRow(['รหัสโปรโมชั่น', 'ชื่อโปรโมชั่น', 'ส่วนลดบาท', 'ขั้นต่ำสั่งซื้อ', 'วันหมดอายุ', 'สถานะ']);
    promoSheet.appendRow(['GREEN10', 'ส่วนลดลูกค้าใหม่ 10 บาท', 10, 100, '2026-12-31', 'ใช้งาน']);
    promoSheet.appendRow(['FREESHIP', 'ส่วนลดค่าส่ง 20 บาท', 20, 200, '2026-12-31', 'ใช้งาน']);
  }

  // Sheet [Rewards]
  var rewardSheet = getOrCreateSheet(ss, 'Rewards');
  if (rewardSheet.getLastRow() === 0) {
    rewardSheet.appendRow(['รหัสของรางวัล', 'ชื่อของรางวัล', 'แต้มที่ใช้แลก', 'รูปภาพ', 'สถานะ']);
    rewardSheet.appendRow(['RW01', 'แลกฟรี! น้ำกระท่อมดิบ 1.0 ลิตร 1 ขวด', 50, 'https://images.unsplash.com/photo-1544787219-7f47ccb76574', 'พร้อมแลก']);
    rewardSheet.appendRow(['RW02', 'แลกฟรี! ใบกระท่อมก้านแดง 200 กรัม', 80, 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d', 'พร้อมแลก']);
  }

  // Sheet [Customers]
  var customerSheet = getOrCreateSheet(ss, 'Customers');
  if (customerSheet.getLastRow() === 0) {
    customerSheet.appendRow(['LINE User ID', 'ชื่อลูกค้า', 'เบอร์โทร', 'แต้มสะสมทั้งหมด', 'จำนวนออเดอร์', 'ยอดใช้จ่ายรวม']);
  }

  // Sheet [Orders]
  var orderSheet = getOrCreateSheet(ss, 'Orders');
  if (orderSheet.getLastRow() === 0) {
    orderSheet.appendRow(['รหัสคำสั่งซื้อ', 'LINE User ID', 'ชื่อผู้รับ', 'เบอร์โทร', 'รายการสินค้า JSON', 'ยอดสินค้า', 'ค่าจัดส่ง', 'ส่วนลด', 'ยอดสุทธิ', 'ที่อยู่จัดส่ง', 'Lat', 'Lng', 'ระยะทางกม', 'รูปสลิป', 'สถานะ', 'หมายเหตุ', 'วันที่เวลา']);
  }

  return { success: true, message: 'สร้างฐานข้อมูลเรียบร้อยแล้ว!' };
}

function getOrCreateSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

// 3. Distance & Delivery Fee Calculation (Haversine Formula)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Earth's radius in km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return Math.max(0.1, Math.round(d * 100) / 100);
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// 4. EMVCo PromptPay Payload Generator (Standard Thailand Bank QR)
function generatePromptPayPayload(phone, amount) {
  var formattedPhone = phone.replace(/\D/g, '');
  if (formattedPhone.indexOf('0') === 0) {
    formattedPhone = '0066' + formattedPhone.substring(1);
  }
  
  var payload = '000201' + (amount > 0 ? '010212' : '010211');
  var sub00 = '0016A000000677010111';
  var sub01Len = (formattedPhone.length < 10 ? '0' : '') + formattedPhone.length;
  var sub01 = '01' + sub01Len + formattedPhone;
  var tag29Val = sub00 + sub01;
  var tag29Len = (tag29Val.length < 10 ? '0' : '') + tag29Val.length;
  
  payload += '29' + tag29Len + tag29Val + '5303764';
  
  if (amount > 0) {
    var amtStr = parseFloat(amount).toFixed(2);
    var amtLen = (amtStr.length < 10 ? '0' : '') + amtStr.length;
    payload += '54' + amtLen + amtStr;
  }
  
  payload += '5802TH6304';
  
  var crc = crc16CCITT(payload);
  return payload + crc;
}

function crc16CCITT(data) {
  var crc = 0xffff;
  for (var i = 0; i < data.length; i++) {
    var x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }
  var hex = crc.toString(16).toUpperCase();
  while (hex.length < 4) { hex = '0' + hex; }
  return hex;
}

// 5. Data Fetching API Handlers for Client
function getInitialAppData() {
  setupDatabase(); // Ensure sheets exist
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Settings
  var settingsObj = {};
  var settingsRows = ss.getSheetByName('Settings').getDataRange().getValues();
  for (var i = 1; i < settingsRows.length; i++) {
    var key = settingsRows[i][0];
    var val = settingsRows[i][1];
    if (key) {
      if (['baseDeliveryFee', 'baseDistanceKm', 'feePerExtraKm', 'storeLat', 'storeLng'].indexOf(key) !== -1) {
        settingsObj[key] = parseFloat(val) || 0;
      } else {
        settingsObj[key] = val;
      }
    }
  }

  // Products
  var products = [];
  var productRows = ss.getSheetByName('Products').getDataRange().getValues();
  for (var j = 1; j < productRows.length; j++) {
    var r = productRows[j];
    if (r[0]) {
      products.push({
        id: r[0],
        name: r[1],
        size: r[2],
        category: r[3],
        price: Number(r[4]),
        points: Number(r[5]),
        imageUrl: r[6],
        isAvailable: r[7] === 'พร้อมขาย',
        description: r[8] || ''
      });
    }
  }

  // Promotions
  var promotions = [];
  var promoRows = ss.getSheetByName('Promotions').getDataRange().getValues();
  for (var k = 1; k < promoRows.length; k++) {
    var pr = promoRows[k];
    if (pr[0]) {
      promotions.push({
        id: 'PR' + k,
        code: pr[0],
        title: pr[1],
        discountAmount: Number(pr[2]),
        minOrderAmount: Number(pr[3]),
        expiryDate: pr[4],
        isActive: pr[5] === 'ใช้งาน'
      });
    }
  }

  // Rewards
  var rewards = [];
  var rewardRows = ss.getSheetByName('Rewards').getDataRange().getValues();
  for (var m = 1; m < rewardRows.length; m++) {
    var rw = rewardRows[m];
    if (rw[0]) {
      rewards.push({
        id: rw[0],
        title: rw[1],
        pointsRequired: Number(rw[2]),
        imageUrl: rw[3],
        isAvailable: rw[4] === 'พร้อมแลก'
      });
    }
  }

  // Orders
  var orders = [];
  var orderRows = ss.getSheetByName('Orders').getDataRange().getValues();
  for (var n = 1; n < orderRows.length; n++) {
    var ord = orderRows[n];
    if (ord[0]) {
      var items = [];
      try { items = JSON.parse(ord[4]); } catch(e) {}
      orders.push({
        id: ord[0],
        lineUserId: ord[1],
        customerName: ord[2],
        customerPhone: ord[3],
        items: items,
        itemsTotal: Number(ord[5]),
        shippingFee: Number(ord[6]),
        discountAmount: Number(ord[7]),
        grandTotal: Number(ord[8]),
        deliveryAddress: ord[9],
        lat: Number(ord[10]),
        lng: Number(ord[11]),
        distanceKm: Number(ord[12]),
        slipUrl: ord[13],
        status: ord[14],
        note: ord[15],
        createdAt: ord[16]
      });
    }
  }

  return {
    settings: settingsObj,
    products: products,
    promotions: promotions,
    rewards: rewards,
    orders: orders
  };
}

// 6. Submit Order API
function submitOrder(orderData) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var orderSheet = ss.getSheetByName('Orders');
  var customerSheet = ss.getSheetByName('Customers');
  
  var orderId = 'ORD-' + Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMdd-HHmmss');
  var nowStr = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
  
  var itemsJson = JSON.stringify(orderData.items || []);
  
  orderSheet.appendRow([
    orderId,
    orderData.lineUserId || 'GUEST',
    orderData.customerName,
    orderData.customerPhone,
    itemsJson,
    orderData.itemsTotal,
    orderData.shippingFee,
    orderData.discountAmount,
    orderData.grandTotal,
    orderData.deliveryAddress,
    orderData.lat,
    orderData.lng,
    orderData.distanceKm,
    orderData.slipUrl || '',
    'PENDING',
    orderData.note || '',
    nowStr
  ]);

  // Update Customer Points
  var custFound = false;
  var custRows = customerSheet.getDataRange().getValues();
  for (var i = 1; i < custRows.length; i++) {
    if (custRows[i][0] === orderData.lineUserId) {
      var currentPoints = Number(custRows[i][3]) || 0;
      var newPoints = currentPoints + (orderData.totalPointsEarned || 0);
      var currentOrders = Number(custRows[i][4]) || 0;
      var currentSpent = Number(custRows[i][5]) || 0;
      
      customerSheet.getRange(i + 1, 4).setValue(newPoints);
      customerSheet.getRange(i + 1, 5).setValue(currentOrders + 1);
      customerSheet.getRange(i + 1, 6).setValue(currentSpent + orderData.grandTotal);
      custFound = true;
      break;
    }
  }

  if (!custFound && orderData.lineUserId) {
    customerSheet.appendRow([
      orderData.lineUserId,
      orderData.customerName,
      orderData.customerPhone,
      orderData.totalPointsEarned || 0,
      1,
      orderData.grandTotal
    ]);
  }

  return { success: true, orderId: orderId, createdAt: nowStr };
}

// 7. Update Order Status
function updateOrderStatus(orderId, newStatus) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var orderSheet = ss.getSheetByName('Orders');
  var rows = orderSheet.getDataRange().getValues();
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === orderId) {
      orderSheet.getRange(i + 1, 15).setValue(newStatus);
      return { success: true, orderId: orderId, status: newStatus };
    }
  }
  return { success: false, message: 'ไม่พบรหัสคำสั่งซื้อ' };
}

// 8. Save System Settings
function saveSettings(newSettings) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var settingsSheet = ss.getSheetByName('Settings');
  var rows = settingsSheet.getDataRange().getValues();
  
  for (var key in newSettings) {
    var found = false;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) {
        settingsSheet.getRange(i + 1, 2).setValue(newSettings[key]);
        found = true;
        break;
      }
    }
    if (!found) {
      settingsSheet.appendRow([key, newSettings[key], '']);
    }
  }
  return { success: true, message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว' };
}
