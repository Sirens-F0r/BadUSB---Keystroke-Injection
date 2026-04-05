// KDS Guard – Event Log DataGrid Table

import { ReactElement, useMemo } from 'react';
import { Chip } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { eventLogRows } from 'data/event-log-data';
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
        <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
          <span style={{ color: 'inherit' }}>{val.toFixed(2)}</span>
        </span>
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
  const filteredRows = useMemo(() => {
    if (!searchText) return eventLogRows;
    const lowerSearch = searchText.toLowerCase();
    return eventLogRows.filter(
      (row) =>
        row.details?.toString().toLowerCase().includes(lowerSearch) ||
        row.eventType?.toString().toLowerCase().includes(lowerSearch) ||
        row.source?.toString().toLowerCase().includes(lowerSearch) ||
        row.triggeredRules?.toString().toLowerCase().includes(lowerSearch),
    );
  }, [searchText]);

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
