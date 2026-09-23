# 📘 คู่มือการติดตั้งและตั้งค่าระบบสั่งซื้อน้ำกระท่อมดิบอัตโนมัติ (Step-by-Step Deployment Guide)

ระบบนี้รองรับการรันบน Google Apps Script (GAS), Google Sheets Database และ LINE Messaging API / LINE LIFF

---

## ขั้นตอนที่ 1: เตรียม Google Sheets Database

1. ไปที่ [Google Sheets](https://sheets.new) และสร้างสเปรดชีตใหม่
2. ตั้งชื่อสเปรดชีต เช่น `ระบบเดลิเวอรีร้านน้ำกระท่อมเขียว`
3. ไม่จำเป็นต้องสร้างแผ่นงานเอง ระบบมีฟังก์ชัน `setupDatabase()` ที่จะสร้างแผ่นงาน [Settings], [Products], [Promotions], [Rewards], [Customers], [Orders] และข้อมูลตัวอย่างให้อัตโนมัติ!

---

## ขั้นตอนที่ 2: ติดตั้งโค้ดใน Google Apps Script (GAS)

1. ใน Google Sheets เปิดเมนู **ส่วนขยาย (Extensions)** -> **Apps Script**
2. ลบโค้ดเดิมใน `Code.gs` ทั้งหมด แล้วคัดลอกโค้ดจากไฟล์ `/gas_export/Code.gs` ไปวางแทนที่
3. กดปุ่ม **+** ด้านซ้ายเลือก **HTML** แล้วสร้างไฟล์ชื่อ `Customer` จากนั้นคัดลอกโค้ดจาก `/gas_export/Customer.html` ไปวาง
4. กดปุ่ม **+** ด้านซ้ายเลือก **HTML** แล้วสร้างไฟล์ชื่อ `Admin` จากนั้นคัดลอกโค้ดจาก `/gas_export/Admin.html` ไปวาง
5. กดปุ่มบันทึกโครงการ (รูปแผ่นดิสก์ 💾)

---

## ขั้นตอนที่ 3: ทดสอบการสร้างฐานข้อมูล

1. ในหน้า Apps Script ให้เลือกฟังก์ชัน `setupDatabase` จากเมนูเลือกฟังก์ชันด้านบน
2. กดปุ่ม **เรียกใช้ (Run)**
3. จะมีหน้าต่างขอสิทธิ์เข้าถึง (Authorization Required) ให้กด **ทบทวนสิทธิ์ (Review Permissions)** -> เลือกบัญชี Google -> กด **ขั้นสูง (Advanced)** -> กด **ไปที่โครงการ (Go to Project - Unsafe)** -> กด **อนุญาต (Allow)**
4. เมื่อรันเสร็จเรียบร้อย ให้กลับไปดูที่ Google Sheets จะพบแผ่นงานครบทั้ง 6 ตารางพร้อมข้อมูลเริ่มต้น!

---

## ขั้นตอนที่ 4: พลอยบริการ Web App (Deployment)

1. ในหน้า Apps Script กดปุ่ม **การทำให้ใช้งานได้ (Deploy)** บริเวณมุมขวาบน -> เลือก **การทำให้ใช้งานได้ใหม่ (New deployment)**
2. คลิกรูปเฟือง ⚙️ เลือกประเภทเป็น **เว็บแอป (Web app)**
3. ตั้งค่าดังนี้:
   - **คำอธิบาย (Description):** `v1.0 - Production`
   - **ดำเนินการในฐานะ (Execute as):** `ฉัน (Me - บัญชี Google ของคุณ)`
   - **ผู้มีสิทธิ์เข้าถึง (Who has access):** `ทุกคน (Anyone)` *(สำคัญมาก! เพื่อให้ลูกค้าเปิดหน้าเว็บผ่าน LINE ได้)*
4. กด **การทำให้ใช้งานได้ (Deploy)**
5. คัดลอก **URL ของเว็บแอป (Web App URL)** ที่ได้ เช่น:
   `https://script.google.com/macros/s/AKfycbx.../exec`

---

## ขั้นตอนที่ 5: นำ URL ไปเชื่อมต่อ LINE LIFF & LINE Official Account (LINE OA)

1. เข้าไปที่ [LINE Developers Console](https://developers.line.biz/)
2. เลือก Provider ของคุณ หรือสร้างใหม่ -> สร้าง **Messaging API Channel** และ **LIFF App**
3. ในส่วนตั้งค่า **LIFF App**:
   - **Endpoint URL:** ใส่ Web App URL จากขั้นตอนที่ 4 (เช่น `https://script.google.com/macros/s/.../exec`)
   - **Scope:** เลือก `profile`, `openid`
4. เมื่อบันทึกจะได้ **LIFF URL** เช่น `https://liff.line.me/1234567890-AbCdEfGh`
5. นำ LIFF URL ไปใส่ใน **Rich Menu (ริชเมนู)** ของ LINE Official Account เพื่อให้ลูกค้าเปิดใช้งานระบบผ่าน LINE OA ได้ทันที!
6. สำหรับหน้าหลังบ้าน Admin สามารถเข้าผ่าน URL: `https://script.google.com/macros/s/.../exec?page=admin`
