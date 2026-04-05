// KDS Guard - BadUSB Detection via Keystroke Dynamics
// Pipeline: Keyboard Events -> Collector -> Feature Extractor -> Detector -> Policy -> Alert/Block

mod input_capture;
mod logger;
mod feature;
mod detector;
mod policy;
mod response;

use std::sync::mpsc;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

use clap::Parser;
use chrono::Local;

use crate::input_capture::start_capture;
use crate::logger::{KeystrokeLogger, LoggerConfig};
use crate::feature::FeatureExtractor;
use crate::detector::{Detector, DetectorConfig};
use crate::policy::{PolicyEngine, PolicyConfig, PolicyAction};

#[derive(Parser, Debug)]
#[command(
    name = "kds_guard",
    about = "BadUSB Detection via Keystroke Dynamics Analysis",
    version
)]
struct Args {
    #[arg(short = 'o', long, default_value = "data")]
    output_dir: String,

    #[arg(short = 'u', long, default_value = "anonymous")]
    user_id: String,

    #[arg(short = 'w', long, default_value = "40")]
    window_size: usize,

    #[arg(short = 's', long, default_value = "20")]
    slide_step: usize,

    #[arg(long)]
    collect_only: bool,

    #[arg(long)]
    log_keys: bool,

    #[arg(short = 'v', long)]
    verbose: bool,

    #[arg(short = 'd', long, default_value = "0")]
    duration: u64,

    /// Xuat JSON ra stdout cho WebSocket bridge
    #[arg(long)]
    json_output: bool,
}

