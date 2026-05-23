// KDS Guard – Event Log DataGrid Table

import { ReactElement, useMemo } from 'react';
import { Box, Chip } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { eventLogRows as fallbackEventLogRows } from 'data/event-log-data';
import { useDashboardSnapshot } from 'providers/DashboardSnapshotProvider.tsx';
import CustomPagination from 'components/common/CustomPagination';
import CustomNoResultsOverlay from 'components/common/CustomNoResultsOverlay';

const eventTypeColors: Record<string, 'error' | 'warning' | 'info' | 'success' | 'default'> = {
  CRITICAL: 'error',
  ALERT: 'warning',
  WARNING: 'info',
  INFO: 'success',
};

const columns: GridColDef[] = [
  {
    field: 'timestamp',
    headerName: 'Timestamp',
    width: 170,
    headerAlign: 'left',
    align: 'left',
  },
  {
    field: 'eventType',
    headerName: 'Type',
    width: 110,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
      <Chip
        label={params.value}
        size="small"
        color={eventTypeColors[params.value as string] || 'default'}
        sx={{ fontWeight: 700, fontSize: '0.65rem' }}
      />
    ),
  },
  {
    field: 'source',
    headerName: 'Source',
    width: 140,
    headerAlign: 'left',
    align: 'left',
  },
  {
    field: 'riskScore',
    headerName: 'Risk',
    width: 80,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => {
      const val = params.value as number;
      const color = val > 0.7 ? 'error.main' : val > 0.4 ? 'warning.main' : 'success.main';
      return (
        <Box component="span" sx={{ fontFamily: 'monospace', fontWeight: 700, color }}>
          {val.toFixed(2)}
        </Box>
      );
    },
  },
  {
    field: 'triggeredRules',
    headerName: 'Rules',
    width: 140,
    headerAlign: 'left',
    align: 'left',
  },
  {
    field: 'action',
    headerName: 'Action',
    width: 110,
    headerAlign: 'center',
    align: 'center',
  },
  {
    field: 'details',
    headerName: 'Details',
    flex: 1,
    minWidth: 250,
    headerAlign: 'left',
    align: 'left',
  },
];

const EventLogTable = ({ searchText }: { searchText: string }): ReactElement => {
  const { eventLogRows } = useDashboardSnapshot();
  const rows = eventLogRows?.length ? eventLogRows : fallbackEventLogRows;

  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    const lowerSearch = searchText.toLowerCase();
    return rows.filter(
      (row) =>
        row.details?.toString().toLowerCase().includes(lowerSearch) ||
        row.eventType?.toString().toLowerCase().includes(lowerSearch) ||
        row.source?.toString().toLowerCase().includes(lowerSearch) ||
        row.triggeredRules?.toString().toLowerCase().includes(lowerSearch),
    );
  }, [searchText, rows]);

  return (
    <DataGrid
      autoHeight
      rows={filteredRows}
      columns={columns}
      disableColumnMenu
      disableRowSelectionOnClick
      initialState={{
        pagination: { paginationModel: { pageSize: 5 } },
      }}
      pageSizeOptions={[5]}
      slots={{
        pagination: CustomPagination,
        noResultsOverlay: CustomNoResultsOverlay,
      }}
      sx={{
        '& .MuiDataGrid-main': {
          '& .MuiDataGrid-columnHeaders': {
            border: 'none',
          },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within':
          {
            outline: 'none',
          },
        },
        border: 'none',
      }}
    />
  );
};

export default EventLogTable;
