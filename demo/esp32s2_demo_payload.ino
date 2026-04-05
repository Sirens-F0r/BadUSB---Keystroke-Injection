/*
 * KDS Guard Demo - ESP32-S2 BadUSB Payload
 * 
 * Payload AN TOAN: chi mo Notepad va go text
 * Dung de demo KDS Guard phat hien tan cong HID injection
 * 
 * Board: ESP32-S2 (chon "ESP32S2 Dev Module" trong Arduino IDE)
 * Cai dat:
 *   1. Arduino IDE -> File -> Preferences -> Board Manager URL:
 *      https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
 *   2. Tools -> Board -> Board Manager -> tim "esp32" -> Install
 *   3. Tools -> Board -> ESP32S2 Dev Module
 *   4. Tools -> USB Mode -> "USB-OTG (TinyUSB)"
 *   5. Upload code nay
 */

#include "USB.h"
#include "USBHIDKeyboard.h"

USBHIDKeyboard Keyboard;

// Delay giua cac phim (ms) - cang thap cang giong BadUSB
// 10ms = sieu nhanh (BadUSB dien hinh)
// 50ms = nhanh vua
const int KEYSTROKE_DELAY = 10;

// Cho 3 giay sau khi cam USB truoc khi bat dau
const int INITIAL_DELAY = 3000;

bool executed = false;

void setup() {
  USB.begin();
  Keyboard.begin();
  delay(INITIAL_DELAY);
}

void loop() {
  if (executed) return;
  executed = true;

  // === PAYLOAD 1: Mo Notepad ===
  // Nhan Win+R -> mo Run dialog
  Keyboard.press(KEY_LEFT_GUI);
  Keyboard.press('r');
  delay(100);
  Keyboard.releaseAll();
  delay(500);

  // Go "notepad" va Enter
  typeString("notepad");
  Keyboard.press(KEY_RETURN);
  delay(50);
  Keyboard.releaseAll();
  delay(1500); // Cho Notepad mo

  // === PAYLOAD 2: Go text vao Notepad ===
  typeString("=== KDS Guard BadUSB Demo ===\n");
  typeString("\n");
  typeString("Day la mot cuoc tan cong HID Injection mo phong.\n");
  typeString("Thiet bi ESP32-S2 gia dang ban phim va tu dong go cac lenh.\n");
  typeString("\n");
  typeString("Nguoi dung khong he bam phim - tat ca do thiet bi USB thuc hien.\n");
  typeString("He thong KDS Guard se phat hien vi:\n");
  typeString("  - Toc do go qua nhanh (> 15 keys/s)\n");
  typeString("  - Nhip go qua deu (CV < 0.15)\n");
  typeString("  - Flight time qua thap (< 30ms)\n");
  typeString("  - Burst pattern dai (> 15 phim lien tiep)\n");
  typeString("\n");
  typeString("=> KDS Guard se hien canh bao va CHAN INPUT.\n");
  typeString("\n");
  typeString("=== Het demo ===\n");

  // Xong - dung lai
  Keyboard.end();
}

// Go tung ky tu voi delay co dinh (giong may, khong giong nguoi)
void typeString(const char* text) {
  for (int i = 0; text[i] != '\0'; i++) {
    if (text[i] == '\n') {
      Keyboard.press(KEY_RETURN);
      delay(KEYSTROKE_DELAY);
      Keyboard.releaseAll();
    } else {
      Keyboard.press(text[i]);
      delay(KEYSTROKE_DELAY);
      Keyboard.releaseAll();
    }
    delay(KEYSTROKE_DELAY);
  }
}
