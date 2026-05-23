// KDS Guard – Detection Rules Page
// Quản lý và xem chi tiết các rule phát hiện BadUSB

import { ReactElement, useState } from 'react';
import { Box, Button, Chip, LinearProgress, Paper, Stack, Switch, Typography } from '@mui/material';
import { detectionRulesData } from 'data/detection-rules-data';
import IconifyIcon from 'components/base/IconifyIcon';
import { useRuleConfig } from 'hooks/useRuleConfig';

const severityConfig: Record<string, { color: 'error' | 'warning' | 'info' | 'success'; icon: string }> = {
  critical: { color: 'error', icon: 'mdi:alert-octagon' },
  high: { color: 'warning', icon: 'mdi:alert' },
  medium: { color: 'info', icon: 'mdi:alert-circle-outline' },
  low: { color: 'success', icon: 'mdi:information-outline' },
};

const DetectionRulesPage = (): ReactElement => {
  const { isRuleEnabled, toggleRule, getRuleCount, resetAllRules } = useRuleConfig();
  const [showDisabled, setShowDisabled] = useState(false);

  const { enabled, total } = getRuleCount();
  const filteredRules = showDisabled ? detectionRulesData : detectionRulesData.filter((r) => isRuleEnabled(r.id));

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" color="text.primary" mb={1}>Cấu hình luật phát hiện</Typography>
          <Typography variant="body1" color="text.disabled">
            Rule-based engine phát hiện BadUSB qua phân tích động học gõ phím.
            Mỗi luật giám sát một chỉ số hành vi và kích hoạt khi vượt ngưỡng.
          </Typography>
        </Box>
        <Stack direction="row" gap={2} alignItems="center" flexWrap="wrap">
          <Chip
            label={`${enabled}/${total} luật đang bật`}
            size="small"
            color={enabled === total ? 'success' : 'warning'}
            sx={{ fontWeight: 700 }}
          />
          <Button
            variant="outlined"
            size="small"
            startIcon={<IconifyIcon icon="mdi:eye-off-outline" />}
            onClick={() => setShowDisabled((v) => !v)}
            sx={{ color: 'text.secondary', borderColor: 'divider' }}
          >
            {showDisabled ? 'Ẩn luật tắt' : 'Hiện luật tắt'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<IconifyIcon icon="mdi:refresh" />}
            onClick={resetAllRules}
            sx={{ color: 'text.secondary', borderColor: 'divider' }}
          >
            Bật tất cả
          </Button>
        </Stack>
      </Stack>

      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
        {filteredRules.map((rule) => {
          const config = severityConfig[rule.severity];
          const enabled = isRuleEnabled(rule.id);

          return (
            <Box key={rule.id} gridColumn={{ xs: 'span 12', md: 'span 6', xl: 'span 4' }}>
              <Paper
                sx={{
                  p: 5,
                  height: 1,
                  opacity: enabled ? 1 : 0.5,
                  transition: 'opacity 0.2s',
                }}
              >
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
                  <Stack direction="row" alignItems="center" gap={2}>
                    <IconifyIcon icon={config.icon} width={24} height={24} color={`${config.color}.main`} />
                    <Box>
                      <Stack direction="row" alignItems="center" gap={1}>
                        <Typography variant="body1" color="text.primary" fontWeight={600}>
                          {rule.name}
                        </Typography>
                        <Chip
                          label={rule.id}
                          size="small"
                          color="default"
                          sx={{ fontWeight: 700, fontSize: '0.65rem', height: 18 }}
                        />
                      </Stack>
                      <Typography variant="caption" color="text.disabled">
                        {rule.severity.toUpperCase()} · +{rule.weight.toFixed(2)}
                      </Typography>
                    </Box>
                  </Stack>
                  <Switch
                    size="small"
                    color="primary"
                    checked={enabled}
                    onChange={(_, checked) => toggleRule(rule.id, checked)}
                  />
                </Stack>

                <Typography variant="body2" color="text.disabled" mb={3}>
                  {rule.description}
                </Typography>

                <Stack gap={2}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.disabled">Ngưỡng</Typography>
                    <Typography variant="caption" color="warning.main" fontFamily="monospace" fontWeight={700}>
                      {rule.threshold}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.disabled">Giá trị hiện tại</Typography>
                    <Typography variant="caption" color="text.primary" fontFamily="monospace">
                      {rule.currentValue}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.disabled">Độ tin cậy</Typography>
                    <Stack direction="row" alignItems="center" gap={1} flex={0.6}>
                      <LinearProgress
                        variant="determinate"
                        value={rule.confidence}
                        color={config.color}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="caption" color="text.disabled">
                        {rule.confidence}%
                      </Typography>
                    </Stack>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                    <Typography variant="caption" color="text.disabled">Mức nghiêm trọng</Typography>
                    <Chip
                      label={rule.severity.toUpperCase()}
                      size="small"
                      color={config.color}
                      sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.disabled">Trọng số (đóng góp)</Typography>
                    <Typography variant="caption" color="primary.main" fontFamily="monospace" fontWeight={700}>
                      +{rule.weight.toFixed(2)}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.disabled">Trạng thái</Typography>
                    <Chip
                      label={rule.triggered ? 'TRIGGERED' : enabled ? 'NORMAL' : 'DISABLED'}
                      size="small"
                      color={rule.triggered ? 'error' : enabled ? 'success' : 'default'}
                      sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                    />
                  </Stack>
                </Stack>
              </Paper>
            </Box>
          );
        })}
      </Box>
    </>
  );
};

export default DetectionRulesPage;
