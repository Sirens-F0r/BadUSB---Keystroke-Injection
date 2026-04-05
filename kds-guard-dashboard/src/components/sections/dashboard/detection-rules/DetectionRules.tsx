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
    <Paper sx={{ p: { xs: 4, sm: 8 }, height: 1 }}>
      <Typography variant="h4" color="common.white" mb={6}>
        Luật phát hiện
      </Typography>
      <TableContainer component={SimpleBar}>
        <Table sx={{ minWidth: 600 }}>
          <TableHead>
            <TableRow>
              <TableCell align="left">ID</TableCell>
              <TableCell align="left">Rule</TableCell>
              <TableCell align="left">Threshold</TableCell>
              <TableCell align="left">Current</TableCell>
              <TableCell align="center">Status</TableCell>
              <TableCell align="center">Confidence</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {detectionRulesData.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>
                  <Typography variant="body2" color="text.disabled">
                    {rule.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="common.white" fontWeight={600}>
                    {rule.name}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {rule.description}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="warning.main" fontFamily="monospace">
                    {rule.threshold}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="common.white" fontFamily="monospace">
                    {rule.currentValue}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={rule.triggered ? 'TRIGGERED' : 'NORMAL'}
                    size="small"
                    color={rule.triggered ? 'error' : 'success'}
                    sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={rule.confidence}
                      color={severityColors[rule.severity]}
                      sx={{ flex: 1, height: 6, borderRadius: 3 }}
                    />
                    <Typography variant="caption" color="text.disabled">
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
