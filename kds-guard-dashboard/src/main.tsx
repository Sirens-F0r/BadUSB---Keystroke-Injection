import React from 'react';
import ReactDOM from 'react-dom/client';
import theme from 'theme/theme.ts';
import { RouterProvider } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import BreakpointsProvider from 'providers/BreakpointsProvider.tsx';
import { DashboardSnapshotProvider } from 'providers/DashboardSnapshotProvider.tsx';
import router from 'routes/router';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BreakpointsProvider>
        <DashboardSnapshotProvider>
          <CssBaseline />
          <RouterProvider router={router} />
        </DashboardSnapshotProvider>
      </BreakpointsProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
