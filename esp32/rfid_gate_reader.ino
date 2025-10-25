/*
 * RFID GATE READER - ESP32 + RC522
 * =================================
 * Complete ESP32 firmware for RFID-based gate attendance system
 * 
 * Hardware Required:
 * - ESP32 Development Board
 * - RC522 RFID Reader Module
 * - Buzzer (optional, for audio feedback)
 * - LED (optional, for visual feedback)
 * 
 * Wiring:
 * RC522 -> ESP32
 * SDA  -> GPIO 5
 * SCK  -> GPIO 18
 * MOSI -> GPIO 23
 * MISO -> GPIO 19
 * IRQ  -> Not connected
 * GND  -> GND
 * RST  -> GPIO 22
 * 3.3V -> 3.3V
 * 
 * Buzzer -> GPIO 4
 * LED    -> GPIO 2 (built-in LED)
 * 
 * Libraries Required (Install via Arduino Library Manager):
 * - MFRC522 by GithubCommunity
 * - ArduinoJson by Benoit Blanchon
 * - WiFi (built-in)
 * - HTTPClient (built-in)
 */

#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// ===========================
// CONFIGURATION - UPDATE THESE
// ===========================
const char* WIFI_SSID = "YOUR_WIFI_SSID";          // WiFi network name
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";  // WiFi password
const char* API_URL = "https://your-project.supabase.co/rest/v1/rpc/record_gate_tap"; // Supabase Function URL
const char* SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"; // Supabase anon key
const char* DEVICE_ID = "GATE_001";                 // Unique device ID (update for each gate)
const char* SCHOOL_ID = "your-school-uuid";        // School UUID from database

// ===========================
// PIN DEFINITIONS
// ===========================
#define SS_PIN    5   // SDA
#define RST_PIN   22  // RST
#define BUZZER_PIN 4  // Buzzer
#define LED_PIN    2  // LED (built-in)

// ===========================
// GLOBAL OBJECTS
// ===========================
MFRC522 mfrc522(SS_PIN, RST_PIN);
WiFiClient wifiClient;
HTTPClient http;

// ===========================
// SETUP
// ===========================
void setup() {
  // Initialize serial
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n\n=================================");
  Serial.println("RFID Gate Attendance System");
  Serial.println("Device ID: " + String(DEVICE_ID));
  Serial.println("=================================\n");

  // Initialize pins
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  // Initialize SPI
  SPI.begin();
  
  // Initialize RFID reader
  mfrc522.PCD_Init();
  delay(100);
  
  // Check RFID reader
  Serial.print("RFID Reader Version: 0x");
  byte version = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.println(version, HEX);
  
  if (version == 0x00 || version == 0xFF) {
    Serial.println("WARNING: Communication with RFID reader failed!");
    Serial.println("Check wiring!");
    blinkError();
  } else {
    Serial.println("RFID Reader initialized successfully!");
    beepSuccess();
  }

  // Connect to WiFi
  connectWiFi();

  // Send initial heartbeat
  sendHeartbeat();

  Serial.println("\n✓ System ready. Waiting for cards...\n");
}

// ===========================
// MAIN LOOP
// ===========================
void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectWiFi();
  }

  // Look for new cards
  if (!mfrc522.PICC_IsNewCardPresent()) {
    return;
  }

  // Read card serial
  if (!mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // Get card UID
  String cardUID = getCardUID();
  
  Serial.println("\n--- Card Detected ---");
  Serial.println("UID: " + cardUID);
  Serial.println("Time: " + String(millis() / 1000) + "s");

  // Visual feedback
  digitalWrite(LED_PIN, HIGH);

  // Send to API
  bool success = recordTap(cardUID);

  // Audio/visual feedback
  if (success) {
    beepSuccess();
    delay(500);
  } else {
    beepError();
    delay(1000);
  }

  digitalWrite(LED_PIN, LOW);

  // Halt PICC
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  // Prevent multiple reads
  delay(2000);

  // Send heartbeat every 100 taps (approximately every 3-5 minutes)
  static int tapCount = 0;
  tapCount++;
  if (tapCount >= 100) {
    sendHeartbeat();
    tapCount = 0;
  }
}

// ===========================
// WiFi CONNECTION
// ===========================
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✓ WiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
    beepSuccess();
  } else {
    Serial.println("\n✗ WiFi connection failed!");
    blinkError();
  }
}

