//! KDS Guard - BadUSB Detection via Keystroke Dynamics
//!
//! Hệ thống phát hiện & ngăn chặn tấn công chèn phím giả mạo (BadUSB)
//! bằng phân tích dữ liệu động học gõ phím (Keystroke Dynamics).
//!
//! Pipeline:
//!   Keyboard Events → Collector → Feature Extractor → Detector → Policy → Alert/Block

mod input_capture;
mod logger;
mod feature;
mod detector;
mod policy;

use std::sync::mpsc;
use std::sync::Arc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::{Duration, Instant};

use clap::Parser;
use chrono::Local;

use crate::input_capture::start_capture;
use crate::logger::{KeystrokeLogger, LoggerConfig};
use crate::feature::FeatureExtractor;
use crate::detector::{Detector, DetectorConfig};
use crate::policy::{PolicyEngine, PolicyConfig, PolicyAction};

/// KDS Guard - Keystroke Dynamics Security Guard
#[derive(Parser, Debug)]
#[command(
    name = "kds_guard",
    about = "🛡️ BadUSB Detection via Keystroke Dynamics Analysis",
    version
)]
struct Args {
    /// Thư mục lưu dữ liệu thu thập
    #[arg(short = 'o', long, default_value = "data")]
    output_dir: String,

    /// User ID (ẩn danh) cho dataset
    #[arg(short = 'u', long, default_value = "anonymous")]
    user_id: String,

    /// Kích thước cửa sổ phân tích (số phím)
    #[arg(short = 'w', long, default_value = "40")]
    window_size: usize,

    /// Bước trượt cửa sổ
    #[arg(short = 's', long, default_value = "20")]
    slide_step: usize,

    /// Chế độ chỉ thu thập (không phát hiện)
    #[arg(long)]
    collect_only: bool,

    /// Có lưu key_code chi tiết không (false = chỉ lưu key_class)
    #[arg(long)]
    log_keys: bool,

    /// Bật chế độ verbose logging
    #[arg(short = 'v', long)]
    verbose: bool,

    /// Thời gian thu thập (giây). 0 = không giới hạn, dùng Ctrl+C
    #[arg(short = 'd', long, default_value = "0")]
    duration: u64,
}

