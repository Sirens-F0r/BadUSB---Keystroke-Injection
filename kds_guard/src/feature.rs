// Trich xuat dac trung keystroke dynamics theo cua so truot

use std::collections::VecDeque;

use crate::input_capture::KeyEvent;

#[derive(Debug, Clone, serde::Serialize)]
pub struct FeatureVector {
    pub window_start_ms: f64,
    pub window_end_ms: f64,
    pub num_keys: usize,

    // Hold Time
    pub mean_hold_time: f64,
    pub std_hold_time: f64,
    pub median_hold_time: f64,
    pub iqr_hold_time: f64,

    // Flight Time
    pub mean_flight_time: f64,
    pub std_flight_time: f64,
    pub median_flight_time: f64,
    pub iqr_flight_time: f64,

    // Cac chi so phat hien injection
    pub cv_flight_time: f64,
    pub typing_speed: f64,
    pub modifier_ratio: f64,
    pub special_ratio: f64,
    pub has_burst: bool,
    pub max_burst_length: usize,
    pub min_flight_time: f64,
    pub p5_flight_time: f64,
    pub p95_flight_time: f64,

    // Injection Fingerprint (dau van tay injection)
    pub inter_command_pause_count: usize,  // so lan co khoang nghi > 80ms giua cac cum phim nhanh
    pub pause_regularity: f64,             // CV cua cac khoang nghi — may nghi deu, nguoi nghi khong deu
    pub enter_after_burst: f64,            // ty le Enter xuat hien ngay sau burst
}

#[derive(Clone)]
struct KeyPair {
    key_code: String,
    key_class: String,
    is_modifier: bool,
    down_time: f64,
    up_time: Option<f64>,
}

pub struct FeatureExtractor {
    window_size: usize,
    slide_step: usize,
    completed_pairs: VecDeque<KeyPair>,
    pending_downs: Vec<KeyPair>,
    keys_since_last_extract: usize,
    burst_threshold_ms: f64,
    burst_min_keys: usize,
}

impl FeatureExtractor {
    pub fn new(window_size: usize, slide_step: usize) -> Self {
        Self {
            window_size,
            slide_step,
            completed_pairs: VecDeque::new(),
            pending_downs: Vec::new(),
            keys_since_last_extract: 0,
            burst_threshold_ms: 50.0,
            burst_min_keys: 10,
        }
    }

    pub fn process_event(&mut self, event: &KeyEvent) -> Option<FeatureVector> {
        match event.event_type.as_str() {
            "down" => {
                self.pending_downs.push(KeyPair {
                    key_code: event.key_code.clone(),
                    key_class: event.key_class.clone(),
                    is_modifier: event.is_modifier,
                    down_time: event.timestamp_ms,
                    up_time: None,
                });
            }
            "up" => {
                // Tim key_down tuong ung
                if let Some(pos) = self
                    .pending_downs
                    .iter()
                    .rposition(|p| p.key_code == event.key_code && p.up_time.is_none())
                {
                    let mut pair = self.pending_downs.remove(pos);
                    pair.up_time = Some(event.timestamp_ms);
                    self.completed_pairs.push_back(pair);
                    self.keys_since_last_extract += 1;
                }
            }
            _ => {}
        }

        // Kiem tra da du cua so chua
        if self.completed_pairs.len() >= self.window_size
            && self.keys_since_last_extract >= self.slide_step
        {
            self.keys_since_last_extract = 0;
            Some(self.extract_features())
        } else {
            None
        }
    }

