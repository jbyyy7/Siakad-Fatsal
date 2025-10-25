# ESP32 RFID Gate Reader - Quick Start Guide

## 📁 File: rfid_gate_reader.ino

Arduino sketch untuk ESP32 + RC522 RFID Reader Module

---

## 🚀 Quick Setup (5 Steps)

### 1️⃣ Install Software

**Arduino IDE 2.x**:
- Download: https://www.arduino.cc/en/software
- Install for your OS (Windows/Mac/Linux)

**ESP32 Board Support**:
1. Open Arduino IDE
2. File → Preferences
3. Additional Board Manager URLs: 
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
4. Tools → Board → Board Manager
5. Search "ESP32" → Install "ESP32 by Espressif Systems"

**Required Libraries**:
1. Sketch → Include Library → Manage Libraries
2. Install these libraries:
   - `MFRC522` by GithubCommunity
   - `ArduinoJson` by Benoit Blanchon (version 6.x)

---

### 2️⃣ Wire Hardware

```
RC522 RFID Reader          ESP32 Development Board
─────────────────          ────────────────────────
SDA  (Signal)      ────→   GPIO 5
SCK  (Clock)       ────→   GPIO 18
MOSI (Master Out)  ────→   GPIO 23
MISO (Master In)   ────→   GPIO 19
IRQ  (Interrupt)           NOT CONNECTED
GND  (Ground)      ────→   GND
RST  (Reset)       ────→   GPIO 22
3.3V (Power)       ────→   3.3V  ⚠️ IMPORTANT: NOT 5V!

Optional Components:
Buzzer (+)         ────→   GPIO 4
Buzzer (-)         ────→   GND
LED (+)            ────→   GPIO 2 (or use built-in LED)
LED (-)            ────→   GND (with 220Ω resistor)
```

**⚠️ WARNING**: RC522 module operates at **3.3V ONLY**. Connecting to 5V will damage it!

---

### 3️⃣ Configure Code

Open `rfid_gate_reader.ino` in Arduino IDE and update these lines:

```cpp
// ===========================
// CONFIGURATION - UPDATE THESE
// ===========================

// 1. WiFi Credentials
const char* WIFI_SSID = "YOUR_WIFI_SSID";          // Your WiFi network name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";  // Your WiFi password

// 2. Supabase API Settings
const char* API_URL = "https://your-project.supabase.co/rest/v1/rpc/record_gate_tap";
const char* SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"; // From Supabase Settings → API

// 3. Device Information
const char* DEVICE_ID = "GATE_001";                 // Unique ID (change for each gate)
const char* SCHOOL_ID = "your-school-uuid-here";    // From profiles table
```

**How to Get Values**:

1. **WiFi SSID/Password**: Your school's WiFi network credentials
2. **Supabase URL**: Supabase Dashboard → Settings → API → Project URL
3. **Supabase Key**: Supabase Dashboard → Settings → API → `anon` `public` key
4. **Device ID**: Any unique name (GATE_001, GATE_MAIN, GATE_BACK, etc.)
5. **School ID**: 
   ```sql
   SELECT id FROM schools WHERE name = 'Your School Name';
   ```

---

### 4️⃣ Upload to ESP32

1. **Connect ESP32** to computer via USB cable

2. **Select Board**:
   - Tools → Board → ESP32 Arduino → "ESP32 Dev Module"

3. **Select Port**:
   - Tools → Port → (Select COM port showing ESP32)
   - Windows: COM3, COM4, etc.
   - Mac/Linux: /dev/ttyUSB0, /dev/cu.usbserial, etc.

4. **Upload Settings** (optional, defaults are fine):
   - Upload Speed: 921600
   - Flash Frequency: 80MHz
   - Flash Mode: QIO
   - Flash Size: 4MB
   - Partition Scheme: Default

5. **Click Upload Button** (→ icon at top)
   - Wait for "Connecting..." → "Writing..." → "Done uploading"
   - Takes about 30-60 seconds

---

### 5️⃣ Test & Monitor

1. **Open Serial Monitor**:
   - Tools → Serial Monitor
   - Set baud rate to: **115200**

2. **Check Output**:
   ```
   =================================
   RFID Gate Attendance System
   Device ID: GATE_001
   =================================

   RFID Reader Version: 0x92  ✓ Good!
   RFID Reader initialized successfully!

   Connecting to WiFi: YourWiFiName
   .....
   ✓ WiFi connected!
   IP Address: 192.168.1.100

   ✓ System ready. Waiting for cards...
   ```

3. **Test Card Reading**:
   - Hold RFID card near reader (< 3cm)
   - Should see:
     ```
     --- Card Detected ---
     UID: A1B2C3D4
     Time: 123s
     Sending to API...
     HTTP Response: 200
     ✓ SUCCESS
     Message: Selamat datang, Ahmad!
     Student: Ahmad bin Ali
     ```

---

## 🔧 Troubleshooting

### Issue 1: "RFID Reader Version: 0x00" or "0xFF"

**Cause**: RC522 not detected

**Solutions**:
1. Check all wiring connections (especially SDA, SCK, MOSI, MISO)
2. Ensure RC522 powered by **3.3V** (NOT 5V!)
3. Try different GPIO pins (update code if changed)
4. Test with multimeter: 3.3V between 3.3V and GND pins
5. Replace RC522 module (may be faulty)

---

### Issue 2: "WiFi connection failed"

**Cause**: Cannot connect to WiFi

**Solutions**:
1. Verify SSID and password are correct
2. Check WiFi signal strength (move ESP32 closer to router)
3. Ensure WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
4. Restart WiFi router
5. Check if MAC address filtering enabled (whitelist ESP32)
6. Try different WiFi network

