// BlockInput API + Windows Notification

use std::thread;
use std::time::Duration;

#[cfg(windows)]
use winapi::um::winuser::{BlockInput, MessageBoxW, MB_ICONWARNING, MB_ICONERROR, MB_OK, MB_TOPMOST, MB_SYSTEMMODAL};

use crate::detector::{DetectionResult, RiskLevel};

#[derive(Debug)]
pub struct ResponseResult {
    pub blocked: bool,
    pub notified: bool,
    pub error: Option<String>,
}

/// Chan keyboard/mouse input (can quyen Administrator)
pub fn block_input(duration_ms: u64) -> bool {
    #[cfg(windows)]
    {
        unsafe {
            let result = BlockInput(1);
            if result == 0 {
                log::error!(
                    "BlockInput that bai - can quyen Administrator! Error: {}",
                    winapi::um::errhandlingapi::GetLastError()
                );
                return false;
            }

            log::warn!("INPUT DA BI CHAN trong {}ms", duration_ms);
            thread::sleep(Duration::from_millis(duration_ms));

            BlockInput(0);
            log::info!("INPUT DA DUOC MO LAI sau {}ms", duration_ms);
            true
        }
    }

    #[cfg(not(windows))]
    {
        let _ = duration_ms;
        false
    }
}

/// Hien popup canh bao tren Windows (MessageBox)
pub fn show_windows_notification(title: &str, message: &str, risk_level: &RiskLevel) {
    #[cfg(windows)]
    {
        let title_wide: Vec<u16> = title.encode_utf16().chain(std::iter::once(0)).collect();
        let message_wide: Vec<u16> = message.encode_utf16().chain(std::iter::once(0)).collect();

        let icon = match risk_level {
            RiskLevel::Critical | RiskLevel::High => MB_ICONERROR,
            _ => MB_ICONWARNING,
        };

        thread::spawn(move || {
            unsafe {
                MessageBoxW(
                    std::ptr::null_mut(),
                    message_wide.as_ptr(),
                    title_wide.as_ptr(),
                    icon | MB_OK | MB_TOPMOST | MB_SYSTEMMODAL,
                );
            }
        });
    }

    #[cfg(not(windows))]
    {
        let _ = (title, message, risk_level);
    }
}

/// Phan hoi theo muc do rui ro:
/// - Medium: chi hien thong bao
/// - High: block 2-3s + thong bao
/// - Critical: block 3-10s + thong bao
pub fn execute_response(detection: &DetectionResult, block_duration_ms: u64) -> ResponseResult {
    let mut result = ResponseResult {
        blocked: false,
        notified: false,
        error: None,
    };

    match detection.risk_level {
        RiskLevel::Normal | RiskLevel::Low => {}

        RiskLevel::Medium => {
            let message = format!(
                "Phat hien hanh vi go phim dang ngo!\n\n\
                 Risk Score: {:.0}%\nLy do:\n{}\n\nHe thong dang theo doi...",
                detection.risk_score * 100.0,
                format_reasons(&detection.reasons)
            );
            show_windows_notification("KDS Guard - Canh Bao", &message, &detection.risk_level);
            result.notified = true;
        }

        RiskLevel::High => {
            let dur = block_duration_ms.min(3000);
            let message = format!(
                "NGHI NGO HID INJECTION!\n\nRisk Score: {:.0}%\n\
                 Input bi chan trong {}ms\n\nLy do:\n{}",
                detection.risk_score * 100.0, dur,
                format_reasons(&detection.reasons)
            );
            show_windows_notification("KDS Guard - NGHI NGO TAN CONG", &message, &detection.risk_level);
            result.notified = true;
            result.blocked = block_input(dur);
        }

        RiskLevel::Critical => {
            let dur = block_duration_ms.max(3000).min(10000);
            let message = format!(
                "PHAT HIEN TAN CONG HID INJECTION!\n\nRisk Score: {:.0}%\n\
                 INPUT DA BI CHAN trong {}ms!\n\nLy do:\n{}\n\n\
                 Vui long rut thiet bi USB dang ngo.",
                detection.risk_score * 100.0, dur,
                format_reasons(&detection.reasons)
            );
            show_windows_notification("KDS Guard - PHAT HIEN TAN CONG!", &message, &detection.risk_level);
            result.notified = true;
            result.blocked = block_input(dur);

            if !result.blocked {
                result.error = Some("BlockInput that bai - can quyen Administrator.".to_string());
            }
        }
    }

    result
}

fn format_reasons(reasons: &[String]) -> String {
    reasons.iter().map(|r| format!("  - {}", r)).collect::<Vec<_>>().join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_normal_no_action() {
        let detection = DetectionResult {
            risk_score: 0.05,
            risk_level: RiskLevel::Normal,
            rule_score: 0.0,
            reasons: vec![],
            window_start_ms: 0.0,
            window_end_ms: 5000.0,
        };
        let result = execute_response(&detection, 2000);
        assert!(!result.blocked);
        assert!(!result.notified);
    }
}
