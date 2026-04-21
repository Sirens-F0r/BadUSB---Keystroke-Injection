// KDS Guard – Keystroke Metrics Chart Data
// Dữ liệu thật từ dataset đã thu thập (5 người dùng thật + injection simulation)
// Trích xuất từ data/features_dataset.csv & data/evaluation_report.json

// Radar chart labels – khớp các features thực tế
export const keystrokeMetricsLabels = [
  'Mean Flight Time',     // ms
  'Mean Hold Time',       // ms
  'Typing Speed',         // keys/s
  'CV Flight Time',       // coefficient (×100 để hiển thị)
  'Max Burst Length',     // keys
  'Modifier Ratio',       // %
  'IQR Hold Time',        // ms
];

// Dữ liệu thật từ 5 người dùng thu thập + injection simulation
export const keystrokeMetricsData: Record<string, number[]> = {
  // Trung bình 5 người dùng thật (Rust Collected):
  // ft=308.3, ht=108.8, speed=4.0, cv=1.006, burst=0.6, mod=8.6%, iqr=31.0
  'Người dùng thật (TB)': [308.3, 108.8, 4.0, 100.6, 0.6, 8.6, 31.0],

  // Hiệp: ft=325.3, ht=105.2, speed=3.5, cv=1.023, burst=0, mod=1.4%, iqr=30.8
  'Hiệp': [325.3, 105.2, 3.5, 102.3, 0, 1.4, 30.8],

  // Nhật Duy: ft=166.3, ht=74.9, speed=6.3, cv=0.865, burst=1, mod=3.2%, iqr=31.3
  'Nhật Duy': [166.3, 74.9, 6.3, 86.5, 1, 3.2, 31.3],

  // Phan Quốc Huy: ft=149.4, ht=101.8, speed=7.2, cv=0.937, burst=1, mod=2.4%, iqr=27.2
  'Phan Quốc Huy': [149.4, 101.8, 7.2, 93.7, 1, 2.4, 27.2],

  // Trần Bảo: ft=306.3, ht=112.8, speed=3.4, cv=0.957, burst=0, mod=14.2%, iqr=22.5
  'Trần Bảo': [306.3, 112.8, 3.4, 95.7, 0, 14.2, 22.5],

  // Trần Minh Thắng: ft=474.2, ht=132.6, speed=1.8, cv=1.167, burst=0, mod=13.9%, iqr=40.1
  'Trần Minh Thắng': [474.2, 132.6, 1.8, 116.7, 0, 13.9, 40.1],

  // Injection simulation: ft=32.3, ht=11.1, speed=35.6, cv=0.078, burst=31, mod=0%, iqr=2.2
  'BadUSB Injection': [32.3, 11.1, 35.6, 7.8, 31, 0, 2.2],
};