    fn extract_features(&mut self) -> FeatureVector {
        // Lay window_size phim gan nhat
        let pairs: Vec<KeyPair> = self
            .completed_pairs
            .iter()
            .rev()
            .take(self.window_size)
            .cloned()
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .collect();

        // Hold Times
        let hold_times: Vec<f64> = pairs
            .iter()
            .filter_map(|p| p.up_time.map(|up| up - p.down_time))
            .filter(|ht| *ht > 0.0 && *ht < 2000.0)
            .collect();

        // Flight Times (Down-Down)
        let flight_times: Vec<f64> = pairs
            .windows(2)
            .map(|w| w[1].down_time - w[0].down_time)
            .filter(|ft| *ft > 0.0 && *ft < 5000.0)
            .collect();


        let (mean_ht, std_ht, median_ht, iqr_ht) = compute_stats(&hold_times);
        let (mean_ft, std_ft, median_ft, iqr_ft) = compute_stats(&flight_times);

        // CV
        let cv_ft = if mean_ft > 0.0 { std_ft / mean_ft } else { 0.0 };

        // Typing speed
        let window_duration_s = if let (Some(first), Some(last)) = (pairs.first(), pairs.last()) {
            (last.down_time - first.down_time) / 1000.0
        } else {
            1.0
        };
        let typing_speed = if window_duration_s > 0.0 {
            pairs.len() as f64 / window_duration_s
        } else {
            0.0
        };

        // Modifier & Special ratio
        let modifier_count = pairs.iter().filter(|p| p.is_modifier).count();
        let special_count = pairs.iter().filter(|p| p.key_class == "special").count();
        let total = pairs.len().max(1) as f64;
        let modifier_ratio = modifier_count as f64 / total;
        let special_ratio = special_count as f64 / total;

        // Burst detection
        let (has_burst, max_burst_length) = self.detect_burst(&flight_times);

        // Percentiles
        let min_ft = flight_times.iter().copied().fold(f64::INFINITY, f64::min);
        let p5_ft = percentile(&flight_times, 5.0);
        let p95_ft = percentile(&flight_times, 95.0);

        // Injection Fingerprint
        let injection_fp = self.detect_injection_fingerprint(&pairs, &flight_times);


        let window_start = pairs.first().map(|p| p.down_time).unwrap_or(0.0);
        let window_end = pairs.last().map(|p| p.down_time).unwrap_or(0.0);

        while self.completed_pairs.len() > self.window_size * 2 {
            self.completed_pairs.pop_front();
        }

        FeatureVector {
            window_start_ms: window_start,
            window_end_ms: window_end,
            num_keys: pairs.len(),
            mean_hold_time: mean_ht,
            std_hold_time: std_ht,
            median_hold_time: median_ht,
            iqr_hold_time: iqr_ht,
            mean_flight_time: mean_ft,
            std_flight_time: std_ft,
            median_flight_time: median_ft,
            iqr_flight_time: iqr_ft,
            cv_flight_time: cv_ft,
            typing_speed,
            modifier_ratio,
            special_ratio,
            has_burst,
            max_burst_length,
            min_flight_time: if min_ft.is_finite() { min_ft } else { 0.0 },
            p5_flight_time: p5_ft,
            p95_flight_time: p95_ft,
            inter_command_pause_count: injection_fp.0,
            pause_regularity: injection_fp.1,
            enter_after_burst: injection_fp.2,
        }
    }

    /// Phat hien dau van tay injection:
    /// 1. inter_command_pause_count: so lan co khoang nghi > 80ms giua cac cum go nhanh
    /// 2. pause_regularity: CV cua cac khoang nghi (may nghi deu → CV thap)
    /// 3. enter_after_burst: ty le Enter xuat hien ngay sau chuoi go nhanh
    fn detect_injection_fingerprint(
        &self,
        pairs: &[KeyPair],
        flight_times: &[f64],
    ) -> (usize, f64, f64) {
        // Tim cac khoang nghi giua cac cum phim nhanh
        let pause_threshold = 80.0; // ms
        let fast_threshold = self.burst_threshold_ms; // 50ms
        let mut pauses: Vec<f64> = Vec::new();
        let mut was_fast = false;

        for ft in flight_times {
            if *ft < fast_threshold {
                was_fast = true;
            } else if was_fast && *ft >= pause_threshold {
                pauses.push(*ft);
                was_fast = false;
            } else {
                was_fast = false;
            }
        }

        let pause_count = pauses.len();

        // CV cua cac khoang nghi
        let pause_regularity = if pauses.len() >= 2 {
            let mean = pauses.iter().sum::<f64>() / pauses.len() as f64;
            let variance = pauses.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / pauses.len() as f64;
            if mean > 0.0 { variance.sqrt() / mean } else { 0.0 }
        } else {
            1.0 // khong du du lieu → gia dinh la nguoi (CV cao)
        };

        // Ty le Enter xuat hien ngay sau burst
        let mut enter_after_count = 0;
        let mut burst_end_count = 0;

        for i in 1..pairs.len() {
            let ft = pairs[i].down_time - pairs[i - 1].down_time;
            if ft >= pause_threshold && i >= 2 {
                // Kiem tra phim truoc khoang nghi co phai ket thuc burst khong
                let prev_ft = pairs[i - 1].down_time - pairs[i - 2].down_time;
                if prev_ft < fast_threshold {
                    burst_end_count += 1;
                    // Phim ngay truoc khoang nghi la gi?
                    let key = &pairs[i - 1].key_code;
                    if key == "Return" || key == "Enter" {
                        enter_after_count += 1;
                    }
                }
            }
        }

        let enter_ratio = if burst_end_count > 0 {
            enter_after_count as f64 / burst_end_count as f64
        } else {
            0.0
        };

        (pause_count, pause_regularity, enter_ratio)
    }

