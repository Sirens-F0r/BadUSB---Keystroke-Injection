// KDS Guard – Realtime Monitor Page
// Khớp FeatureVector từ feature.rs và DetectorConfig từ detector.rs

import { ReactElement } from 'react';
import { Box, Chip, Paper, Stack, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  icon: string;
  status: 'normal' | 'warning' | 'danger';
}

const MetricCard = ({ label, value, unit, icon, status }: MetricCardProps) => {
  const statusColor = status === 'danger' ? 'error.main' : status === 'warning' ? 'warning.main' : 'success.main';
  return (
    <Paper sx={{ p: 5, height: 1 }}>
      <Stack direction="row" alignItems="center" gap={2} mb={3}>
        <IconifyIcon icon={icon} color={statusColor} />
        <Typography variant="body2" color="text.disabled">{label}</Typography>
      </Stack>
      <Typography variant="h3" color="common.white" fontFamily="monospace">
        {value}
        <Typography component="span" variant="body2" color="text.disabled" ml={1}>{unit}</Typography>
      </Typography>
    </Paper>
  );
};

// Metrics khớp FeatureVector: hold_time, flight_time, cv, speed, burst, modifier, special, min_ft
const realtimeMetrics: MetricCardProps[] = [
  { label: 'Thời gian bay TB', value: '154.2', unit: 'ms', icon: 'mdi:timer-outline', status: 'normal' },
  { label: 'Hệ số biến thiên (CV)', value: '0.42', unit: '', icon: 'mdi:chart-bell-curve', status: 'normal' },
  { label: 'Tốc độ gõ', value: '4.8', unit: 'phím/s', icon: 'mdi:keyboard', status: 'normal' },
  { label: 'Thời gian giữ phím TB', value: '89.5', unit: 'ms', icon: 'mdi:gesture-tap-hold', status: 'normal' },
  { label: 'IQR thời gian giữ', value: '38.5', unit: 'ms', icon: 'mdi:chart-box-outline', status: 'normal' },
  { label: 'Chuỗi nhanh tối đa', value: '0', unit: 'phím', icon: 'mdi:lightning-bolt', status: 'normal' },
  { label: 'Tỷ lệ phím Modifier', value: '5.2', unit: '%', icon: 'mdi:keyboard-settings', status: 'normal' },
  { label: 'Tỷ lệ phím đặc biệt', value: '2.1', unit: '%', icon: 'mdi:keyboard-variant', status: 'normal' },
  { label: 'Flight Time tối thiểu', value: '28.3', unit: 'ms', icon: 'mdi:speedometer-slow', status: 'normal' },
  { label: 'P5 Flight Time', value: '62.1', unit: 'ms', icon: 'mdi:chart-timeline-variant', status: 'normal' },
  { label: 'P95 Flight Time', value: '312.4', unit: 'ms', icon: 'mdi:chart-timeline-variant-shimmer', status: 'normal' },
  { label: 'Độ lệch chuẩn FT', value: '64.8', unit: 'ms', icon: 'mdi:sigma', status: 'normal' },
];

const RealtimeMonitor = (): ReactElement => {
  return (
    <>
      <Stack direction="row" alignItems="center" gap={2} mb={4}>
        <Typography variant="h4" color="common.white">Giám sát thời gian thực</Typography>
        <Chip
          label="● LIVE"
          size="small"
          sx={{
            bgcolor: 'success.main', color: 'common.white', fontWeight: 700, fontSize: '0.7rem',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': { '0%': { opacity: 1 }, '50%': { opacity: 0.5 }, '100%': { opacity: 1 } },
          }}
        />
      </Stack>

      {/* Analysis Window – khớp FeatureExtractor::new(window_size=250, slide_step=125) */}
      <Paper sx={{ p: 5, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={3}>
          <Stack>
            <Typography variant="body1" color="common.white" fontWeight={600}>
              Analysis Window (Cửa sổ phân tích)
            </Typography>
            <Typography variant="body2" color="text.disabled">
              Window #47 · 128/250 keystrokes · Slide step: 125
            </Typography>
          </Stack>
          <Stack direction="row" gap={2}>
            <Chip label="Thu thập: Đang chạy" size="small" color="success" sx={{ fontWeight: 600 }} />
            <Chip label="Phát hiện: Hoạt động" size="small" color="info" sx={{ fontWeight: 600 }} />
          </Stack>
        </Stack>
      </Paper>

      {/* Feature Vector Metrics */}
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
        {realtimeMetrics.map((metric) => (
          <Box key={metric.label} gridColumn={{ xs: 'span 12', sm: 'span 6', md: 'span 4', lg: 'span 3' }}>
            <MetricCard {...metric} />
          </Box>
        ))}
      </Box>

      {/* Detection Result – khớp DetectionResult struct */}
      <Paper sx={{ p: 5, mt: 4 }}>
        <Typography variant="h5" color="common.white" mb={3}>
          Kết quả phân tích
        </Typography>
        <Stack direction="row" gap={4} flexWrap="wrap">
          <Stack gap={1}>
            <Typography variant="body2" color="text.disabled">Số luật kích hoạt</Typography>
            <Typography variant="h5" color="success.main">0 / 7</Typography>
          </Stack>
          <Stack gap={1}>
            <Typography variant="body2" color="text.disabled">Điểm luật</Typography>
            <Typography variant="h5" color="success.main" fontFamily="monospace">0.00</Typography>
          </Stack>
          <Stack gap={1}>
            <Typography variant="body2" color="text.disabled">Điểm rủi ro (Hybrid)</Typography>
            <Typography variant="h5" color="success.main" fontFamily="monospace">0.00</Typography>
          </Stack>
          <Stack gap={1}>
            <Typography variant="body2" color="text.disabled">Mức rủi ro</Typography>
            <Chip label="✅ NORMAL" size="small" color="success" sx={{ fontWeight: 700 }} />
          </Stack>
          <Stack gap={1}>
            <Typography variant="body2" color="text.disabled">Hành động</Typography>
            <Chip label="Allow" size="small" color="success" sx={{ fontWeight: 700 }} />
          </Stack>
        </Stack>
      </Paper>

      {/* Reasons */}
      <Paper sx={{ p: 5, mt: 3 }}>
        <Typography variant="h6" color="common.white" mb={2}>
          Lý do phân tích
        </Typography>
        <Stack gap={1}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
            <Typography variant="body2" color="text.secondary">
              Hành vi gõ phím bình thường
            </Typography>
          </Stack>
        </Stack>
      </Paper>
    </>
  );
};

export default RealtimeMonitor;
