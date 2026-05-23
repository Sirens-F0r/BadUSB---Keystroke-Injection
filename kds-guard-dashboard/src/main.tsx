import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import ThemeProvider from 'providers/ThemeProvider';
import BreakpointsProvider from 'providers/BreakpointsProvider.tsx';
import { DashboardSnapshotProvider } from 'providers/DashboardSnapshotProvider.tsx';
import router from 'routes/router';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BreakpointsProvider>
        <DashboardSnapshotProvider>
          <CssBaseline />
          <RouterProvider router={router} />
        </DashboardSnapshotProvider>
      </BreakpointsProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