    fn detect_burst(&self, flight_times: &[f64]) -> (bool, usize) {
        let mut max_burst = 0;
        let mut current_burst = 0;

        for ft in flight_times {
            if *ft < self.burst_threshold_ms {
                current_burst += 1;
                max_burst = max_burst.max(current_burst);
            } else {
                current_burst = 0;
            }
        }

        (max_burst >= self.burst_min_keys, max_burst)
    }
}

// Ham thong ke

fn compute_stats(data: &[f64]) -> (f64, f64, f64, f64) {
    if data.is_empty() {
        return (0.0, 0.0, 0.0, 0.0);
    }

    let n = data.len() as f64;

    // Mean
    let mean = data.iter().sum::<f64>() / n;

    // Std
    let variance = data.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / n;
    let std = variance.sqrt();

    // Median
    let median = percentile(data, 50.0);

    // IQR = Q3 - Q1
    let q1 = percentile(data, 25.0);
    let q3 = percentile(data, 75.0);
    let iqr = q3 - q1;

    (mean, std, median, iqr)
}

fn percentile(data: &[f64], p: f64) -> f64 {
    if data.is_empty() {
        return 0.0;
    }

    let mut sorted = data.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));

    let rank = (p / 100.0) * (sorted.len() - 1) as f64;
    let lower = rank.floor() as usize;
    let upper = rank.ceil() as usize;
    let fraction = rank - lower as f64;

    if lower == upper || upper >= sorted.len() {
        sorted[lower.min(sorted.len() - 1)]
    } else {
        sorted[lower] * (1.0 - fraction) + sorted[upper] * fraction
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compute_stats_basic() {
        let data = vec![10.0, 20.0, 30.0, 40.0, 50.0];
        let (mean, std, median, iqr) = compute_stats(&data);
        assert!((mean - 30.0).abs() < 0.01);
        assert!((median - 30.0).abs() < 0.01);
        assert!(std > 0.0);
        assert!(iqr > 0.0);
    }

    #[test]
    fn test_compute_stats_empty() {
        let data: Vec<f64> = vec![];
        let (mean, std, median, iqr) = compute_stats(&data);
        assert_eq!(mean, 0.0);
        assert_eq!(std, 0.0);
        assert_eq!(median, 0.0);
        assert_eq!(iqr, 0.0);
    }

    #[test]
    fn test_percentile() {
        let data = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        assert!((percentile(&data, 50.0) - 3.0).abs() < 0.01);
        assert!((percentile(&data, 0.0) - 1.0).abs() < 0.01);
        assert!((percentile(&data, 100.0) - 5.0).abs() < 0.01);
    }

    #[test]
    fn test_burst_detection() {
        let extractor = FeatureExtractor::new(30, 15);

        // Mô phỏng BadUSB: 15 phím liên tiếp < 50ms
        let fast_fts: Vec<f64> = vec![20.0; 15];
        let (has_burst, max_len) = extractor.detect_burst(&fast_fts);
        assert!(has_burst);
        assert_eq!(max_len, 15);

        // Người bình thường: flight time > 50ms
        let normal_fts: Vec<f64> = vec![120.0, 150.0, 80.0, 200.0, 90.0];
        let (has_burst, _) = extractor.detect_burst(&normal_fts);
        assert!(!has_burst);
    }
}
