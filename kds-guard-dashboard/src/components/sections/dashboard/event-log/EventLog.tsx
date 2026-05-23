// KDS Guard – Event Log Section

import { useState, ChangeEvent, useCallback, ReactElement } from 'react';
import { Box, Paper, TextField, Typography, InputAdornment } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import EventLogTable from './EventLogTable';

const EventLog = (): ReactElement => {
  const [search, setSearch] = useState<string>('');

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.currentTarget.value);
  }, []);

  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <Box sx={{ px: 4, py: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="h5" color="text.primary" fontWeight={600}>
          Nhật ký sự kiện
        </Typography>
        <TextField
          variant="filled"
          placeholder="Search..."
          value={search}
          onChange={handleChange}
          sx={{
            '.MuiFilledInput-root': {
              bgcolor: 'background.default',
              borderRadius: 1.5,
              '&:hover': { bgcolor: 'action.hover' },
              '&:focus-within': { bgcolor: 'background.default' },
            },
            height: 36,
            minWidth: 180,
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="end">
                <IconifyIcon icon="akar-icons:search" width={13} height={13} />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <Box width={1}>
        <EventLogTable searchText={search} />
      </Box>
    </Paper>
  );
};

export default EventLog;
