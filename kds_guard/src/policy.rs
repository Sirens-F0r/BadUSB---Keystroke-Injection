//! Module chính sách phản ứng (Response Engine)
//!
//! Quyết định hành động dựa trên risk score:
//! - Level 1: Cảnh báo (notification)
//! - Level 2: Drop input tạm thời (soft block)
//! - Level 3: Yêu cầu xác minh (challenge)

use crate::detector::{DetectionResult, RiskLevel};

/// Hành động phản ứng
#[derive(Debug, Clone)]
pub enum PolicyAction {
    /// Cho phép, không làm gì
    Allow,
    /// Ghi log để giám sát
    LogOnly(String),
    /// Hiển thị cảnh báo cho người dùng
    Alert(String),
    /// Chặn tạm thời input (soft block)
    SoftBlock {
        message: String,
        duration_ms: u64,
    },
    /// Yêu cầu xác minh (challenge)
    Challenge {
        message: String,
        expected_input: String,
    },
}

/// Cấu hình chính sách
#[derive(Debug, Clone)]
pub struct PolicyConfig {
    /// Bật/tắt cảnh báo
    pub enable_alerts: bool,
    /// Bật/tắt soft block
    pub enable_soft_block: bool,
    /// Bật/tắt challenge
    pub enable_challenge: bool,
    /// Thời gian soft block (ms)
    pub soft_block_duration_ms: u64,
    /// Cooldown giữa các cảnh báo (ms) - tránh spam
    pub alert_cooldown_ms: u64,
}

impl Default for PolicyConfig {
    fn default() -> Self {
        Self {
            enable_alerts: true,
            enable_soft_block: false,  // Tắt mặc định, bật khi cần
            enable_challenge: false,    // Tắt mặc định
            soft_block_duration_ms: 2000,
            alert_cooldown_ms: 5000,
        }
    }
}

/// Policy Engine - quyết định hành động phản ứng
pub struct PolicyEngine {
    config: PolicyConfig,
    last_alert_time_ms: f64,
}

impl PolicyEngine {
    /// Tạo PolicyEngine mới
    pub fn new(config: PolicyConfig) -> Self {
        Self {
            config,
            last_alert_time_ms: 0.0,
        }
    }

    /// Quyết định hành động dựa trên kết quả phát hiện
    pub fn decide(&mut self, result: &DetectionResult) -> PolicyAction {
        match result.risk_level {
            RiskLevel::Normal => PolicyAction::Allow,

            RiskLevel::Low => {
                PolicyAction::LogOnly(format!(
                    "[LOW] Score: {:.2} | {}",
                    result.risk_score,
                    result.reasons.join("; ")
                ))
            }

            RiskLevel::Medium => {
                if self.config.enable_alerts && self.should_alert(result.window_end_ms) {
                    self.last_alert_time_ms = result.window_end_ms;
                    PolicyAction::Alert(format!(
                        "⚠️ Phát hiện hành vi gõ phím đáng ngờ!\nScore: {:.2}\nLý do: {}",
                        result.risk_score,
                        result.reasons.join("\n- ")
                    ))
                } else {
                    PolicyAction::LogOnly(format!(
                        "[MEDIUM] Score: {:.2} | {}",
                        result.risk_score,
                        result.reasons.join("; ")
                    ))
                }
            }

            RiskLevel::High => {
                if self.config.enable_soft_block {
                    PolicyAction::SoftBlock {
                        message: format!(
                            "🟠 CẢNH BÁO: Nghi ngờ HID Injection!\nScore: {:.2}\n{}",
                            result.risk_score,
                            result.reasons.join("\n- ")
                        ),
                        duration_ms: self.config.soft_block_duration_ms,
                    }
                } else {
                    self.last_alert_time_ms = result.window_end_ms;
                    PolicyAction::Alert(format!(
                        "🟠 NGHI NGỜ HID INJECTION!\nRisk Score: {:.2}\nLý do:\n- {}",
                        result.risk_score,
                        result.reasons.join("\n- ")
                    ))
                }
            }

            RiskLevel::Critical => {
                if self.config.enable_challenge {
                    let challenge = generate_challenge();
                    PolicyAction::Challenge {
                        message: format!(
                            "🔴 PHÁT HIỆN TẤN CÔNG HID INJECTION!\nScore: {:.2}\nVui lòng nhập chuỗi xác minh:",
                            result.risk_score
                        ),
                        expected_input: challenge,
                    }
                } else {
                    self.last_alert_time_ms = result.window_end_ms;
                    PolicyAction::Alert(format!(
                        "🔴 PHÁT HIỆN TẤN CÔNG HID INJECTION!\nRisk Score: {:.2}\nLý do:\n- {}",
                        result.risk_score,
                        result.reasons.join("\n- ")
                    ))
                }
            }
        }
    }

    /// Kiểm tra cooldown cảnh báo
    fn should_alert(&self, current_time_ms: f64) -> bool {
        (current_time_ms - self.last_alert_time_ms) >= self.config.alert_cooldown_ms as f64
    }
}

/// Tạo chuỗi challenge ngẫu nhiên (human-in-the-loop verification)
fn generate_challenge() -> String {
    use std::time::SystemTime;
    let seed = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();

    // Tạo chuỗi 3 ký tự ngẫu nhiên đơn giản
    let chars = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let c1 = chars[(seed % chars.len() as u128) as usize] as char;
    let c2 = chars[((seed / 31) % chars.len() as u128) as usize] as char;
    let c3 = chars[((seed / 961) % chars.len() as u128) as usize] as char;

    format!("{}{}{}", c1, c2, c3)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::detector::{DetectionResult, RiskLevel};

    fn make_result(risk_level: RiskLevel, score: f64) -> DetectionResult {
        DetectionResult {
            risk_score: score,
            risk_level,
            rule_score: score,
            reasons: vec!["Test reason".to_string()],
            window_start_ms: 0.0,
            window_end_ms: 10000.0,
        }
    }

    #[test]
    fn test_normal_allows() {
        let mut engine = PolicyEngine::new(PolicyConfig::default());
        let action = engine.decide(&make_result(RiskLevel::Normal, 0.05));
        assert!(matches!(action, PolicyAction::Allow));
    }

    #[test]
    fn test_critical_alerts() {
        let mut engine = PolicyEngine::new(PolicyConfig::default());
        let action = engine.decide(&make_result(RiskLevel::Critical, 0.95));
        assert!(matches!(action, PolicyAction::Alert(_)));
    }
}
