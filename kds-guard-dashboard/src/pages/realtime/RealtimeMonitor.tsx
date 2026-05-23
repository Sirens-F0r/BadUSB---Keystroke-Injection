// KDS Guard – Realtime Monitor Page
// Kết nối WebSocket ws://localhost:8765 để hiển thị dữ liệu thời gian thực

import { ReactElement, useMemo } from 'react';
import { Alert, Box, Chip, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { useRealtime } from 'hooks/useRealtime';
import { riskLevelHex, riskLevelEmoji, type RiskLevel } from 'services/kds-guard-api';

function riskLevelLabel(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    Normal: 'NORMAL', Low: 'LOW', Medium: 'MEDIUM', High: 'HIGH', Critical: 'CRITICAL',
  };
  return map[level] ?? level;
}

function riskChipColor(level: RiskLevel): 'success' | 'info' | 'warning' | 'error' {
  const map: Record<RiskLevel, 'success' | 'info' | 'warning' | 'error'> = {
    Normal: 'success', Low: 'info', Medium: 'warning', High: 'error', Critical: 'error',
  };
  return map[level];
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit: string;
  severity: 'normal' | 'warning' | 'danger';
}

const severityColor = { normal: 'text.secondary', warning: 'warning.main', danger: 'error.main' } as const;
const severityBg = {
  normal: 'background.default',
  warning: 'rgba(251, 154, 35, 0.06)',
  danger: 'rgba(255, 63, 86, 0.06)',
} as const;

