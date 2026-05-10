// KDS Guard – Realtime Monitor Page
// Kết nối WebSocket ws://localhost:8765 để hiển thị dữ liệu thời gian thực

import { ReactElement, useMemo } from 'react';
import { Alert, Box, Chip, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { useRealtime } from 'hooks/useRealtime';
import {
  riskLevelColor,
  riskLevelEmoji,
  type RiskLevel,
} from 'services/kds-guard-api';

function riskLevelLabel(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    Normal: 'NORMAL',
    Low: 'LOW',
    Medium: 'MEDIUM',
    High: 'HIGH',
    Critical: 'CRITICAL',
  };
  return map[level] ?? level;
}

function riskChipColor(level: RiskLevel): 'success' | 'info' | 'warning' | 'error' | 'error' {
  const map: Record<RiskLevel, 'success' | 'info' | 'warning' | 'error'> = {
    Normal: 'success',
    Low: 'info',
    Medium: 'warning',
    High: 'error',
    Critical: 'error',
  };
  return map[level];
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  icon: string;
  severity: 'normal' | 'warning' | 'danger';
}

function MetricCard({ label, value, unit, severity: _severity }: MetricCardProps) {
  return (
    <Paper sx={{ p: 4, height: 1 }}>
      <Typography variant="body2" color="text.disabled" mb={1}>{label}</Typography>
      <Typography variant="h5" color="common.white" fontFamily="monospace">
        {value}
        <Typography component="span" variant="body2" color="text.disabled" ml={0.5}>{unit}</Typography>
      </Typography>
    </Paper>
  );
}

function featureSeverity(value: number, key: keyof typeof thresholds): 'normal' | 'warning' | 'danger' {
  const t = thresholds[key];
  if (value >= t.danger) return 'danger';
  if (value >= t.warn) return 'warning';
  return 'normal';
}

const thresholds = {
  mean_flight_time: { warn: 50, danger: 30 },
  cv_flight_time:   { warn: 0.25, danger: 0.15 },
  typing_speed:     { warn: 15, danger: 20 },
  iqr_hold_time:    { warn: 10, danger: 5 },
  max_burst_length: { warn: 10, danger: 15 },
  modifier_ratio:   { warn: 0.3, danger: 0.4 },
  min_flight_time:  { warn: 10, danger: 5 },
  std_flight_time:  { warn: 30, danger: 10 },
} as const;

function getFeatureMetrics(f: ReturnType<typeof Object.assign> | null) {
  if (!f) return null;
  return [
    { label: 'Flight Time TB', value: (f as any).mean_flight_time?.toFixed(1) ?? '—', unit: 'ms', key: 'mean_flight_time' },
    { label: 'CV (Hệ số biến thiên)', value: (f as any).cv_flight_time?.toFixed(3) ?? '—', unit: '', key: 'cv_flight_time' },
    { label: 'Tốc độ gõ', value: (f as any).typing_speed?.toFixed(1) ?? '—', unit: 'phím/s', key: 'typing_speed' },
    { label: 'Hold Time TB', value: (f as any).mean_hold_time?.toFixed(1) ?? '—', unit: 'ms', key: 'mean_hold_time' },
    { label: 'IQR Hold Time', value: (f as any).iqr_hold_time?.toFixed(1) ?? '—', unit: 'ms', key: 'iqr_hold_time' },
    { label: 'Burst tối đa', value: (f as any).max_burst_length ?? 0, unit: 'phím', key: 'max_burst_length' },
    { label: 'Tỷ lệ Modifier', value: ((f as any).modifier_ratio ?? 0) * 100, unit: '%', key: 'modifier_ratio' },
    { label: 'Flight Time min', value: (f as any).min_flight_time?.toFixed(1) ?? '—', unit: 'ms', key: 'min_flight_time' },
    { label: 'P5 Flight Time', value: (f as any).p5_flight_time?.toFixed(1) ?? '—', unit: 'ms', key: 'mean_flight_time' },
    { label: 'P95 Flight Time', value: (f as any).p95_flight_time?.toFixed(1) ?? '—', unit: 'ms', key: 'mean_flight_time' },
    { label: 'Std Flight Time', value: (f as any).std_flight_time?.toFixed(1) ?? '—', unit: 'ms', key: 'std_flight_time' },
  ];
}

