# 🛒 RFID Gate Attendance System - Shopping List

## 📦 Hardware Components

### Option A: ESP32 RFID Reader (Permanent Gate Installation)

| Item | Specifications | Quantity | Estimated Price (IDR) | Link/Store |
|------|----------------|----------|----------------------|------------|
| **ESP32 Development Board** | ESP32-WROOM-32, WiFi+BT, USB-C | 1 per gate | 50,000 - 80,000 | Tokopedia, Bukalapak |
| **RC522 RFID Reader Module** | 13.56MHz, SPI, Include antenna | 1 per gate | 30,000 - 50,000 | Tokopedia, Bukalapak |
| **Buzzer** | 5V Active Buzzer | 1 per gate | 3,000 - 5,000 | Tokopedia |
| **LED** | 5mm LED (Optional, ESP32 has built-in) | 1 per gate | 1,000 | Tokopedia |
| **Resistor** | 220Ω for LED | 1 per gate | 500 | Tokopedia |
| **Breadboard** | 400 tie-points (for testing) | 1 | 10,000 - 15,000 | Tokopedia |
| **Jumper Wires** | Male-to-Female, set of 40 | 1 pack | 8,000 - 12,000 | Tokopedia |
| **Micro USB Cable** | For ESP32 programming | 1 | 10,000 - 15,000 | Tokopedia |
| **Power Adapter** | 5V 2A USB adapter | 1 per gate | 20,000 - 30,000 | Tokopedia |
| **Enclosure Box** | IP65 waterproof plastic box | 1 per gate | 30,000 - 60,000 | Tokopedia |
| **RFID Cards** | Mifare Classic 1K, 13.56MHz | 1 per student | 5,000 - 10,000 each | Tokopedia (bulk: 100pcs ~400k) |

**Total Cost per Gate (Basic Setup)**: **Rp 150,000 - 300,000**  
**Total Cost for 100 Student Cards**: **Rp 500,000 - 1,000,000**

---

### Option B: Smartphone NFC App (Mobile Gate Solution)

| Item | Requirements | Cost |
|------|-------------|------|
| **Android Smartphone** | With NFC support, Chrome browser | **FREE** (use existing staff phone) |
| **RFID/NFC Cards** | Same as Option A | Rp 5,000 - 10,000 each |

**Total Cost**: **Rp 0** (hardware) + **Rp 500,000 - 1,000,000** (cards only)

---

## 🛍️ Recommended Online Stores

### 1. **Tokopedia** (Most Popular)
- Search: "ESP32 Development Board"
- Search: "RC522 RFID Module"
- Search: "Mifare Classic 1K Card"
- **Recommended Sellers**:
  - Indo Circuit
  - Robimart
  - ElectroPart

### 2. **Bukalapak**
- Search: "ESP32 WiFi"
- Search: "RFID RC522"
- **Recommended Sellers**:
  - Toko Arduino
  - Electromart

### 3. **Shopee**
- Search: "ESP32 NodeMCU"
- Search: "RFID Reader RC522"
- Often has cashback/vouchers

### 4. **AliExpress** (Bulk Orders, 2-4 weeks shipping)
- Search: "ESP32-WROOM-32 Development Board"
- Search: "MFRC522 RFID Module"
- **Much cheaper for bulk** (100+ cards: ~$30 = Rp 450k)

---

## 📋 Shopping Checklist

### For 1 Gate Setup:
- [ ] 1x ESP32 Development Board
- [ ] 1x RC522 RFID Reader Module
- [ ] 1x Buzzer (5V)
- [ ] 1x Breadboard (for testing)
- [ ] 1x Jumper Wire Pack (40pcs)
- [ ] 1x Micro USB Cable
- [ ] 1x Power Adapter (5V 2A)
- [ ] 1x Enclosure Box (waterproof)
- [ ] 100x RFID Cards (for students)
- [ ] 5x Extra RFID Cards (for testing/replacement)

### For Multiple Gates (3 gates example):
- [ ] 3x ESP32 Development Board
- [ ] 3x RC522 RFID Reader Module
- [ ] 3x Buzzer
- [ ] 1x Breadboard (shared for testing)
- [ ] 1x Jumper Wire Pack (can share)
- [ ] 3x Micro USB Cable
- [ ] 3x Power Adapter
- [ ] 3x Enclosure Box
- [ ] 300x RFID Cards (for students, order in bulk for discount!)
- [ ] 10x Extra cards

---

## 💡 Money-Saving Tips

### 1. **Bulk Ordering**
- Order 100+ cards from AliExpress: Save 50%
- Order 5+ ESP32 boards: Get 10-20% discount from sellers
- Message seller for bulk pricing

### 2. **Bundle Deals**
- Many sellers offer "ESP32 Starter Kit" with breadboard, jumper wires included
- "RC522 Kit" often includes 2 cards, cheaper than buying separately

### 3. **Second-Hand/Used**
- ESP32 boards are very durable
- Can buy used from electronics hobbyists
- Check Facebook Marketplace, OLX

### 4. **University/School Discounts**
- Contact seller, mention for educational purpose
- Some give 10-15% discount for schools

### 5. **Alternative Components**
- **Instead of RC522**: Try cheaper PN532 NFC module (Rp 40k)
- **Instead of ESP32**: Use ESP8266 (Rp 30k, but WiFi only)
- **Instead of custom cards**: Use blank white cards (Rp 3k each)

---

## 🎨 Optional Add-ons (Nice to Have)