function MetricCard({ label, value, unit, severity }: MetricCardProps) {
  return (
    <Box sx={{ p: 2.5, borderRadius: 2, bgcolor: severityBg[severity], border: '1px solid', borderColor: severity === 'normal' ? 'divider' : `${severity === 'warning' ? 'warning' : 'error'}.main`, height: 1 }}>
      <Typography variant="caption" color="text.disabled" display="block" mb={1}>{label}</Typography>
      <Typography variant="h6" color={severityColor[severity]} fontFamily="monospace" fontWeight={700}>
        {value}<Typography component="span" variant="caption" color="text.disabled" ml={0.5}>{unit}</Typography>
      </Typography>
    </Box>
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

interface FeatureMetric {
  label: string;
  value: string | number;
  unit: string;
  key: string;
}

function getFeatureMetrics(f: Record<string, unknown> | null): FeatureMetric[] | null {
  if (!f) return null;
  return [
    { label: 'Flight Time TB', value: (f.mean_flight_time as number)?.toFixed(1) ?? '—', unit: 'ms', key: 'mean_flight_time' },
    { label: 'CV Flight', value: (f.cv_flight_time as number)?.toFixed(3) ?? '—', unit: '', key: 'cv_flight_time' },
    { label: 'Tốc độ gõ', value: (f.typing_speed as number)?.toFixed(1) ?? '—', unit: 'keys/s', key: 'typing_speed' },
    { label: 'Hold Time TB', value: (f.mean_hold_time as number)?.toFixed(1) ?? '—', unit: 'ms', key: 'mean_hold_time' },
    { label: 'IQR Hold Time', value: (f.iqr_hold_time as number)?.toFixed(1) ?? '—', unit: 'ms', key: 'iqr_hold_time' },
    { label: 'Burst tối đa', value: (f.max_burst_length as number) ?? 0, unit: 'keys', key: 'max_burst_length' },
    { label: 'Modifier Ratio', value: (((f.modifier_ratio as number) ?? 0) * 100).toFixed(1), unit: '%', key: 'modifier_ratio' },
    { label: 'Flight Time min', value: (f.min_flight_time as number)?.toFixed(1) ?? '—', unit: 'ms', key: 'min_flight_time' },
    { label: 'P5 Flight Time', value: (f.p5_flight_time as number)?.toFixed(1) ?? '—', unit: 'ms', key: 'mean_flight_time' },
    { label: 'P95 Flight Time', value: (f.p95_flight_time as number)?.toFixed(1) ?? '—', unit: 'ms', key: 'mean_flight_time' },
    { label: 'Std Flight Time', value: (f.std_flight_time as number)?.toFixed(1) ?? '—', unit: 'ms', key: 'std_flight_time' },
  ];
}

const RealtimeMonitor = (): ReactElement => {
  const { latestDetection, latestFeature, eventHistory } = useRealtime(true);

  const riskPercent = useMemo(() => {
    if (!latestDetection) return 0;
    return Math.round(latestDetection.risk_score * 100);
  }, [latestDetection]);

  const featureMetrics = useMemo(() => getFeatureMetrics(latestFeature as Record<string, unknown> | null), [latestFeature]);

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

  const isLive = eventHistory.length > 0;

  return (
    <>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4} flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" gap={2}>
          <Typography variant="h4" color="text.primary">Giám sát thời gian thực</Typography>
          <Chip
            label={isLive ? 'LIVE' : 'OFFLINE'}
            size="small"
            color={isLive ? 'success' : 'default'}
            sx={{
              fontWeight: 700,
              fontSize: '0.65rem',
              ...(isLive ? { animation: 'pulse 2s infinite', '@keyframes pulse': { '0%': { opacity: 1 }, '50%': { opacity: 0.5 }, '100%': { opacity: 1 } } } : {}),
            }}
          />
        </Stack>
        <Typography variant="caption" color="text.disabled">
          {isLive ? `${eventHistory.length} sự kiện` : 'Chưa có dữ liệu'}
        </Typography>
      </Stack>

      {!isLive && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Chưa kết nối WebSocket.</strong> Chạy <code>python ws_bridge.py</code> để bắt đầu giám sát.
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" color="text.primary" fontWeight={600} mb={0.5}>Kết quả phát hiện</Typography>
            <Typography variant="caption" color="text.disabled">
              {latestDetection ? `Phân tích lúc ${new Date().toLocaleTimeString('vi-VN')}` : 'Đang chờ dữ liệu từ engine...'}
            </Typography>
          </Box>
          <Stack direction="row" gap={4}>
            <Box textAlign="center">
              <Typography variant="h3" color="text.primary" fontFamily="monospace" fontWeight={700}>
                {latestDetection ? latestDetection.risk_score.toFixed(2) : '—'}
              </Typography>
              <Typography variant="caption" color="text.disabled">Điểm rủi ro</Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h3" color={latestDetection ? riskChipColor(latestDetection.risk_level) + '.main' : 'common.white'} fontFamily="monospace" fontWeight={700}>
                {riskPercent}%
              </Typography>
              <Typography variant="caption" color="text.disabled">Mức đe dọa</Typography>
            </Box>
          </Stack>
        </Stack>

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
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {ruleKeys.length > 0 && (
          <Stack direction="row" gap={1} mt={2} flexWrap="wrap">
            <Typography variant="caption" color="text.disabled">Luật kích hoạt:</Typography>
            {ruleKeys.map((r) => (
              <Chip key={r} label={r} size="small" color="error" variant="outlined" sx={{ fontWeight: 700, fontSize: '0.65rem' }} />
            ))}
          </Stack>
        )}

        {latestDetection?.reasons && latestDetection.reasons.length > 0 && (
          <Stack gap={0.75} mt={2}>
            {latestDetection.reasons.map((reason, i) => (
              <Stack key={i} direction="row" alignItems="center" gap={1}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main', flexShrink: 0 }} />
                <Typography variant="caption" color="text.primary">{reason}</Typography>
              </Stack>
            ))}
          </Stack>
        )}

        {(!latestDetection || latestDetection.reasons?.length === 0) && (
          <Stack direction="row" alignItems="center" gap={1} mt={2}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} />
            <Typography variant="caption" color="success.main">Hành vi gõ phím bình thường — không có bất thường</Typography>
          </Stack>
        )}
      </Paper>

      <Typography variant="h5" color="text.primary" mb={2}>Đặc trưng gõ phím</Typography>
      {featureMetrics ? (
        <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={2} mb={4}>
          {featureMetrics.map((m) => {
            const sev = featureSeverity(
              typeof m.value === 'number' ? m.value : parseFloat(String(m.value)) || 0,
              m.key as keyof typeof thresholds,
            );
            return (
              <Box key={m.label} gridColumn={{ xs: 'span 6', sm: 'span 4', md: 'span 3' }}>
                <MetricCard {...m} severity={sev} />
              </Box>
            );
          })}
        </Box>
      ) : (
        <Alert severity="info" sx={{ mb: 4 }}>Đang chờ feature vector từ engine... (gõ phím để kích hoạt)</Alert>
      )}

      <Typography variant="h5" color="text.primary" mb={2}>Lịch sử sự kiện ({eventHistory.length})</Typography>
      {eventHistory.length === 0 ? (
        <Alert severity="info">Chưa có sự kiện nào. Gõ phím hoặc chạy simulator để xem realtime data.</Alert>
      ) : (
        <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
              <Box component="thead" sx={{ bgcolor: 'background.default' }}>
                <Box component="tr">
                  {['Thời gian', 'Loại', 'Risk Score', 'Mức', 'Luật'].map((h) => (
                    <Box component="th" key={h} sx={{ px: 2, py: 1.5, textAlign: 'left', fontSize: '0.7rem', color: 'text.disabled', fontWeight: 600 }}>
                      {h}
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box component="tbody">
                {eventHistory.slice(0, 20).map((msg, i) => {
                  const isDetection = msg.type === 'detection_result';
                  const data = msg.data as Record<string, unknown> | undefined;
                  const label = isDetection ? riskLevelLabel((data?.risk_level as RiskLevel) ?? 'Normal') : msg.type;
                  const color = isDetection ? riskLevelHex((data?.risk_level as RiskLevel) ?? 'Normal') : '#aaa';
                  return (
                    <Box component="tr" key={i} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                      <Box component="td" sx={{ px: 2, py: 1.5, fontSize: '0.78rem', color: 'text.secondary', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {new Date(msg.timestamp || Date.now()).toLocaleTimeString('vi-VN')}
                      </Box>
                      <Box component="td" sx={{ px: 2, py: 1.5, fontSize: '0.78rem', color, whiteSpace: 'nowrap' }}>
                        {isDetection ? `${riskLevelEmoji((data?.risk_level as RiskLevel) ?? 'Normal')} ${label}` : msg.type}
                      </Box>
                      <Box component="td" sx={{ px: 2, py: 1.5, fontSize: '0.78rem', color: 'text.primary', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                        {isDetection ? ((data?.risk_score as number) ?? 0).toFixed(2) : '—'}
                      </Box>
                      <Box component="td" sx={{ px: 2, py: 1.5, fontSize: '0.78rem', color, whiteSpace: 'nowrap' }}>
                        {isDetection ? label : '—'}
                      </Box>
                      <Box component="td" sx={{ px: 2, py: 1.5, fontSize: '0.78rem', color: 'text.disabled' }}>
                        {isDetection && (data?.reasons as string[])?.length > 0
                          ? (data?.reasons as string[])?.map((r: string, ri: number) => {
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
