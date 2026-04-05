// Ghi su kien ban phim ra file CSV

use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::mpsc::Receiver;

use chrono::Local;
use csv::Writer;

use crate::input_capture::KeyEvent;

#[derive(Debug, Clone)]
pub struct LoggerConfig {
    pub output_dir: PathBuf,
    pub file_prefix: String,
    pub log_key_code: bool,  // false = chi luu key_class
    pub max_events_per_file: usize,
    pub session_id: String,
    pub user_id: String,
}

impl Default for LoggerConfig {
    fn default() -> Self {
        let timestamp = Local::now().format("%Y%m%d_%H%M%S").to_string();
        Self {
            output_dir: PathBuf::from("data"),
            file_prefix: "keystroke_log".to_string(),
            log_key_code: true,
            max_events_per_file: 0,
            session_id: timestamp,
            user_id: "anonymous".to_string(),
        }
    }
}

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

pub struct KeystrokeLogger {
    config: LoggerConfig,
    event_count: usize,
}

impl KeystrokeLogger {
    pub fn new(config: LoggerConfig) -> Self {

        if let Err(e) = fs::create_dir_all(&config.output_dir) {
            log::error!("Không thể tạo thư mục {}: {}", config.output_dir.display(), e);
        }

        Self {
            config,
            event_count: 0,
        }
    }

    fn get_log_path(&self) -> PathBuf {
        let filename = format!(
            "{}_{}.csv",
            self.config.file_prefix,
            self.config.session_id
        );
        self.config.output_dir.join(filename)
    }

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


        if self.event_count % 100 == 0 {
            log::info!("📊 Đã ghi {} events vào {}", self.event_count, path.display());
        }

        Ok(())
    }

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

    pub fn event_count(&self) -> usize {
        self.event_count
    }

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
