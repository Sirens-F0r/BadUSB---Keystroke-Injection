export interface NavItem {
  id: number;
  path: string;
  title: string;
  icon: string;
  active: boolean;
}

const navItems: NavItem[] = [
  {
    id: 1,
    path: '/',
    title: 'Dashboard',
    icon: 'mdi:shield-check',
    active: true,
  },
  {
    id: 2,
    path: '/realtime',
    title: 'Realtime Monitor',
    icon: 'mdi:monitor-eye',
    active: true,
  },
  {
    id: 3,
    path: '/rules',
    title: 'Detection Rules',
    icon: 'mdi:target',
    active: true,
  },
  {
    id: 4,
    path: '/alerts',
    title: 'Alerts',
    icon: 'mdi:alert-octagon',
    active: true,
  },
  {
    id: 5,
    path: '/devices',
    title: 'Devices',
    icon: 'mdi:usb',
    active: true,
  },
  {
    id: 6,
    path: '/logs',
    title: 'Logs',
    icon: 'mdi:file-document-outline',
    active: true,
  },
  {
    id: 7,
    path: '/policies',
    title: 'Policies',
    icon: 'mdi:shield-lock-outline',
    active: true,
  },
  {
    id: 8,
    path: '/settings',
    title: 'Settings',
    icon: 'mdi:cog-outline',
    active: true,
  },
  {
    id: 9,
    path: '/about',
    title: 'About KDS Guard',
    icon: 'mdi:information-outline',
    active: true,
  },
  {
    id: 10,
    path: '/profile',
    title: 'User Profile',
    icon: 'mdi:account-circle-outline',
    active: true,
  },
];

export default navItems;
