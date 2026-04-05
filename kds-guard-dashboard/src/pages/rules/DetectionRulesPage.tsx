// KDS Guard – Detection Rules Page
// Quản lý và xem chi tiết các rule phát hiện BadUSB

import { ReactElement } from 'react';
import { Box, Chip, LinearProgress, Paper, Stack, Switch, Typography } from '@mui/material';
import { detectionRulesData } from 'data/detection-rules-data';
import IconifyIcon from 'components/base/IconifyIcon';

const severityConfig: Record<string, { color: 'error' | 'warning' | 'info' | 'success'; icon: string }> = {
  critical: { color: 'error', icon: 'mdi:alert-octagon' },
  high: { color: 'warning', icon: 'mdi:alert' },
  medium: { color: 'info', icon: 'mdi:alert-circle-outline' },
  low: { color: 'success', icon: 'mdi:information-outline' },
};

const DetectionRulesPage = (): ReactElement => {
  return (
    <>
      <Typography variant="h4" color="common.white" mb={4}>
        Cấu hình luật phát hiện
      </Typography>
      <Typography variant="body1" color="text.disabled" mb={6}>
        Rule-based engine phát hiện BadUSB qua phân tích động học gõ phím.
        Mỗi luật giám sát một chỉ số hành vi và kích hoạt khi vượt ngưỡng.
      </Typography>

      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
        {detectionRulesData.map((rule) => {
          const config = severityConfig[rule.severity];
          return (
            <Box key={rule.id} gridColumn={{ xs: 'span 12', md: 'span 6', xl: 'span 4' }}>
              <Paper sx={{ p: 5, height: 1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
                  <Stack direction="row" alignItems="center" gap={2}>
                    <IconifyIcon icon={config.icon} width={24} height={24} color={`${config.color}.main`} />
                    <Box>
                      <Typography variant="body1" color="common.white" fontWeight={600}>
                        {rule.name}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {rule.id}
                      </Typography>
                    </Box>
                  </Stack>
                  <Switch defaultChecked size="small" color="primary" />
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
                    <Typography variant="caption" color="common.white" fontFamily="monospace">
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
                      label={rule.triggered ? 'TRIGGERED' : 'NORMAL'}
                      size="small"
                      color={rule.triggered ? 'error' : 'success'}
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
