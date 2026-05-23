// KDS Guard – Detection Rules Table

import { ReactElement } from 'react';
import {
  Paper,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
  Chip,
  LinearProgress,
  Box,
} from '@mui/material';
import { detectionRulesData } from 'data/detection-rules-data';
import SimpleBar from 'simplebar-react';

const severityColors: Record<string, 'error' | 'warning' | 'info' | 'success'> = {
  critical: 'error',
  high: 'warning',
  medium: 'info',
  low: 'success',
};

const DetectionRules = (): ReactElement => {
  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ px: 4, py: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" color="text.primary" fontWeight={600}>
            Luật phát hiện
          </Typography>
          <Typography variant="caption" color="text.disabled">
            {detectionRulesData.filter(r => r.triggered).length} / {detectionRulesData.length} luật đang trigger
          </Typography>
        </Box>
        <Chip
          label={`${detectionRulesData.filter(r => r.triggered).length} TRIGGERED`}
          size="small"
          color="error"
          sx={{ fontWeight: 700, fontSize: '0.65rem' }}
        />
      </Box>
      <TableContainer component={SimpleBar}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: 'background.default', color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem', py: 1.5 }} align="left">ID</TableCell>
              <TableCell sx={{ bgcolor: 'background.default', color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem', py: 1.5 }} align="left">Rule</TableCell>
              <TableCell sx={{ bgcolor: 'background.default', color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem', py: 1.5 }} align="left">Threshold</TableCell>
              <TableCell sx={{ bgcolor: 'background.default', color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem', py: 1.5 }} align="left">Current</TableCell>
              <TableCell sx={{ bgcolor: 'background.default', color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem', py: 1.5 }} align="center">Status</TableCell>
              <TableCell sx={{ bgcolor: 'background.default', color: 'text.disabled', fontWeight: 600, fontSize: '0.7rem', py: 1.5 }} align="center">Confidence</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {detectionRulesData.map((rule) => (
              <TableRow key={rule.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                <TableCell sx={{ py: 1.5 }}>
                  <Typography variant="body2" color="text.disabled" fontFamily="monospace" fontSize="0.7rem">
                    {rule.id}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1.5 }}>
                  <Typography variant="body2" color="text.primary" fontWeight={500} fontSize="0.8rem">
                    {rule.name}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1.5 }}>
                  <Typography variant="body2" color="warning.main" fontFamily="monospace" fontSize="0.8rem">
                    {rule.threshold}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 1.5 }}>
                  <Typography variant="body2" color="text.primary" fontFamily="monospace" fontSize="0.8rem">
                    {rule.currentValue}
                  </Typography>
                </TableCell>
                <TableCell align="center" sx={{ py: 1.5 }}>
                  <Chip
                    label={rule.triggered ? 'TRIGGERED' : 'NORMAL'}
                    size="small"
                    color={rule.triggered ? 'error' : 'success'}
                    sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                  />
                </TableCell>
                <TableCell align="center" sx={{ py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
                    <LinearProgress
                      variant="determinate"
                      value={rule.confidence}
                      color={severityColors[rule.severity]}
                      sx={{ flex: 1, height: 4, borderRadius: 2 }}
                    />
                    <Typography variant="caption" color="text.disabled" sx={{ minWidth: 32, textAlign: 'right' }}>
                      {rule.confidence}%
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DetectionRules;