| Item | Purpose | Price |
|------|---------|-------|
| **OLED Display 0.96"** | Show student name on tap | Rp 30,000 |
| **RGB LED Strip** | Visual feedback (green=success, red=error) | Rp 25,000 |
| **Speaker Module** | Play greeting sounds | Rp 20,000 |
| **Relay Module** | Control electronic gate/turnstile | Rp 15,000 |
| **Battery 18650 + Holder** | Backup power during outage | Rp 40,000 |
| **Solar Panel 5V** | Outdoor gate power | Rp 80,000 |

---

## 📦 Sample Package Deals

### Package 1: "Basic Single Gate" - **Rp 600,000**
- 1x ESP32 + RC522 + Buzzer + Cables + Enclosure
- 100x Student Cards
- Shipping: Rp 20,000

### Package 2: "Premium Single Gate" - **Rp 850,000**
- Everything in Package 1, plus:
- OLED Display
- RGB LED Strip
- Speaker Module
- Battery backup

### Package 3: "Multi-Gate (3 gates)" - **Rp 1,500,000**
- 3x Complete basic gate setups
- 300x Student Cards (bulk discount)
- Shipping: Free

---

## 🔧 Tools You'll Need

Most schools already have these:

- [ ] Laptop/PC (for programming ESP32)
- [ ] Arduino IDE software (FREE download)
- [ ] Screwdriver (for enclosure installation)
- [ ] Double-sided tape / Mounting screws
- [ ] Internet connection (for uploading code)

---

## 📞 Sample Inquiry Message to Seller

```
Halo Kak, saya dari [Nama Sekolah].
Mau order untuk sistem absensi sekolah:

- 3x ESP32 Development Board
- 3x RC522 RFID Module 
- 300x Mifare Classic 1K Card

Bisa dapat harga khusus untuk sekolah?
Butuh invoice resmi untuk laporan.

Terima kasih!
```

---

## ⏱️ Estimated Delivery Time

| Store | Delivery Time | Shipping Cost |
|-------|---------------|---------------|
| **Tokopedia/Shopee** (Same city) | 1-3 days | Rp 10,000 - 20,000 |
| **Tokopedia/Shopee** (Other city) | 3-7 days | Rp 15,000 - 40,000 |
| **Bukalapak** | 2-5 days | Rp 12,000 - 35,000 |
| **AliExpress** | 15-45 days | FREE (or $2 fast) |

---

## 🎯 Recommended Purchase Order

**Week 1**: Order from local seller (Tokopedia)
- 1x ESP32
- 1x RC522
- 1x Breadboard kit
- 10x Test cards
- **Purpose**: Build proof-of-concept, test system

**Week 2**: If test successful, bulk order
- Additional ESP32s for other gates
- 100-300 cards from AliExpress (cheaper)
- Enclosures and power adapters

**Week 3-4**: While waiting for AliExpress delivery
- Develop and test code
- Train staff
- Prepare database

**Week 5**: Full deployment
- Install all gates
- Distribute cards to students
- Go live!

---

## 💳 Payment Tips

1. **Use Credit Card**: Get cashback/points
2. **Check Vouchers**: Tokopedia/Shopee often have tech vouchers
3. **Pay with Bank Transfer**: Some sellers give 2-3% discount
4. **Request Invoice**: For school accounting

---

## 📊 Cost Comparison Table

| Setup Type | Hardware Cost | Cards (100) | Total | Time to Setup |
|------------|--------------|-------------|-------|---------------|
| **NFC App Only** | Rp 0 | Rp 500k | **Rp 500k** | 1 day |
| **1x ESP32 Gate** | Rp 200k | Rp 500k | **Rp 700k** | 3 days |
| **3x ESP32 Gates** | Rp 550k | Rp 500k | **Rp 1,050k** | 5 days |
| **Premium Setup** | Rp 1,000k | Rp 500k | **Rp 1,500k** | 7 days |

---

## 🏆 Best Value Recommendation

**For Budget-Conscious Schools**:
→ Start with **NFC App** (Rp 500k cards only)
→ Add 1 ESP32 gate later if needed

**For Medium Schools (500+ students)**:
→ Buy **2x ESP32 gates** (main + backup)
→ Order cards in bulk from AliExpress

**For Large Schools (1000+ students)**:
→ **3+ ESP32 gates** at different locations
→ Premium features (OLED, LED, backup power)

---

## ✅ Final Checklist Before Ordering

- [ ] Confirmed budget with school administration
- [ ] Counted number of students (for card quantity)
- [ ] Decided: ESP32 hardware OR NFC app OR both?
- [ ] Checked seller ratings (minimum 4.5 stars)
- [ ] Read product reviews
- [ ] Confirmed specifications match requirements
- [ ] Asked for invoice/official receipt
- [ ] Checked warranty/return policy
- [ ] Confirmed delivery address
- [ ] Prepared installation location

---

## 📞 Contact Recommended Suppliers

### 1. **Indo Circuit (Tokopedia)**
- WhatsApp: [Ask seller]
- Specializes in: Arduino, ESP32, modules
- Rating: 4.9/5
- Response time: < 1 hour

### 2. **Robimart (Tokopedia)**
- WhatsApp: [Ask seller]  
- Specializes in: IoT, sensors, RFID
- Rating: 4.8/5
- Bulk orders: Yes

### 3. **ElectroPart (Tokopedia)**
- WhatsApp: [Ask seller]
- Specializes in: Components, kits
- Rating: 4.9/5
- School discounts: Ask

---

*Happy Shopping! 🛒*
*For technical questions, refer to RFID_GATE_SYSTEM_GUIDE.md*
