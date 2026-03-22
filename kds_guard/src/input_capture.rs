//! Module thu thập sự kiện bàn phím (Keystroke Collector)
//!
//! Sử dụng thư viện `rdev` để bắt key_down / key_up events
//! với timestamp độ phân giải cao (monotonic clock).

use std::sync::mpsc::Sender;
use std::time::Instant;

use rdev::{listen, Event, EventType, Key};

/// Biểu diễn một sự kiện bàn phím đã thu thập
#[derive(Debug, Clone)]
pub struct KeyEvent {
    /// Timestamp tương đối (ms) kể từ khi bắt đầu thu thập
    pub timestamp_ms: f64,
    /// Mã phím (tên phím dạng string)
    pub key_code: String,
    /// Loại sự kiện: "down" hoặc "up"
    pub event_type: String,
    /// Phân loại phím: "alpha", "digit", "modifier", "special", "other"
    pub key_class: String,
    /// Có phải phím modifier không (Ctrl, Alt, Shift, Win)
    pub is_modifier: bool,
}

/// Phân loại phím thành các nhóm
fn classify_key(key: &Key) -> (String, String, bool) {
    let key_str = format!("{:?}", key);

    let (key_class, is_modifier) = match key {
        // Modifier keys
        Key::ShiftLeft | Key::ShiftRight => ("modifier".to_string(), true),
        Key::ControlLeft | Key::ControlRight => ("modifier".to_string(), true),
        Key::Alt | Key::AltGr => ("modifier".to_string(), true),
        Key::MetaLeft | Key::MetaRight => ("modifier".to_string(), true),

        // Special keys thường bị BadUSB lạm dụng
        Key::Escape | Key::Tab | Key::Return | Key::Delete
        | Key::Backspace | Key::CapsLock => ("special".to_string(), false),

        // Function keys
        Key::F1 | Key::F2 | Key::F3 | Key::F4
        | Key::F5 | Key::F6 | Key::F7 | Key::F8
        | Key::F9 | Key::F10 | Key::F11 | Key::F12 => ("function".to_string(), false),

        // Arrow keys
        Key::UpArrow | Key::DownArrow
        | Key::LeftArrow | Key::RightArrow => ("navigation".to_string(), false),

        // Space
        Key::Space => ("alpha".to_string(), false),

        // Number keys
        Key::Num0 | Key::Num1 | Key::Num2 | Key::Num3
        | Key::Num4 | Key::Num5 | Key::Num6 | Key::Num7
        | Key::Num8 | Key::Num9 => ("digit".to_string(), false),

        // Letter keys
        Key::KeyA | Key::KeyB | Key::KeyC | Key::KeyD
        | Key::KeyE | Key::KeyF | Key::KeyG | Key::KeyH
        | Key::KeyI | Key::KeyJ | Key::KeyK | Key::KeyL
        | Key::KeyM | Key::KeyN | Key::KeyO | Key::KeyP
        | Key::KeyQ | Key::KeyR | Key::KeyS | Key::KeyT
        | Key::KeyU | Key::KeyV | Key::KeyW | Key::KeyX
        | Key::KeyY | Key::KeyZ => ("alpha".to_string(), false),

        // Còn lại
        _ => ("other".to_string(), false),
    };

    (key_str, key_class, is_modifier)
}

/// Bắt đầu lắng nghe sự kiện bàn phím
///
/// Gửi mỗi KeyEvent qua channel `tx` để xử lý ở thread khác.
/// Hàm này block thread hiện tại (chạy vòng lặp listen).
/// Nếu listener bị crash (bug rdev trên Windows), tự động restart.
pub fn start_capture(tx: Sender<KeyEvent>) {
    let start_time = Instant::now();

    log::info!("🎹 Bắt đầu thu thập sự kiện bàn phím...");

    // Wrap trong loop — nếu rdev crash, tự restart listener
    let max_retries = 5;
    for attempt in 0..max_retries {
        if attempt > 0 {
            log::warn!("🔄 Listener restart lần {} ...", attempt);
            std::thread::sleep(std::time::Duration::from_millis(500));
        }

        let tx_clone = tx.clone();
        let start = start_time.clone();

        let callback = move |event: Event| {
            // Chỉ xử lý key events, bỏ qua mouse/wheel/move
            let (event_type_str, key) = match event.event_type {
                EventType::KeyPress(key) => ("down", key),
                EventType::KeyRelease(key) => ("up", key),
                _ => return,
            };

            let elapsed = start.elapsed();
            let timestamp_ms = elapsed.as_secs_f64() * 1000.0;

            let (key_code, key_class, is_modifier) = classify_key(&key);

            let key_event = KeyEvent {
                timestamp_ms,
                key_code,
                event_type: event_type_str.to_string(),
                key_class,
                is_modifier,
            };

            // Gửi event qua channel, dừng nếu receiver đã drop
            let _ = tx_clone.send(key_event);
        };

        // Bắt đầu listen - hàm này sẽ block cho đến khi lỗi hoặc kết thúc
        match listen(callback) {
            Ok(_) => {
                log::info!("Listener kết thúc bình thường.");
                break;
            }
            Err(error) => {
                log::error!("❌ Listener lỗi: {:?}. Thử restart...", error);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_classify_alpha_key() {
        let (_, class, is_mod) = classify_key(&Key::KeyA);
        assert_eq!(class, "alpha");
        assert!(!is_mod);
    }

    #[test]
    fn test_classify_modifier_key() {
        let (_, class, is_mod) = classify_key(&Key::ControlLeft);
        assert_eq!(class, "modifier");
        assert!(is_mod);
    }

    #[test]
    fn test_classify_digit_key() {
        let (_, class, is_mod) = classify_key(&Key::Num5);
        assert_eq!(class, "digit");
        assert!(!is_mod);
    }

    #[test]
    fn test_classify_special_key() {
        let (_, class, is_mod) = classify_key(&Key::Escape);
        assert_eq!(class, "special");
        assert!(!is_mod);
    }
}