---

### Issue 3: "HTTP Error: -1" or "HTTP Error: -11"

**Cause**: Cannot connect to Supabase API

**Solutions**:
1. Verify API_URL is correct (check https://)
2. Verify SUPABASE_KEY is correct
3. Test URL in browser (should show "404 Not Found" but connection works)
4. Check firewall not blocking ESP32
5. Ping Supabase domain from same network
6. Check internet connection working

---

### Issue 4: "Card not detected"

**Cause**: RFID reader not reading cards

**Solutions**:
1. Bring card closer to reader (< 3cm)
2. Ensure card is Mifare Classic 1K or Mifare Ultralight
3. Test with different cards
4. Check RC522 antenna connection
5. Verify card is 13.56MHz (not 125kHz)
6. Clean card and reader with dry cloth

---

### Issue 5: "Card not registered"

**Cause**: Card exists but not in database

**Solutions**:
1. Register card in web dashboard first
2. Verify card UID matches database
3. Check SCHOOL_ID matches
4. Run this SQL:
   ```sql
   SELECT * FROM rfid_cards WHERE card_uid = 'A1B2C3D4';
   ```

---

### Issue 6: "Compilation Error"

**Cause**: Missing libraries or wrong board

**Solutions**:
1. Install MFRC522 library
2. Install ArduinoJson library (version 6.x)
3. Select correct board (ESP32 Dev Module)
4. Update ESP32 board package to latest
5. Restart Arduino IDE

---

## 📊 LED & Buzzer Patterns

### Success (Card Accepted):
- **Buzzer**: Beep-beep (2 short)
- **LED**: Blink 2 times
- **Duration**: 0.5 seconds

### Error (Card Rejected):
- **Buzzer**: Beeeep (1 long)
- **LED**: Blink 5 times
- **Duration**: 1 second

### Startup:
- **Buzzer**: Beep-beep (initialization successful)
- **LED**: Solid during WiFi connection

---

## 🔐 Security Best Practices

1. **Hide Credentials**:
   - Don't share code with WiFi password
   - Don't commit SUPABASE_KEY to public repos
   - Use environment variables in production

2. **Network Security**:
   - Use WPA2/WPA3 WiFi encryption
   - Isolate ESP32 on separate VLAN if possible
   - Monitor API logs for suspicious activity

3. **Physical Security**:
   - Mount reader in weatherproof enclosure
   - Secure USB cable to prevent tampering
   - Lock enclosure with padlock

---

## 🎯 Advanced Configuration

### Change GPIO Pins:

```cpp
#define SS_PIN    21   // Change from 5 to 21
#define RST_PIN   17   // Change from 22 to 17
#define BUZZER_PIN 16  // Change from 4 to 16
#define LED_PIN    13  // Change from 2 to 13
```

### Adjust Read Distance:

```cpp
// In setup(), after mfrc522.PCD_Init()
mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max); // Maximum gain
// or
mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_avg); // Average gain
```

### Change Heartbeat Frequency:

```cpp
// In loop(), find this line:
if (tapCount >= 100) {  // Change 100 to desired number
  sendHeartbeat();
  tapCount = 0;
}
```

---

## 📈 Performance Optimization

### Reduce Memory Usage:
```cpp
// Change buffer sizes
StaticJsonDocument<128> doc;  // Reduce from 256
StaticJsonDocument<256> responseDoc; // Reduce from 512
```

### Faster WiFi Connection:
```cpp
// Add static IP (faster than DHCP)
IPAddress local_IP(192, 168, 1, 100);
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
WiFi.config(local_IP, gateway, subnet);
```

### Reduce Power Consumption:
```cpp
// Add in loop() when idle
delay(100); // Reduce from 2000
```

---

## 🔄 Firmware Update Process

1. Make changes to code
2. Save file
3. Click Upload button
4. Monitor Serial Monitor for errors
5. Test with cards

**Tip**: Keep backup of working code!

---

## 📞 Debug Commands

### Check WiFi Status:
```cpp
Serial.print("WiFi Status: ");
Serial.println(WiFi.status());  // 3 = WL_CONNECTED
Serial.print("RSSI: ");
Serial.println(WiFi.RSSI());    // Signal strength (dBm)
```

### Test API Without Card:
```cpp
// In loop(), add this:
if (Serial.available()) {
  String testUID = Serial.readStringUntil('\n');
  recordTap(testUID);
}
```
Then type card UID in Serial Monitor and press Enter.

---

## 📚 Additional Resources

**ESP32 Documentation**: https://docs.espressif.com/projects/esp-idf/en/latest/esp32/

**MFRC522 Library**: https://github.com/miguelbalboa/rfid

**ArduinoJson**: https://arduinojson.org/

**Supabase Docs**: https://supabase.com/docs

---

## ✅ Pre-Deployment Checklist

- [ ] Code uploaded successfully
- [ ] Serial Monitor shows "System ready"
- [ ] WiFi connected (shows IP address)
- [ ] RFID reader version detected (0x92 or similar)
- [ ] Test card reads UID correctly
- [ ] API call returns success
- [ ] Buzzer beeps on tap
- [ ] LED blinks on tap
- [ ] Enclosure installed securely
- [ ] Power adapter connected
- [ ] Device registered in gate_devices table

---

## 🎉 You're Done!

Your ESP32 RFID Gate Reader is now operational!

**Next Steps**:
1. Register RFID cards in web dashboard
2. Test with students
3. Monitor in real-time via Supabase
4. Check gate_tap_logs for issues

---

*For complete system documentation, see: RFID_GATE_SYSTEM_GUIDE.md*
*For hardware shopping, see: RFID_SHOPPING_LIST.md*
