// Chinh sach phan ung khi phat hien bat thuong

use crate::detector::{DetectionResult, RiskLevel};

#[derive(Debug, Clone)]
pub enum PolicyAction {
    Allow,
    LogOnly(String),
    Alert(String),
    SoftBlock {
        message: String,
        duration_ms: u64,
    },
    Challenge {
        message: String,
        expected_input: String,
    },
}

#[derive(Debug, Clone)]
pub struct PolicyConfig {
    pub enable_alerts: bool,
    pub enable_soft_block: bool,
    pub enable_challenge: bool,
    pub soft_block_duration_ms: u64,
    pub alert_cooldown_ms: u64,
}

impl Default for PolicyConfig {
    fn default() -> Self {
        Self {
            enable_alerts: true,
            enable_soft_block: false,
            enable_challenge: false,
            soft_block_duration_ms: 2000,
            alert_cooldown_ms: 5000,
        }
    }
}

pub struct PolicyEngine {
    config: PolicyConfig,
    last_alert_time_ms: f64,
}

impl PolicyEngine {
    pub fn new(config: PolicyConfig) -> Self {
        Self {
            config,
            last_alert_time_ms: 0.0,
        }
    }

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

    fn should_alert(&self, current_time_ms: f64) -> bool {
        (current_time_ms - self.last_alert_time_ms) >= self.config.alert_cooldown_ms as f64
    }
}

fn generate_challenge() -> String {
    use std::time::SystemTime;
    let seed = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();

    // Tao chuoi 3 ky tu ngau nhien
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
