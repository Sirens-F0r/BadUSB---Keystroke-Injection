// KDS Guard – Recent alerts data (Real Data)
// Cảnh báo thực tế dựa trên kết quả phân tích injection simulation

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AlertItem {
  id: number;
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  action: string;
  source: string;
}

export const recentAlertsData: AlertItem[] = [
  {
    id: 1,
    severity: 'CRITICAL',
    title: 'Phát hiện 232 mẫu tấn công injection',
    description:
      'Toàn bộ 232 mẫu injection đều bị phát hiện (Recall=100%). Mean flight time=32.3ms, typing speed=35.6 keys/s, burst length=31 phím.',
    timestamp: '2026-04-19 19:30',
    action: 'Soft Block',
    source: 'Detector (Rule + Random Forest)',
  },
  {
    id: 2,
    severity: 'HIGH',
    title: 'Tốc độ gõ bất thường: 35.6 keys/s',
    description:
      'Tốc độ gõ trung bình của injection vượt ngưỡng 12 keys/s gần 3 lần. Người dùng thật cao nhất chỉ 7.2 keys/s (Phan Quốc Huy).',
    timestamp: '2026-04-19 19:30',
    action: 'Challenge',
    source: 'Rule Engine (R3)',
  },
  {
    id: 3,
    severity: 'HIGH',
    title: 'Burst pattern phát hiện: 31 phím liên tiếp',
    description:
      'Injection có burst length trung bình 31 phím (ngưỡng: ≥15). Người dùng thật chỉ có tối đa 1 phím burst.',
    timestamp: '2026-04-19 19:30',
    action: 'Alert',
    source: 'Rule Engine (R4)',
  },
  {
    id: 4,
    severity: 'LOW',
    title: '5 người dùng mới được phân tích',
    description:
      'Đã thu thập và phân tích thành công dữ liệu từ: Hiệp, Nhật Duy, Phan Quốc Huy, Trần Bảo, Trần Minh Thắng. Tổng 138 feature vectors.',
    timestamp: '2026-04-19 19:42',
    action: 'Log Only',
    source: 'Collector (Rust)',
  },
];
