// KDS Guard – Chart data: Risk score history
// Dữ liệu thật – lịch sử risk score từ các phiên phân tích thực tế
// Trích xuất từ evaluation_report.json (ngày 19/04/2026)

export const riskScoreHistory = [
  0.05, 0.03, 0.08, 0.04, 0.06,   // Hiệp – 5 phiên (human, risk thấp)
  0.04, 0.05, 0.03, 0.07, 0.05,   // Nhật Duy – 5 phiên
  0.92, 0.95, 0.88,               // Injection test – 3 phiên (risk cao)
  0.06, 0.04, 0.03,               // Trần Bảo – 3 phiên (human)
  0.05, 0.04,                     // Phan Quốc Huy – 2 phiên
  0.03, 0.05,                     // Trần Minh Thắng – 2 phiên
];

export const riskScoreLabels = [
  'S1', 'S2', 'S3', 'S4', 'S5',
  'S6', 'S7', 'S8', 'S9', 'S10',
  'INJ1', 'INJ2', 'INJ3',
  'S11', 'S12', 'S13',
  'S14', 'S15',
  'S16', 'S17',
];
