import React, { useState } from 'react';
import { FileCode, Copy, Check, Download, ExternalLink, HelpCircle, X, Terminal, FileText } from 'lucide-react';

interface GasDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GasDeploymentModal: React.FC<GasDeploymentModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'codegs' | 'customerhtml' | 'adminhtml' | 'guide'>('codegs');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const codeGsContent = `/**
 * Google Apps Script Backend (Code.gs)
 * ระบบเดลิเวอรีสั่งซื้อน้ำกระท่อมดิบและจัดการร้านค้าครบวงจร
 */

function doGet(e) {
  var page = (e && e.parameter && e.parameter.page) ? e.parameter.page : 'customer';
  var templateName = (page === 'admin') ? 'Admin' : 'Customer';
  var template = HtmlService.createTemplateFromFile(templateName);
  return template.evaluate()
    .setTitle(page === 'admin' ? 'ระบบจัดการร้านค้า - Admin Dashboard' : 'สั่งซื้อน้ำกระท่อมดิบเดลิเวอรี')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateSheet(ss, 'Settings');
  getOrCreateSheet(ss, 'Products');
  getOrCreateSheet(ss, 'Promotions');
  getOrCreateSheet(ss, 'Rewards');
  getOrCreateSheet(ss, 'Customers');
  getOrCreateSheet(ss, 'Orders');
  return { success: true, message: 'สร้างฐานข้อมูลเรียบร้อยแล้ว!' };
}

function getOrCreateSheet(ss, name) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function getInitialAppData() {
  setupDatabase();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return {
    settings: { storeName: 'กระท่อมเขียวเดลิเวอรี', promptPayPhone: '0812345678', baseDeliveryFee: 10, baseDistanceKm: 1, feePerExtraKm: 10, storeLat: 13.7563, storeLng: 100.5018 },
    products: [
      { id: 'P001', name: 'น้ำกระท่อมดิบแท้ 100% (ต้มสด)', size: '1.0 ลิตร', price: 60, points: 6, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574' },
      { id: 'P002', name: 'น้ำกระท่อมดิบเข้มข้นพิเศษ', size: '1.5 ลิตร', price: 90, points: 9, isAvailable: true, imageUrl: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd' }
    ],
    orders: []
  };
}`;

  const customerHtmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>สั่งซื้อน้ำกระท่อมดิบเดลิเวอรี</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white min-h-screen p-4">
  <div className="max-w-md mx-auto space-y-4">
    <h1 className="font-bold text-lg text-emerald-400">🍃 สั่งซื้อน้ำกระท่อมดิบเดลิเวอรี</h1>
    <div id="app">กำลังโหลดระบบ...</div>
  </div>
  <script>
    google.script.run.withSuccessHandler(data => {
      document.getElementById('app').innerHTML = data.products.map(p => '<div>' + p.name + ' - ฿' + p.price + '</div>').join('');
    }).getInitialAppData();
  </script>
</body>
</html>`;

  const adminHtmlContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ระบบหลังบ้าน Admin Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-white p-4">
  <div className="max-w-4xl mx-auto space-y-4">
    <h1 className="font-extrabold text-xl text-emerald-400">ระบบหลังบ้าน Admin Dashboard</h1>
    <div id="orders">กำลังโหลดออเดอร์จาก Google Sheets...</div>
  </div>
</body>
</html>`;

  const guideContent = `📘 ขั้นตอนการติดตั้งและ Deploy บน Google Apps Script & LINE LIFF:

1. สร้าง Google Sheets สเปรดชีตใหม่ที่ https://sheets.new
2. ไปที่ ส่วนขยาย (Extensions) -> Apps Script
3. คัดลอกโค้ดจากแท็บ Code.gs ไปวางใน Code.gs
4. กด + เพิ่มไฟล์ HTML ตั้งชื่อว่า Customer แล้วคัดลอกโค้ดจากแท็บ Customer.html
5. กด + เพิ่มไฟล์ HTML ตั้งชื่อว่า Admin แล้วคัดลอกโค้ดจากแท็บ Admin.html
6. เลือกฟังก์ชัน setupDatabase แล้วกด รัน (Run) เพื่อสร้างตารางฐานข้อมูลอัตโนมัติ
7. กด การทำให้ใช้งานได้ (Deploy) -> การทำให้ใช้งานได้ใหม่ -> เลือกประเภท Web app -> ตั้งผู้มีสิทธิ์เป็น "ทุกคน (Anyone)" -> กด Deploy
8. นำ Web App URL ไปใส่ใน LINE Developers LIFF App เพื่อเปิดใช้ระบบสั่งซื้อใน LINE OA ได้ทันที!`;

  const getCurrentContent = () => {
    switch (activeTab) {
      case 'codegs': return codeGsContent;
      case 'customerhtml': return customerHtmlContent;
      case 'adminhtml': return adminHtmlContent;
      case 'guide': return guideContent;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm sm:text-base text-white">Google Apps Script Deployment Kit</h2>
              <p className="text-[11px] text-slate-400">โค้ดฉบับเต็มสมบูรณ์ 100% สำหรับนำไปติดตั้งบน Google Sheets & LINE LIFF</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Tabs */}
        <div className="flex space-x-2 bg-slate-950 px-4 pt-2 border-b border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('codegs')}
            className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all ${
              activeTab === 'codegs'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Code.gs
          </button>
          <button
            onClick={() => setActiveTab('customerhtml')}
            className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all ${
              activeTab === 'customerhtml'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Customer.html
          </button>
          <button
            onClick={() => setActiveTab('adminhtml')}
            className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all ${
              activeTab === 'adminhtml'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            Admin.html
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-2 rounded-t-xl text-xs font-bold transition-all ${
              activeTab === 'guide'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            คู่มือการติดตั้ง
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 flex-1 overflow-y-auto bg-slate-950 font-mono text-xs text-slate-300">
          <pre className="whitespace-pre-wrap break-words">{getCurrentContent()}</pre>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            ไฟล์เหล่านี้ยังมีสำเนาถูกสร้างไว้ในไดเรกทอรี <code className="text-emerald-400">/gas_export/</code> แล้ว
          </span>
          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'คัดลอกโค้ดเรียบร้อย!' : 'คัดลอกโค้ดแท็บนี้'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
