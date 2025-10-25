# 🚀 RFID Gate Attendance - Quick Reference Card

## ⚡ 30-Second Overview

**What is it?**  
Complete RFID/NFC-based gate attendance system with dual implementation:
- **Hardware**: ESP32 + RC522 reader (automated, permanent)
- **Software**: Smartphone NFC app (free, mobile)

**Cost**: Rp 0 - 1.5jt (depending on option)  
**Setup Time**: 1-5 days  
**Students Supported**: Unlimited

---

## 📁 File Structure

```
siakad-fatsal/
├── sql/migrations/
│   └── CREATE_RFID_GATE_SYSTEM.sql      ← Run this in Supabase first!
├── esp32/
│   ├── rfid_gate_reader.ino             ← Upload to ESP32
│   └── README.md                         ← ESP32 setup guide
├── components/pages/
│   ├── RFIDCardManagementPage.tsx       ← Admin dashboard
│   └── NFCTapPage.tsx                    ← NFC app alternative
├── RFID_GATE_SYSTEM_GUIDE.md            ← Complete documentation
├── RFID_SHOPPING_LIST.md                ← Where to buy hardware
└── RFID_UPDATE_LOG.md                   ← What's new
```

---

## 🎯 Quick Start (3 Steps)

### Step 1: Database (5 min)
```sql
-- Copy-paste sql/migrations/CREATE_RFID_GATE_SYSTEM.sql into Supabase
-- Creates: rfid_cards, gate_devices, gate_tap_logs, functions
```

### Step 2A: Hardware Option (30 min)
```bash
# 1. Buy: ESP32 (Rp 50k) + RC522 (Rp 30k) + Cards (Rp 500k/100pcs)
# 2. Wire: See esp32/README.md
# 3. Upload: esp32/rfid_gate_reader.ino
# 4. Configure: WiFi + Supabase credentials
# 5. Test: Tap card → check Serial Monitor
```

### Step 2B: NFC App Option (5 min)
```bash
# 1. Buy: RFID cards only (Rp 500k/100pcs)
# 2. Login as Admin/Staff
# 3. Navigate to: NFC Tap menu
# 4. Click: "Mulai Scanning"
# 5. Test: Tap card on smartphone
```

### Step 3: Register Cards (10 min)
```bash
# 1. Login as Admin → Kelola Kartu RFID
# 2. Click "Daftarkan Kartu Baru"
# 3. Get card UID (tap on reader or NFC app)
# 4. Select student from dropdown
# 5. Click "Daftarkan"
```

---

## 🔑 Key Configuration

### ESP32 Firmware:
```cpp
const char* WIFI_SSID = "SchoolWiFi";
const char* WIFI_PASSWORD = "password123";
const char* API_URL = "https://xxx.supabase.co/rest/v1/rpc/record_gate_tap";
const char* SUPABASE_KEY = "eyJhbGci...";
const char* DEVICE_ID = "GATE_001";
const char* SCHOOL_ID = "uuid-here";
```

### Wiring (ESP32 ↔ RC522):
```
SDA → GPIO 5    |  RST → GPIO 22
SCK → GPIO 18   |  3.3V → 3.3V
MOSI → GPIO 23  |  GND → GND
MISO → GPIO 19  |  Buzzer → GPIO 4
```

---

## 📊 Database Functions

| Function | Purpose | Called By |
|----------|---------|-----------|
| `record_gate_tap()` | Record check-in/out | ESP32, NFC App |
| `register_rfid_card()` | Register new card | Web Dashboard |
| `update_card_status()` | Block/unblock card | Web Dashboard |
| `get_card_history()` | View tap logs | Web Dashboard |
| `device_heartbeat()` | Monitor device | ESP32 |

---

## 🎨 Web Dashboard Pages

### 1. **Kelola Kartu RFID** (`/kelola-kartu-rfid`)
**Who**: Admin, Staff  
**Features**:
- Register new cards
- Assign to students
- Block/unblock/delete
- View statistics
- Search & filter
- Real-time updates

### 2. **NFC Tap** (`/nfc-tap`)
**Who**: Admin, Staff  
**Features**:
- Scan NFC cards with smartphone
- Auto-record attendance
- View last tap result
- View recent history
- Audio/vibration feedback

---

## 🔍 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| ESP32: "RFID Reader Version: 0x00" | Check wiring, use 3.3V not 5V |
| ESP32: "WiFi failed" | Check SSID/password, use 2.4GHz |
| ESP32: "HTTP Error -1" | Check API URL and key |
| NFC: "Not supported" | Use Chrome/Edge on Android |
| DB: "Card not registered" | Register in dashboard first |
| Card: Not detected | Bring closer (<3cm) |

---

## 💰 Cost Comparison

| Option | Hardware | Cards (100) | Total | Time |
|--------|----------|-------------|-------|------|
| **NFC App** | Rp 0 | Rp 500k | **Rp 500k** | 1 day |
| **1x ESP32** | Rp 200k | Rp 500k | **Rp 700k** | 3 days |
| **3x ESP32** | Rp 550k | Rp 500k | **Rp 1,050k** | 5 days |

---

## 📞 Where to Buy

**Tokopedia/Shopee** (2-5 days):
- Search: "ESP32 Development Board"
- Search: "RC522 RFID Module"
- Search: "Mifare Classic 1K Card"
- Bulk: Order 100+ cards for discount

**AliExpress** (15-45 days):
- Much cheaper for bulk orders
- Good for 100+ cards

---

## ✅ Pre-Go-Live Checklist

- [ ] Database migration executed ✓
- [ ] 1+ gate device registered ✓
- [ ] ESP32 tested OR NFC app tested ✓
- [ ] 10+ cards registered ✓
- [ ] Staff trained ✓
- [ ] Documentation ready ✓
- [ ] Backup done ✓

---

## 🆘 Need Help?

1. **ESP32 Issues** → See `esp32/README.md`
2. **System Guide** → See `RFID_GATE_SYSTEM_GUIDE.md`
3. **Shopping** → See `RFID_SHOPPING_LIST.md`
4. **Database** → Check `gate_tap_logs` table
5. **Logs** → Serial Monitor (ESP32) or Browser Console (NFC)

---

## 🎯 Success Metrics

**After 1 Week**:
- 99% uptime
- <1s tap time
- <5% failed taps
- 100% card coverage

---

## 📈 Next Steps

1. ✅ Run database migration
2. ✅ Choose: ESP32 or NFC app
3. ✅ Buy hardware (if ESP32)
4. ✅ Register cards
5. ✅ Test with 10 students
6. ✅ Train staff
7. ✅ Go live!

---

**Total Implementation Time**: 1-5 days  
**Total Cost**: Rp 500k - 1.5jt  
**Difficulty**: ⭐⭐⭐ (Moderate)

*For complete details, read: RFID_GATE_SYSTEM_GUIDE.md*
