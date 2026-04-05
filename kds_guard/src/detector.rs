// Phat hien bat thuong bang rule-based va hybrid scoring

use crate::feature::FeatureVector;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum RiskLevel {
    Normal,
    Low,
    Medium,
    High,
    Critical,
}

impl RiskLevel {

    pub fn as_str(&self) -> &str {
        match self {
            RiskLevel::Normal => "NORMAL",
            RiskLevel::Low => "LOW",
            RiskLevel::Medium => "MEDIUM",
            RiskLevel::High => "HIGH",
            RiskLevel::Critical => "CRITICAL",
        }
    }


    pub fn emoji(&self) -> &str {
        match self {
            RiskLevel::Normal => "✅",
            RiskLevel::Low => "🔵",
            RiskLevel::Medium => "🟡",
            RiskLevel::High => "🟠",
            RiskLevel::Critical => "🔴",
        }
    }
}

#[derive(Debug, Clone)]
pub struct DetectionResult {
    pub risk_score: f64,
    pub risk_level: RiskLevel,
    pub rule_score: f64,
    pub reasons: Vec<String>,
    pub window_start_ms: f64,
    pub window_end_ms: f64,
}

#[derive(Debug, Clone)]
pub struct DetectorConfig {
    pub ft_mean_threshold_ms: f64,
    pub ft_cv_threshold: f64,
    pub max_human_speed: f64,
    pub burst_length_threshold: usize,
    pub ht_iqr_threshold_ms: f64,
    pub modifier_ratio_threshold: f64,
    pub rule_weight: f64,
    pub anomaly_weight: f64,
    pub threshold_medium: f64,
    pub threshold_high: f64,
    pub threshold_critical: f64,
}

impl Default for DetectorConfig {
    fn default() -> Self {
        Self {
            ft_mean_threshold_ms: 30.0,
            ft_cv_threshold: 0.15,
            max_human_speed: 20.0,
            burst_length_threshold: 15,
            ht_iqr_threshold_ms: 5.0,
            modifier_ratio_threshold: 0.4,
            rule_weight: 1.0,
            anomaly_weight: 0.0,
            threshold_medium: 0.3,
            threshold_high: 0.6,
            threshold_critical: 0.8,
        }
    }
}

pub struct Detector {
    config: DetectorConfig,
}

impl Detector {
    pub fn new(config: DetectorConfig) -> Self {
        Self { config }
    }