fn main() {
    let args = Args::parse();

    let log_level = if args.verbose { "debug" } else { "info" };
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or(log_level))
        .format_timestamp_millis()
        .init();

    println!();
    println!("╔══════════════════════════════════════════════════╗");
    println!("║  KDS Guard v{}                                 ║", env!("CARGO_PKG_VERSION"));
    println!("║  BadUSB Detection via Keystroke Dynamics         ║");
    println!("╠══════════════════════════════════════════════════╣");
    println!("║  Mode: {:<41} ║",
        if args.collect_only { "Data Collection Only" } else { "Detection Active" }
    );
    println!("║  User: {:<41} ║", args.user_id);
    println!("║  Window: {} keys, slide: {:<24} ║", args.window_size, args.slide_step);
    println!("║  Output: {:<39} ║", args.output_dir);
    if args.json_output {
        println!("║  JSON Output: ENABLED (stdout)              ║");
    }
    println!("╚══════════════════════════════════════════════════╝");
    println!();

    let session_id = Local::now().format("%Y%m%d_%H%M%S").to_string();
    let (tx, rx) = mpsc::channel();

    let collector_handle = thread::spawn(move || {
        start_capture(tx);
    });

    log::info!("Thu thap su kien ban phim bat dau...");
    if args.duration > 0 {
        log::info!("Tu dung sau {} giay.", args.duration);
    } else {
        log::info!("Nhan Ctrl+C de dung.");
    }

    let should_stop = Arc::new(AtomicBool::new(false));
    let stop_clone = should_stop.clone();
    let duration_secs = args.duration;

    if duration_secs > 0 {
        thread::spawn(move || {
            thread::sleep(Duration::from_secs(duration_secs));
            stop_clone.store(true, Ordering::Relaxed);
            println!("\nHet thoi gian! Session ket thuc.");
        });
    }

    // Processing pipeline
    let mut logger = KeystrokeLogger::new(LoggerConfig {
        output_dir: args.output_dir.into(),
        file_prefix: "keystroke_log".to_string(),
        log_key_code: args.log_keys,
        max_events_per_file: 0,
        session_id: session_id.clone(),
        user_id: args.user_id.clone(),
    });

    let mut feature_extractor = FeatureExtractor::new(args.window_size, args.slide_step);

    // Early Warning Layer: cua so nho 30 phim, phat hien payload ngan
    let mut early_extractor = FeatureExtractor::new(30, 15);
    let early_detector = Detector::new(DetectorConfig::default());

    let detector = Detector::new(DetectorConfig::default());
    let mut policy_engine = PolicyEngine::new(PolicyConfig {
        enable_alerts: true,
        enable_soft_block: true,
        enable_challenge: false,
        ..Default::default()
    });

    let json_output = args.json_output;
    let mut early_warned = false;

    loop {
        if should_stop.load(Ordering::Relaxed) {
            break;
        }

        let event = match rx.recv_timeout(Duration::from_millis(200)) {
            Ok(e) => e,
            Err(mpsc::RecvTimeoutError::Timeout) => continue,
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        };

        if let Err(e) = logger.log_event(&event) {
            log::error!("Loi ghi log: {}", e);
        }

        if args.collect_only {
            continue;
        }

        // Early Warning: cua so 30 phim — chi kiem tra R1 + R3
        if let Some(early_features) = early_extractor.process_event(&event) {
            let early_result = early_detector.analyze(&early_features);
            if early_result.risk_score >= 0.3 && !early_warned {
                early_warned = true;
                log::warn!(
                    "EARLY WARNING (30 phim): score={:.2}, speed={:.1} k/s, ft={:.1}ms",
                    early_result.risk_score,
                    early_features.typing_speed,
                    early_features.mean_flight_time
                );
                // Gui canh bao som
                let early_action = policy_engine.decide(&early_result);
                execute_action(&early_action, &early_result);
            }
        }

        // Main analysis: cua so day du
        if let Some(features) = feature_extractor.process_event(&event) {
            early_warned = false; // reset cho window tiep theo

            log::debug!(
                "Features: speed={:.1} k/s, CV={:.3}, burst={}",
                features.typing_speed,
                features.cv_flight_time,
                features.max_burst_length
            );

            let detection = detector.analyze(&features);

            // JSON output cho WebSocket bridge
            if json_output {
                let json = serde_json::json!({
                    "type": "detection",
                    "timestamp": chrono::Local::now().format("%Y-%m-%dT%H:%M:%S%.3f").to_string(),
                    "features": {
                        "mean_flight_time": features.mean_flight_time,
                        "cv_flight_time": features.cv_flight_time,
                        "typing_speed": features.typing_speed,
                        "mean_hold_time": features.mean_hold_time,
                        "iqr_hold_time": features.iqr_hold_time,
                        "max_burst_length": features.max_burst_length,
                        "modifier_ratio": features.modifier_ratio,
                        "special_ratio": features.special_ratio,
                        "min_flight_time": features.min_flight_time,
                        "p5_flight_time": features.p5_flight_time,
                        "p95_flight_time": features.p95_flight_time,
                        "std_flight_time": features.std_flight_time,
                        "inter_command_pause_count": features.inter_command_pause_count,
                        "pause_regularity": features.pause_regularity,
                        "enter_after_burst": features.enter_after_burst,
                    },
                    "result": {
                        "risk_score": detection.risk_score,
                        "rule_score": detection.rule_score,
                        "risk_level": detection.risk_level.as_str(),
                        "reasons": &detection.reasons,
                    }
                });
                println!("{}", json);
            }

            // Confidence log: forensic-grade output
            let rule_tags = build_rule_tags(&detection.reasons);
            log::info!(
                "[{} {:.2}] {} | ft={:.1}ms cv={:.3} speed={:.1}k/s burst={}",
                detection.risk_level.as_str().to_uppercase(),
                detection.risk_score,
                rule_tags,
                features.mean_flight_time,
                features.cv_flight_time,
                features.typing_speed,
                features.max_burst_length
            );

            let action = policy_engine.decide(&detection);
            execute_action(&action, &detection);
        }
    }

    if should_stop.load(Ordering::Relaxed) {
        println!();
        log::info!("KDS Guard da dung. Tong {} events da ghi.", logger.event_count());
        log::info!("File log: {}", logger.log_path().display());
        std::process::exit(0);
    }

    if let Err(e) = collector_handle.join() {
        log::error!("Collector thread error: {:?}", e);
    }

    println!();
    log::info!("KDS Guard da dung. Tong {} events da ghi.", logger.event_count());
    log::info!("File log: {}", logger.log_path().display());
}