const RealtimeMonitor = (): ReactElement => {
  const { latestDetection, latestFeature, eventHistory } = useRealtime(true);

  const riskPercent = useMemo(() => {
    if (!latestDetection) return 0;
    return Math.round(latestDetection.risk_score * 100);
  }, [latestDetection]);

  const featureMetrics = useMemo(() => getFeatureMetrics(latestFeature), [latestFeature]);

  const ruleKeys = latestDetection?.reasons?.map((r) => {
    if (r.includes('Flight time')) return 'R1';
    if (r.includes('CV') || r.includes('bien thien')) return 'R2';
    if (r.includes('Tốc độ')) return 'R3';
    if (r.includes('Burst')) return 'R4';
    if (r.includes('Hold time')) return 'R5';
    if (r.includes('modifier')) return 'R6';
    if (r.includes('tối thiểu') || r.includes('cuc thap')) return 'R7';
    if (r.includes('Injection fingerprint')) return 'R8';
    return null;
  }).filter(Boolean) ?? [];

  return (
    <>
      {/* Header + live indicator */}
      <Stack direction="row" alignItems="center" gap={2} mb={4}>
        <Typography variant="h4" color="common.white">Giám sát thời gian thực</Typography>
        {eventHistory.length > 0 ? (
          <Chip
            label="● LIVE"
            size="small"
            color="success"
            sx={{ fontWeight: 700, fontSize: '0.7rem', animation: 'pulse 2s infinite',
              '@keyframes pulse': { '0%': { opacity: 1 }, '50%': { opacity: 0.5 }, '100%': { opacity: 1 } } }}
          />
        ) : (
          <Chip
            label="● OFFLINE"
            size="small"
            color="default"
            sx={{ fontWeight: 700, fontSize: '0.7rem' }}
          />
        )}
      </Stack>

      {/* Connection status banner */}
      {eventHistory.length === 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Chưa kết nối WebSocket.</strong> Hãy chạy <code>python ws_bridge.py</code> ở Terminal để bắt đầu giám sát realtime, hoặc chạy engine trực tiếp:
          <br />
          <code>.\kds_guard\target\release\kds_guard.exe --json-output -u test_user | python ws_bridge.py</code>
        </Alert>
      )}

      {/* Detection Result Card */}
      <Paper sx={{ p: 5, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={3}>
          <Stack>
            <Typography variant="body1" color="common.white" fontWeight={600}>
              Kết quả phát hiện hiện tại
            </Typography>
            <Typography variant="body2" color="text.disabled">
              {latestDetection
                ? `Cửa sổ ${new Date(latestDetection.window_end_ms).toLocaleTimeString()}`
                : 'Đang chờ dữ liệu từ engine...'}
            </Typography>
          </Stack>
          <Stack direction="row" gap={2} flexWrap="wrap">
            <Stack alignItems="center">
              <Typography variant="h3" color="common.white" fontFamily="monospace">
                {latestDetection ? latestDetection.risk_score.toFixed(2) : '—'}
              </Typography>
              <Typography variant="caption" color="text.disabled">Điểm rủi ro</Typography>
            </Stack>
            <Stack alignItems="center">
              <Typography variant="h3" color="common.white" fontFamily="monospace">
                {riskPercent}%
              </Typography>
              <Typography variant="caption" color="text.disabled">Mức đe dọa</Typography>
            </Stack>
          </Stack>
        </Stack>

        {/* Risk bar */}
        <Box mt={3}>
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Typography variant="caption" color="text.disabled">Mức rủi ro</Typography>
            <Typography variant="caption" color="text.disabled">
              {latestDetection ? `${riskLevelEmoji(latestDetection.risk_level)} ${riskLevelLabel(latestDetection.risk_level)}` : '—'}
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={riskPercent}
            color={latestDetection ? riskChipColor(latestDetection.risk_level) : 'success'}
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        {/* Rules triggered */}
        {ruleKeys.length > 0 && (
          <Stack direction="row" gap={1} mt={3} flexWrap="wrap">
            <Typography variant="body2" color="text.disabled">Luật kích hoạt:</Typography>
            {ruleKeys.map((r) => (
              <Chip key={r} label={r} size="small" color="error" variant="outlined" />
            ))}
          </Stack>
        )}

        {/* Reasons */}
        {latestDetection?.reasons && latestDetection.reasons.length > 0 && (
          <Stack gap={1} mt={3}>
            <Typography variant="body2" color="text.disabled">Chi tiết:</Typography>
            {latestDetection.reasons.map((reason, i) => (
              <Stack key={i} direction="row" alignItems="center" gap={1}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main' }} />
                <Typography variant="body2" color="common.white">{reason}</Typography>
              </Stack>
            ))}
          </Stack>
        )}

        {(!latestDetection || latestDetection.reasons?.length === 0) && (
          <Stack direction="row" alignItems="center" gap={1} mt={3}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
            <Typography variant="body2" color="success.main">Hành vi gõ phím bình thường — không có bất thường</Typography>
          </Stack>
        )}
      </Paper>

      {/* Feature Vector Metrics */}
      <Typography variant="h5" color="common.white" mb={3}>Đặc trưng gõ phím (Feature Vector)</Typography>
      {featureMetrics ? (
        <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
          {featureMetrics.map((m) => {
            const sev = featureSeverity(
              typeof m.value === 'number' ? m.value : parseFloat(String(m.value)) || 0,
              m.key as keyof typeof thresholds,
            );
            return (
              <Box key={m.label} gridColumn={{ xs: 'span 12', sm: 'span 6', md: 'span 4', lg: 'span 3' }}>
                <MetricCard {...m} icon="" severity={sev} />
              </Box>
            );
          })}
        </Box>
      ) : (
        <Alert severity="info">Đang chờ feature vector từ engine... (gõ phím để kích hoạt)</Alert>
      )}

      {/* Event History */}
      <Typography variant="h5" color="common.white" mt={5} mb={3}>Lịch sử sự kiện ({eventHistory.length})</Typography>
      {eventHistory.length === 0 ? (
        <Alert severity="info">Chưa có sự kiện nào. Gõ phím hoặc chạy simulator để xem realtime data.</Alert>
      ) : (
        <Paper sx={{ overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="thead" sx={{ bgcolor: 'divider' }}>
                <Box component="tr">
                  {['Thời gian', 'Loại', 'Risk Score', 'Mức', 'Luật'].map((h) => (
                    <Box component="th" key={h} sx={{ px: 2, py: 1.5, textAlign: 'left', fontSize: '0.75rem', color: 'text.disabled', fontWeight: 600 }}>
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {eventHistory.slice(0, 20).map((msg, i) => {
                  const isDetection = msg.type === 'detection_result';
                  const data = (msg as any).data;
                  const label = isDetection ? riskLevelLabel(data?.risk_level ?? 'Normal') : msg.type;
                  const color = isDetection ? riskLevelColor(data?.risk_level ?? 'Normal') : '#aaa';
                  return (
                    <Box component="tr" key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <Box component="td" sx={{ px: 2, py: 1, fontSize: '0.8rem', color: 'text.secondary', fontFamily: 'monospace' }}>
                        {new Date().toLocaleTimeString()}
                      </Box>
                      <Box component="td" sx={{ px: 2, py: 1, fontSize: '0.8rem', color }}>
                        {isDetection ? `${riskLevelEmoji(data?.risk_level)} ${label}` : msg.type}
                      </Box>
                      <Box component="td" sx={{ px: 2, py: 1, fontSize: '0.8rem', color: 'common.white', fontFamily: 'monospace' }}>
                        {isDetection ? (data?.risk_score ?? 0).toFixed(2) : '—'}
                      </Box>
                      <Box component="td" sx={{ px: 2, py: 1, fontSize: '0.8rem', color }}>
                        {isDetection ? label : '—'}
                      </Box>
                      <Box component="td" sx={{ px: 2, py: 1, fontSize: '0.8rem', color: 'text.disabled' }}>
                        {isDetection && data?.reasons?.length > 0
                          ? data.reasons.map((r: string, ri: number) => {
                              const rk = ruleKeys[ri];
                              return rk ? `${rk}: ${r}` : r;
                            }).join(', ')
                          : '—'}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Paper>
      )}
    </>
  );
};

export default RealtimeMonitor;