    pub fn analyze(&self, features: &FeatureVector) -> DetectionResult {
        let mut score: f64 = 0.0;
        let mut reasons: Vec<String> = Vec::new();

        // Rule 1: Flight Time qua nhanh
        if features.mean_flight_time > 0.0
            && features.mean_flight_time < self.config.ft_mean_threshold_ms
        {
            let contribution = 0.3;
            score += contribution;
            reasons.push(format!(
                "Flight time trung bình rất thấp: {:.1}ms (ngưỡng: {:.1}ms)",
                features.mean_flight_time, self.config.ft_mean_threshold_ms
            ));
        }

        // Rule 2: CV qua thap (go deu nhu may)
        if features.cv_flight_time > 0.0
            && features.cv_flight_time < self.config.ft_cv_threshold
        {
            let contribution = 0.25;
            score += contribution;
            reasons.push(format!(
                "Hệ số biến thiên CV rất thấp: {:.3} (ngưỡng: {:.3})",
                features.cv_flight_time, self.config.ft_cv_threshold
            ));
        }

        // Rule 3: Toc do vuot nguong
        // Ket hop: speed > 20 keys/s VA mean_flight_time < 50ms
        // Tranh false positive voi nguoi go nhanh nhung co nhip tu nhien
        if features.typing_speed > self.config.max_human_speed
            && features.mean_flight_time < 50.0
        {
            let excess = features.typing_speed / self.config.max_human_speed;
            let contribution = (0.2 * excess).min(0.35);
            score += contribution;
            reasons.push(format!(
                "Tốc độ gõ bất thường: {:.1} keys/s (ngưỡng: {:.1}), ft={:.1}ms",
                features.typing_speed, self.config.max_human_speed,
                features.mean_flight_time
            ));
        }

        // Rule 4: Burst pattern
        if features.has_burst && features.max_burst_length >= self.config.burst_length_threshold {
            let contribution = 0.2;
            score += contribution;
            reasons.push(format!(
                "Burst pattern detected: {} phím liên tiếp < 50ms",
                features.max_burst_length
            ));
        }

        // Rule 5: Hold Time qua deu
        if features.iqr_hold_time > 0.0
            && features.iqr_hold_time < self.config.ht_iqr_threshold_ms
        {
            let contribution = 0.15;
            score += contribution;
            reasons.push(format!(
                "Hold time rất đều (IQR: {:.2}ms, ngưỡng: {:.2}ms)",
                features.iqr_hold_time, self.config.ht_iqr_threshold_ms
            ));
        }

        // Rule 6: Ti le modifier
        if features.modifier_ratio > self.config.modifier_ratio_threshold {
            let contribution = 0.1;
            score += contribution;
            reasons.push(format!(
                "Tỉ lệ phím modifier cao: {:.1}% (ngưỡng: {:.1}%)",
                features.modifier_ratio * 100.0,
                self.config.modifier_ratio_threshold * 100.0
            ));
        }

        // Rule 7: Min flight time cuc thap
        if features.min_flight_time > 0.0 && features.min_flight_time < 5.0 {
            let contribution = 0.1;
            score += contribution;
            reasons.push(format!(
                "Flight time tối thiểu cực thấp: {:.2}ms",
                features.min_flight_time
            ));
        }

        // Rule 8: Injection Fingerprint — khoang nghi deu giua cac cum go nhanh + Enter sau burst
        if features.inter_command_pause_count >= 2 && features.pause_regularity < 0.3 {
            let mut contribution = 0.15;
            if features.enter_after_burst > 0.3 {
                contribution += 0.1; // bonus: Enter sau burst = dang chay script tung dong
            }
            score += contribution;
            reasons.push(format!(
                "Injection fingerprint: {} khoảng nghỉ đều (CV={:.2}), Enter/burst={:.0}%",
                features.inter_command_pause_count,
                features.pause_regularity,
                features.enter_after_burst * 100.0
            ));
        }


        let rule_score = score.min(1.0);

        // Hybrid score
        let risk_score = (self.config.rule_weight * rule_score
            + self.config.anomaly_weight * 0.0)
            / (self.config.rule_weight + self.config.anomaly_weight).max(1.0);


        let risk_level = if risk_score >= self.config.threshold_critical {
            RiskLevel::Critical
        } else if risk_score >= self.config.threshold_high {
            RiskLevel::High
        } else if risk_score >= self.config.threshold_medium {
            RiskLevel::Medium
        } else if risk_score > 0.1 {
            RiskLevel::Low
        } else {
            RiskLevel::Normal
        };

        if reasons.is_empty() {
            reasons.push("Hành vi gõ phím bình thường".to_string());
        }

        DetectionResult {
            risk_score,
            risk_level,
            rule_score,
            reasons,
            window_start_ms: features.window_start_ms,
            window_end_ms: features.window_end_ms,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_normal_features() -> FeatureVector {
        FeatureVector {
            window_start_ms: 0.0,
            window_end_ms: 5000.0,
            num_keys: 40,
            mean_hold_time: 100.0,
            std_hold_time: 30.0,
            median_hold_time: 95.0,
            iqr_hold_time: 40.0,
            mean_flight_time: 200.0,
            std_flight_time: 80.0,
            median_flight_time: 180.0,
            iqr_flight_time: 60.0,
            cv_flight_time: 0.4,
            typing_speed: 8.0,
            modifier_ratio: 0.05,
            special_ratio: 0.02,
            has_burst: false,
            max_burst_length: 0,
            min_flight_time: 80.0,
            p5_flight_time: 100.0,
            p95_flight_time: 350.0,
            inter_command_pause_count: 0,
            pause_regularity: 1.0,
            enter_after_burst: 0.0,
        }
    }

    fn make_injection_features() -> FeatureVector {
        FeatureVector {
            window_start_ms: 0.0,
            window_end_ms: 800.0,
            num_keys: 40,
            mean_hold_time: 10.0,
            std_hold_time: 1.0,
            median_hold_time: 10.0,
            iqr_hold_time: 2.0,
            mean_flight_time: 20.0,
            std_flight_time: 1.5,
            median_flight_time: 20.0,
            iqr_flight_time: 2.0,
            cv_flight_time: 0.075,
            typing_speed: 50.0,
            modifier_ratio: 0.1,
            special_ratio: 0.15,
            has_burst: true,
            max_burst_length: 35,
            min_flight_time: 18.0,
            p5_flight_time: 19.0,
            p95_flight_time: 22.0,
            inter_command_pause_count: 5,
            pause_regularity: 0.08,
            enter_after_burst: 0.6,
        }
    }

    #[test]
    fn test_normal_typing_not_flagged() {
        let detector = Detector::new(DetectorConfig::default());
        let result = detector.analyze(&make_normal_features());
        assert!(matches!(result.risk_level, RiskLevel::Normal | RiskLevel::Low));
        assert!(result.risk_score < 0.3);
    }

    #[test]
    fn test_injection_detected() {
        let detector = Detector::new(DetectorConfig::default());
        let result = detector.analyze(&make_injection_features());
        assert!(matches!(
            result.risk_level,
            RiskLevel::High | RiskLevel::Critical
        ));
        assert!(result.risk_score > 0.6);
    }
}
