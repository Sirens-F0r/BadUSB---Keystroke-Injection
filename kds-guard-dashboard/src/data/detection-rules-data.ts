// KDS Guard – Detection Rules Data
// Dữ liệu thật từ evaluation_report.json (19/04/2026)
// Thresholds tối ưu: ft=20ms, cv=0.15, speed=12 k/s
// Current values = trung bình từ 5 người dùng thật (Rust Collected)

export interface DetectionRule {
  id: string;
  name: string;
  description: string;
  threshold: string;
  currentValue: string;
  triggered: boolean;
  confidence: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  weight: number; // contribution khi triggered
}

export const detectionRulesData: DetectionRule[] = [
  {
    id: 'R1',
    name: 'Flight Time trung bình thấp',
    description: 'Phát hiện thời gian bay giữa các phím quá nhanh – đặc trưng HID injection',
    threshold: '< 20.0 ms',
    currentValue: '308.3 ms',
    triggered: false,
    confidence: 100,
    severity: 'critical',
    weight: 0.3,
  },
  {
    id: 'R2',
    name: 'Hệ số biến thiên CV thấp',
    description: 'CV flight time thấp → gõ đều như máy, không có biến thiên tự nhiên',
    threshold: '< 0.15',
    currentValue: '1.006',
    triggered: false,
    confidence: 100,
    severity: 'critical',
    weight: 0.25,
  },
  {
    id: 'R3',
    name: 'Tốc độ gõ vượt ngưỡng',
    description: 'Tốc độ gõ phím vượt quá khả năng con người bình thường',
    threshold: '> 12.0 keys/s',
    currentValue: '4.0 keys/s',
    triggered: false,
    confidence: 100,
    severity: 'high',
    weight: 0.2,
  },
  {
    id: 'R4',
    name: 'Burst Pattern',
    description: 'Chuỗi phím liên tiếp với flight time < 50ms – dấu hiệu injection script',
    threshold: '≥ 15 phím burst',
    currentValue: '0.6 phím',
    triggered: false,
    confidence: 100,
    severity: 'high',
    weight: 0.2,
  },
  {
    id: 'R5',
    name: 'Hold Time đồng đều (IQR thấp)',
    description: 'IQR hold time quá nhỏ → thời gian nhấn giữ phím không có biến thiên',
    threshold: '< 5.0 ms',
    currentValue: '31.0 ms',
    triggered: false,
    confidence: 100,
    severity: 'medium',
    weight: 0.15,
  },
  {
    id: 'R6',
    name: 'Tỉ lệ phím Modifier cao',
    description: 'Tỉ lệ phím Ctrl/Alt/Shift/Win quá cao so với bình thường',
    threshold: '> 40%',
    currentValue: '8.6%',
    triggered: false,
    confidence: 100,
    severity: 'medium',
    weight: 0.1,
  },
  {
    id: 'R7',
    name: 'Flight Time tối thiểu cực thấp',
    description: 'Min flight time < 5ms – gần như không thể đạt được bằng tay',
    threshold: '< 5.0 ms',
    currentValue: '48.0 ms',
    triggered: false,
    confidence: 100,
    severity: 'high',
    weight: 0.1,
  },
];
