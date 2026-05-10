import { lazy, Suspense, ReactElement, PropsWithChildren } from 'react';
import { Outlet, RouteObject, createHashRouter } from 'react-router-dom';

import PageLoader from 'components/loading/PageLoader';
import Splash from 'components/loading/Splash';

const App = lazy<() => ReactElement>(() => import('App'));

const MainLayout = lazy<({ children }: PropsWithChildren) => ReactElement>(
  () => import('layouts/main-layout'),
);

// Pages
const Dashboard = lazy<() => ReactElement>(() => import('pages/dashboard/Dashboard'));
const RealtimeMonitor = lazy<() => ReactElement>(() => import('pages/realtime/RealtimeMonitor'));
const DetectionRulesPage = lazy<() => ReactElement>(() => import('pages/rules/DetectionRulesPage'));
const AlertsPage = lazy<() => ReactElement>(() => import('pages/alerts/AlertsPage'));
const DevicesPage = lazy<() => ReactElement>(() => import('pages/devices/DevicesPage'));
const LogsPage = lazy<() => ReactElement>(() => import('pages/logs/LogsPage'));
const PoliciesPage = lazy<() => ReactElement>(() => import('pages/policies/PoliciesPage'));
const SettingsPage = lazy<() => ReactElement>(() => import('pages/settings/SettingsPage'));
const AboutPage = lazy<() => ReactElement>(() => import('pages/about/AboutPage'));
const ErrorPage = lazy<() => ReactElement>(() => import('pages/error/ErrorPage'));

const routes: RouteObject[] = [
  {
    element: (
      <Suspense fallback={<Splash />}>
        <App />
      </Suspense>
    ),
    children: [
      {
        path: '/',
        element: (
          <MainLayout>
            <Suspense fallback={<PageLoader />}>
              <Outlet />
            </Suspense>
          </MainLayout>
        ),
        children: [
          { index: true, element: <Dashboard /> },
          { path: 'realtime', element: <RealtimeMonitor /> },
          { path: 'rules', element: <DetectionRulesPage /> },
          { path: 'alerts', element: <AlertsPage /> },
          { path: 'devices', element: <DevicesPage /> },
          { path: 'logs', element: <LogsPage /> },
          { path: 'policies', element: <PoliciesPage /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'about', element: <AboutPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <ErrorPage />,
  },
];

const router = createHashRouter(routes);

export default router;
