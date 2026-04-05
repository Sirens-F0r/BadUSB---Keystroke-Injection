// KDS Guard – Detection Rules Data
// Đối chiếu chính xác từ detector.rs DetectorConfig::default()
// 8 rules: ft_mean, cv_flight, speed, burst, ht_iqr, modifier_ratio, min_flight, injection_fingerprint

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
    threshold: '< 30.0 ms',
    currentValue: '154.2 ms',
    triggered: false,
    confidence: 92,
    severity: 'critical',
    weight: 0.3,
  },
  {
    id: 'R2',
    name: 'Hệ số biến thiên CV thấp',
    description: 'CV flight time thấp → gõ đều như máy, không có biến thiên tự nhiên',
    threshold: '< 0.15',
    currentValue: '0.42',
    triggered: false,
    confidence: 88,
    severity: 'critical',
    weight: 0.25,
  },
  {
    id: 'R3',
    name: 'Tốc độ gõ vượt ngưỡng',
    description: 'Tốc độ gõ phím vượt quá khả năng con người bình thường',
    threshold: '> 15.0 keys/s',
    currentValue: '4.8 keys/s',
    triggered: false,
    confidence: 95,
    severity: 'high',
    weight: 0.2,
  },
  {
    id: 'R4',
    name: 'Burst Pattern',
    description: 'Chuỗi phím liên tiếp với flight time < 50ms – dấu hiệu injection script',
    threshold: '≥ 15 phím burst',
    currentValue: '0 phím',
    triggered: false,
    confidence: 90,
    severity: 'high',
    weight: 0.2,
  },
  {
    id: 'R5',
    name: 'Hold Time đồng đều (IQR thấp)',
    description: 'IQR hold time quá nhỏ → thời gian nhấn giữ phím không có biến thiên',
    threshold: '< 5.0 ms',
    currentValue: '38.5 ms',
    triggered: false,
    confidence: 78,
    severity: 'medium',
    weight: 0.15,
  },
  {
    id: 'R6',
    name: 'Tỉ lệ phím Modifier cao',
    description: 'Tỉ lệ phím Ctrl/Alt/Shift/Win quá cao so với bình thường',
    threshold: '> 40%',
    currentValue: '5.2%',
    triggered: false,
    confidence: 72,
    severity: 'medium',
    weight: 0.1,
  },
  {
    id: 'R7',
    name: 'Flight Time tối thiểu cực thấp',
    description: 'Min flight time < 5ms – gần như không thể đạt được bằng tay',
    threshold: '< 5.0 ms',
    currentValue: '28.3 ms',
    triggered: false,
    confidence: 85,
    severity: 'high',
    weight: 0.1,
  },
];