fn main() {
    let args = Args::parse();

    // Khởi tạo logger
    let log_level = if args.verbose { "debug" } else { "info" };
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or(log_level))
        .format_timestamp_millis()
        .init();

    // Banner
    println!();
    println!("╔══════════════════════════════════════════════════╗");
    println!("║  🛡️  KDS Guard v{}                            ║", env!("CARGO_PKG_VERSION"));
    println!("║  BadUSB Detection via Keystroke Dynamics         ║");
    println!("╠══════════════════════════════════════════════════╣");
    println!("║  Mode: {:<41} ║",
        if args.collect_only { "📊 Data Collection Only" } else { "🔍 Detection Active" }
    );
    println!("║  User: {:<41} ║", args.user_id);
    println!("║  Window: {} keys, slide: {:<24} ║", args.window_size, args.slide_step);
    println!("║  Output: {:<39} ║", args.output_dir);
    println!("╚══════════════════════════════════════════════════╝");
    println!();

    let session_id = Local::now().format("%Y%m%d_%H%M%S").to_string();

    // === Channel: Collector → Processing ===
    let (tx, rx) = mpsc::channel();

    // === Thread 1: Keyboard Collector ===
    let collector_handle = thread::spawn(move || {
        start_capture(tx);
    });

    log::info!("🎹 Thu thập sự kiện bàn phím bắt đầu...");
    if args.duration > 0 {
        log::info!("   ⏱️  Tự dừng sau {} giây.", args.duration);
    } else {
        log::info!("   Nhấn Ctrl+C để dừng.");
    }

    // Timer thread: tự dừng sau --duration giây
    let should_stop = Arc::new(AtomicBool::new(false));
    let stop_clone = should_stop.clone();
    let duration_secs = args.duration;

    if duration_secs > 0 {
        thread::spawn(move || {
            thread::sleep(Duration::from_secs(duration_secs));
            stop_clone.store(true, Ordering::Relaxed);
            println!();
            println!("⏱️  Het thoi gian! Session ket thuc.");
        });
    }

    // === Main thread: Processing pipeline ===
    let mut logger = KeystrokeLogger::new(LoggerConfig {
        output_dir: args.output_dir.into(),
        file_prefix: "keystroke_log".to_string(),
        log_key_code: args.log_keys,
        max_events_per_file: 0,
        session_id: session_id.clone(),
        user_id: args.user_id.clone(),
    });

    let mut feature_extractor = FeatureExtractor::new(args.window_size, args.slide_step);
    let detector = Detector::new(DetectorConfig::default());
    let mut policy_engine = PolicyEngine::new(PolicyConfig {
        enable_alerts: true,
        enable_soft_block: false,
        enable_challenge: false,
        ..Default::default()
    });

    // Xử lý từng event
    let start_time = Instant::now();
    loop {
        // Kiểm tra timer
        if should_stop.load(Ordering::Relaxed) {
            break;
        }

        // Nhận event với timeout ngắn để kiểm tra timer
        let event = match rx.recv_timeout(Duration::from_millis(200)) {
            Ok(e) => e,
            Err(mpsc::RecvTimeoutError::Timeout) => continue,
            Err(mpsc::RecvTimeoutError::Disconnected) => break,
        };

        // 1. Ghi log
        if let Err(e) = logger.log_event(&event) {
            log::error!("Lỗi ghi log: {}", e);
        }

        // 2. Nếu chỉ thu thập → bỏ qua detection
        if args.collect_only {
            continue;
        }

        // 3. Feature extraction
        if let Some(features) = feature_extractor.process_event(&event) {
            log::debug!(
                "📊 Features: speed={:.1} k/s, CV={:.3}, burst={}",
                features.typing_speed,
                features.cv_flight_time,
                features.max_burst_length
            );

            // 4. Detection
            let detection = detector.analyze(&features);

            // 5. Policy response
            let action = policy_engine.decide(&detection);

            // 6. Thực thi hành động
            execute_action(&action, &detection);
        }
    }

    // Nếu dừng do timer → log rồi exit ngay (rdev::listen block mãi không return)
    if should_stop.load(Ordering::Relaxed) {
        println!();
        log::info!("✅ KDS Guard đã dừng. Tổng {} events đã ghi.", logger.event_count());
        log::info!("📄 File log: {}", logger.log_path().display());
        std::process::exit(0);
    }

    // Đợi collector thread (chỉ khi dừng bằng Ctrl+C, không phải timer)
    if let Err(e) = collector_handle.join() {
        log::error!("Collector thread error: {:?}", e);
    }

    println!();
    log::info!("✅ KDS Guard đã dừng. Tổng {} events đã ghi.", logger.event_count());
    log::info!("📄 File log: {}", logger.log_path().display());
}

/// Thực thi hành động phản ứng
fn execute_action(action: &PolicyAction, detection: &detector::DetectionResult) {
    match action {
        PolicyAction::Allow => {
            // Không làm gì
        }
        PolicyAction::LogOnly(msg) => {
            log::debug!("{}", msg);
        }
        PolicyAction::Alert(msg) => {
            // In cảnh báo ra console
            println!();
            println!("╔══════════════════════════════════════════════════╗");
            println!("║  {} CẢNH BÁO - Risk Score: {:.2}                ║",
                detection.risk_level.emoji(),
                detection.risk_score
            );
            println!("╠══════════════════════════════════════════════════╣");
            for reason in &detection.reasons {
                println!("║  • {:<46} ║", truncate_str(reason, 46));
            }
            println!("╚══════════════════════════════════════════════════╝");
            println!();

            log::warn!("{}", msg);
        }
        PolicyAction::SoftBlock { message, duration_ms } => {
            log::error!("🚫 SOFT BLOCK ({} ms): {}", duration_ms, message);
            println!();
            println!("🚫🚫🚫 INPUT BLOCKED for {}ms 🚫🚫🚫", duration_ms);
            println!("{}", message);
            println!();
        }
        PolicyAction::Challenge { message, expected_input } => {
            log::error!("🔒 CHALLENGE: {} (expected: {})", message, expected_input);
            println!();
            println!("🔒 XÁC MINH DANH TÍNH");
            println!("{}", message);
            println!("Nhập chuỗi: {}", expected_input);
            println!();
        }
    }
}

/// Cắt chuỗi nếu quá dài
fn truncate_str(s: &str, max_len: usize) -> String {
    if s.len() > max_len {
        format!("{}...", &s[..max_len - 3])
    } else {
        s.to_string()
    }
}
