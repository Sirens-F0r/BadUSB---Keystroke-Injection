// KDS Guard – User Menu Items

interface UserMenuItem {
  id: number;
  title: string;
  icon: string;
  path: string;
  color?: string;
}

const userMenuItems: UserMenuItem[] = [
  {
    id: 1,
    title: 'System Status',
    icon: 'mdi:shield-check',
    path: '/',
    color: 'text.primary',
  },
  {
    id: 2,
    title: 'Settings',
    icon: 'mdi:cog-outline',
    path: '/settings',
    color: 'text.primary',
  },
  {
    id: 3,
    title: 'Notifications',
    icon: 'mdi:bell-outline',
    path: '/alerts',
    color: 'text.primary',
  },
  {
    id: 4,
    title: 'Help & Documentation',
    icon: 'mdi:help-circle-outline',
    path: '/about',
    color: 'text.primary',
  },
  {
    id: 5,
    title: 'About KDS Guard',
    icon: 'mdi:information-outline',
    path: '/about',
    color: 'text.primary',
  },
  {
    id: 6,
    title: 'User Profile',
    icon: 'mdi:account-circle-outline',
    path: '/profile',
    color: 'primary.main',
  },
];

export default userMenuItems;
