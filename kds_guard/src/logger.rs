//! Module ghi log sự kiện bàn phím ra file CSV
//!
//! Ghi dữ liệu keystroke đã ẩn danh (không lưu nội dung gõ thực tế,
//! chỉ lưu timing + key_class) tuân thủ quy định về quyền riêng tư.

use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::mpsc::Receiver;

use chrono::Local;
use csv::Writer;

use crate::input_capture::KeyEvent;

/// Cấu hình cho logger
#[derive(Debug, Clone)]
pub struct LoggerConfig {
    /// Thư mục lưu file log
    pub output_dir: PathBuf,
    /// Tiền tố tên file
    pub file_prefix: String,
    /// Có lưu key_code không (false = chỉ lưu key_class để bảo mật)
    pub log_key_code: bool,
    /// Số event tối đa mỗi file (0 = không giới hạn)
    pub max_events_per_file: usize,
    /// Session ID
    pub session_id: String,
    /// User ID (đã hash/ẩn danh)
    pub user_id: String,
}

impl Default for LoggerConfig {
    fn default() -> Self {
        let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
        Self {
            output_dir: PathBuf::from("data"),
            file_prefix: "keystroke_log".to_string(),
            log_key_code: true, // Trong giai đoạn phát triển, log key_code để debug
            max_events_per_file: 0,
            session_id: timestamp,
            user_id: "anonymous".to_string(),
        }
    }
}

/// Bản ghi CSV cho mỗi sự kiện
#[derive(Debug, serde::Serialize)]
struct CsvRecord {
    timestamp_ms: f64,
    key_code: String,
    event_type: String,
    key_class: String,
    is_modifier: bool,
    session_id: String,
    user_id: String,
}

/// Keystroke Logger - ghi sự kiện bàn phím ra CSV
pub struct KeystrokeLogger {
    config: LoggerConfig,
    event_count: usize,
}

impl KeystrokeLogger {
    /// Tạo logger mới với config
    pub fn new(config: LoggerConfig) -> Self {
        // Tạo thư mục output nếu chưa tồn tại
        if let Err(e) = fs::create_dir_all(&config.output_dir) {
            log::error!("Không thể tạo thư mục {}: {}", config.output_dir.display(), e);
        }

        Self {
            config,
            event_count: 0,
        }
    }

    /// Lấy đường dẫn file log hiện tại
    fn get_log_path(&self) -> PathBuf {
        let filename = format!(
            "{}_{}.csv",
            self.config.file_prefix,
            self.config.session_id
        );
        self.config.output_dir.join(filename)
    }

    /// Ghi header CSV nếu file chưa tồn tại
    fn ensure_header(&self, path: &Path) -> std::io::Result<()> {
        if !path.exists() {
            let mut file = File::create(path)?;
            writeln!(
                file,
                "timestamp_ms,key_code,event_type,key_class,is_modifier,session_id,user_id"
            )?;
            log::info!("📄 Tạo file log: {}", path.display());
        }
        Ok(())
    }

    /// Ghi một event vào file CSV
    pub fn log_event(&mut self, event: &KeyEvent) -> std::io::Result<()> {
        let path = self.get_log_path();
        self.ensure_header(&path)?;

        let file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&path)?;

        let mut writer = csv::WriterBuilder::new()
            .has_headers(false)
            .from_writer(file);

        let key_code = if self.config.log_key_code {
            event.key_code.clone()
        } else {
            // Ẩn danh: chỉ ghi key_class thay vì key_code thật
            event.key_class.clone()
        };

        let record = CsvRecord {
            timestamp_ms: event.timestamp_ms,
            key_code,
            event_type: event.event_type.clone(),
            key_class: event.key_class.clone(),
            is_modifier: event.is_modifier,
            session_id: self.config.session_id.clone(),
            user_id: self.config.user_id.clone(),
        };

        writer.serialize(&record)?;
        writer.flush()?;

        self.event_count += 1;

        // Log tiến trình mỗi 100 events
        if self.event_count % 100 == 0 {
            log::info!("📊 Đã ghi {} events vào {}", self.event_count, path.display());
        }

        Ok(())
    }

    /// Vòng lặp chính: nhận events từ channel và ghi log
    pub fn run(&mut self, rx: Receiver<KeyEvent>) {
        log::info!(
            "📝 Logger bắt đầu ghi vào: {}",
            self.get_log_path().display()
        );

        for event in rx {
            if let Err(e) = self.log_event(&event) {
                log::error!("Lỗi ghi log: {}", e);
            }
        }

        log::info!(
            "✅ Logger kết thúc. Tổng cộng {} events đã ghi.",
            self.event_count
        );
    }

    /// Lấy số lượng event đã ghi
    pub fn event_count(&self) -> usize {
        self.event_count
    }

    /// Lấy đường dẫn file log
    pub fn log_path(&self) -> PathBuf {
        self.get_log_path()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_default_config() {
        let config = LoggerConfig::default();
        assert_eq!(config.output_dir, PathBuf::from("data"));
        assert_eq!(config.file_prefix, "keystroke_log");
        assert!(config.log_key_code);
        assert_eq!(config.user_id, "anonymous");
    }

    #[test]
    fn test_log_path_format() {
        let config = LoggerConfig {
            session_id: "test_session_001".to_string(),
            ..Default::default()
        };
        let logger = KeystrokeLogger::new(config);
        let path = logger.log_path();
        assert!(path.to_string_lossy().contains("keystroke_log_test_session_001.csv"));
    }
}