// ===========================
// GET CARD UID
// ===========================
String getCardUID() {
  String uid = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (mfrc522.uid.uidByte[i] < 0x10) {
      uid += "0";
    }
    uid += String(mfrc522.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

// ===========================
// RECORD TAP TO DATABASE
// ===========================
bool recordTap(String cardUID) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("✗ No WiFi connection");
    return false;
  }

  Serial.println("Sending to API...");

  // Prepare JSON payload
  StaticJsonDocument<256> doc;
  doc["p_card_uid"] = cardUID;
  doc["p_gate_device_id"] = DEVICE_ID;
  doc["p_school_id"] = SCHOOL_ID;

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  Serial.println("Payload: " + jsonPayload);

  // Make HTTP POST request
  http.begin(wifiClient, API_URL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));

  int httpCode = http.POST(jsonPayload);

  if (httpCode > 0) {
    Serial.print("HTTP Response: ");
    Serial.println(httpCode);
    
    String response = http.getString();
    Serial.println("Response: " + response);

    // Parse JSON response
    StaticJsonDocument<512> responseDoc;
    DeserializationError error = deserializeJson(responseDoc, response);

    if (error) {
      Serial.println("✗ JSON parsing failed");
      http.end();
      return false;
    }

    bool success = responseDoc["success"];
    const char* message = responseDoc["message"];
    
    Serial.println(success ? "✓ SUCCESS" : "✗ FAILED");
    Serial.println("Message: " + String(message));

    // Display student name if available
    if (responseDoc.containsKey("student_name")) {
      const char* studentName = responseDoc["student_name"];
      Serial.println("Student: " + String(studentName));
    }

    http.end();
    return success;

  } else {
    Serial.print("✗ HTTP Error: ");
    Serial.println(httpCode);
    Serial.println(http.errorToString(httpCode));
    http.end();
    return false;
  }
}

// ===========================
// SEND HEARTBEAT
// ===========================
void sendHeartbeat() {
  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  Serial.println("Sending heartbeat...");

  String heartbeatURL = String(API_URL).substring(0, String(API_URL).lastIndexOf('/')) + "/device_heartbeat";

  StaticJsonDocument<128> doc;
  doc["p_device_id"] = DEVICE_ID;
  doc["p_ip_address"] = WiFi.localIP().toString();

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  http.begin(wifiClient, heartbeatURL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  http.addHeader("Authorization", "Bearer " + String(SUPABASE_KEY));

  int httpCode = http.POST(jsonPayload);

  if (httpCode > 0) {
    Serial.println("✓ Heartbeat sent");
  } else {
    Serial.println("✗ Heartbeat failed");
  }

  http.end();
}

// ===========================
// AUDIO/VISUAL FEEDBACK
// ===========================
void beepSuccess() {
  // Two short beeps
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
  delay(100);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
}

void beepError() {
  // One long beep
  digitalWrite(BUZZER_PIN, HIGH);
  delay(500);
  digitalWrite(BUZZER_PIN, LOW);
}

void blinkError() {
  // Blink LED 5 times
  for (int i = 0; i < 5; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
}

/*
 * ===========================
 * TROUBLESHOOTING
 * ===========================
 * 
 * 1. "RFID Reader Version: 0x00" or "0xFF"
 *    - Check wiring connections
 *    - Ensure RC522 is powered with 3.3V (NOT 5V!)
 *    - Try different SDA/RST pins
 * 
 * 2. "WiFi connection failed"
 *    - Verify SSID and password
 *    - Check WiFi signal strength
 *    - Ensure ESP32 is in range
 * 
 * 3. "HTTP Error: -1"
 *    - Check API_URL is correct
 *    - Verify Supabase key is valid
 *    - Check internet connection
 * 
 * 4. Cards not detected
 *    - Bring card closer to reader (< 3cm)
 *    - Ensure card is Mifare Classic/Ultralight
 *    - Check RC522 antenna
 * 
 * 5. "Card not registered" error
 *    - Register card in web dashboard first
 *    - Verify card UID matches database
 * 
 * ===========================
 * NEXT STEPS
 * ===========================
 * 
 * 1. Update configuration (WiFi, API URL, keys)
 * 2. Upload to ESP32 via Arduino IDE
 * 3. Open Serial Monitor (115200 baud)
 * 4. Register device in gate_devices table
 * 5. Register RFID cards for students
 * 6. Test by tapping cards
 * 7. Monitor in web dashboard
 * 
 */