fn execute_action(action: &PolicyAction, detection: &detector::DetectionResult) {
    match action {
        PolicyAction::Allow => {}
        PolicyAction::LogOnly(msg) => {
            log::debug!("{}", msg);
        }
        PolicyAction::Alert(msg) => {
            print_alert_box(detection);
            log::warn!("{}", msg);

            let resp = response::execute_response(detection, 0);
            if resp.notified {
                log::info!("Da gui thong bao Windows");
            }
        }
        PolicyAction::SoftBlock { message, duration_ms } => {
            println!();
            println!("╔══════════════════════════════════════════════════╗");
            println!("║  BLOCK INPUT - Risk Score: {:.2}                 ║", detection.risk_score);
            println!("╠══════════════════════════════════════════════════╣");
            for reason in &detection.reasons {
                println!("║  - {:<46} ║", truncate_str(reason, 46));
            }
            println!("║  Chan trong: {}ms{:>33} ║", duration_ms, "");
            println!("╚══════════════════════════════════════════════════╝");
            println!();

            log::error!("SOFT BLOCK ({} ms): {}", duration_ms, message);

            let resp = response::execute_response(detection, *duration_ms);
            if resp.blocked {
                log::warn!("Input da duoc mo lai");
            } else if let Some(err) = resp.error {
                log::error!("{}", err);
            }
        }
        PolicyAction::Challenge { message, expected_input } => {
            log::error!("CHALLENGE: {} (expected: {})", message, expected_input);
            println!("\nXAC MINH DANH TINH");
            println!("{}", message);
            println!("Nhap chuoi: {}", expected_input);
            println!();

            response::show_windows_notification(
                "KDS Guard - Xac minh danh tinh",
                &format!("{}\nNhap chuoi: {}", message, expected_input),
                &detection.risk_level,
            );
        }
    }
}

fn print_alert_box(detection: &detector::DetectionResult) {
    println!();
    println!("╔══════════════════════════════════════════════════╗");
    println!("║  {} CANH BAO - Risk Score: {:.2}                ║",
        detection.risk_level.emoji(),
        detection.risk_score
    );
    println!("╠══════════════════════════════════════════════════╣");
    for reason in &detection.reasons {
        println!("║  - {:<46} ║", truncate_str(reason, 46));
    }
    println!("╚══════════════════════════════════════════════════╝");
    println!();
}

fn truncate_str(s: &str, max_len: usize) -> String {
    if s.len() > max_len {
        format!("{}...", &s[..max_len - 3])
    } else {
        s.to_string()
    }
}

/// Map reason strings to compact rule tags: R1+R3+R8
fn build_rule_tags(reasons: &[String]) -> String {
    let mut tags = Vec::new();
    for r in reasons {
        let lower = r.to_lowercase();
        if lower.contains("flight time") && lower.contains("thấp") { tags.push("R1"); }
        if lower.contains("cv") && lower.contains("thấp") { tags.push("R2"); }
        if lower.contains("tốc độ") { tags.push("R3"); }
        if lower.contains("burst") && !lower.contains("injection") { tags.push("R4"); }
        if lower.contains("hold time") { tags.push("R5"); }
        if lower.contains("modifier") { tags.push("R6"); }
        if lower.contains("tối thiểu") { tags.push("R7"); }
        if lower.contains("injection") { tags.push("R8"); }
    }
    if tags.is_empty() {
        "OK".to_string()
    } else {
        tags.join("+")
    }
}
