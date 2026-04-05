// KDS Guard – Keystroke Metrics Chart Data
// Đối chiếu từ FeatureVector trong feature.rs
// So sánh Normal User vs BadUSB (từ test cases trong detector.rs)

// Radar chart labels – khớp các features thực tế
export const keystrokeMetricsLabels = [
  'Mean Flight Time',     // ms
  'Mean Hold Time',       // ms
  'Typing Speed',         // keys/s
  'CV Flight Time',       // coefficient
  'Max Burst Length',     // keys
  'Modifier Ratio',       // %
  'IQR Hold Time',        // ms
];

// Giá trị từ make_normal_features() và make_injection_features() trong detector.rs
export const keystrokeMetricsData: Record<string, number[]> = {
  // Normal: ft=200, ht=100, speed=8, cv=0.4, burst=0, mod=5%, iqr=40
  'Normal User': [200, 100, 8, 40, 0, 5, 40],
  // BadUSB: ft=20, ht=10, speed=50, cv=0.075, burst=35, mod=10%, iqr=2
  'BadUSB Pattern': [20, 10, 50, 7.5, 35, 10, 2],
};
