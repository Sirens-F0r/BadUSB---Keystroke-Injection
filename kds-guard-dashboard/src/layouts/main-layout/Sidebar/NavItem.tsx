// KDS Guard – Sidebar Navigation Item

import { Box, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import IconifyIcon from 'components/base/IconifyIcon';
import { NavItem as NavItemProps } from 'data/nav-items';
import { useLocation } from 'react-router-dom';

const NavItem = ({ navItem, open }: { navItem: NavItemProps; open: boolean }) => {
  const { pathname } = useLocation();
  const isActive = pathname === navItem.path;

  return (
    <ListItem
      disablePadding
      sx={{
        display: 'block',
        px: open ? 3 : 1.5,
        position: 'relative',
      }}
    >
      {isActive && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 3,
            height: '70%',
            bgcolor: 'primary.main',
            borderRadius: '0 2px 2px 0',
            transition: 'height 0.2s',
          }}
        />
      )}
      <ListItemButton
        component={RouterLink}
        to={navItem.path}
        sx={{
          opacity: navItem.active ? 1 : 0.5,
          bgcolor: isActive ? (open ? 'primary.main' : 'background.paper') : 'transparent',
          borderRadius: 1,
          justifyContent: open ? 'flex-start' : 'center',
          px: open ? 2 : 1,
          py: 1,
          minHeight: 40,
          '&:hover': {
            bgcolor: isActive
              ? open
                ? 'primary.dark'
                : 'background.paper'
              : 'action.hover',
          },
          '& .MuiTouchRipple-root': {
            color: isActive ? 'primary.light' : 'text.disabled',
          },
        }}
      >
        <ListItemIcon
          sx={{
            width: 20,
            height: 20,
            mr: open ? 2 : 0,
            color: isActive
              ? open
                ? 'common.white'
                : 'primary.main'
              : 'text.primary',
            minWidth: 'unset',
          }}
        >
          <IconifyIcon icon={navItem.icon} width={1} height={1} />
        </ListItemIcon>
        <ListItemText
          primary={navItem.title}
          sx={{
            display: open ? 'inline-block' : 'none',
            opacity: open ? 1 : 0,
            color: isActive ? 'common.white' : '',
            ml: 0,
            '& .MuiListItemText-primary': {
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
            },
          }}
        />
      </ListItemButton>
    </ListItem>
  );
};

export default NavItem;
