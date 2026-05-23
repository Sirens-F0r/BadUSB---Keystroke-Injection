import {
  Badge,
  Chip,
  Stack,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { ReactElement, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { drawerCloseWidth, drawerOpenWidth } from '..';
import UserDropdown from './UserDropdown';
import { useBreakpoints } from 'providers/BreakpointsProvider';
import { useThemeMode } from 'providers/ThemeProvider';

const Topbar = ({
  open,
  handleDrawerToggle,
}: {
  open: boolean;
  handleDrawerToggle: () => void;
}): ReactElement => {
  const { down } = useBreakpoints();
  const navigate = useNavigate();
  const { mode, toggleMode } = useThemeMode();

  const isMobileScreen = down('sm');

  const handleBellClick = useCallback(() => {
    navigate('/alerts');
  }, [navigate]);

  return (
    <AppBar
      position="fixed"
      sx={{
        left: 0,
        ml: isMobileScreen ? 0 : open ? 60 : 27.5,
        width: isMobileScreen
          ? 1
          : open
            ? `calc(100% - ${drawerOpenWidth}px)`
            : `calc(100% - ${drawerCloseWidth}px)`,
        paddingRight: '0 !important',
      }}
    >
      <Toolbar
        component={Stack}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{
          bgcolor: 'background.default',
          height: 64,
        }}
      >
        <Stack direction="row" gap={2} alignItems="center" ml={2.5} flex="1 1 52.5%">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
          >
            <IconifyIcon
              icon={open ? 'ri:menu-unfold-4-line' : 'ri:menu-unfold-3-line'}
              sx={{ color: 'text.primary' }}
            />
          </IconButton>

          {/* System Status Indicator */}
          <Stack
            direction="row"
            gap={2}
            alignItems="center"
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            <Chip
              icon={<IconifyIcon icon="mdi:shield-check" />}
              label="ĐANG BẢO VỆ"
              color="success"
              size="small"
              sx={{ fontWeight: 700, fontSize: '0.75rem', pl: 0.5 }}
            />
            <Typography variant="body2" color="text.disabled">
              KDS Guard v1.0 · Hệ thống đang hoạt động
            </Typography>
          </Stack>
        </Stack>
        <Stack
          direction="row"
          gap={3.75}
          alignItems="center"
          justifyContent="flex-end"
          mr={3.75}
          flex="1 1 20%"
        >
          {/* Dark/Light Mode Toggle */}
          <Tooltip title={mode === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}>
            <IconButton
              onClick={toggleMode}
              sx={{
                padding: 1,
                color: mode === 'dark' ? 'warning.main' : 'primary.main',
              }}
            >
              <IconifyIcon
                icon={mode === 'dark' ? 'ph:sun-bold' : 'ph:moon-bold'}
                width={22}
                height={26}
              />
            </IconButton>
          </Tooltip>
          <Badge
            color="error"
            badgeContent=" "
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                top: 11,
                right: 11,
              },
            }}
          >
            <IconButton
              onClick={handleBellClick}
              sx={{
                padding: 1,
              }}
            >
              <IconifyIcon icon="ph:bell-bold" width={29} height={32} />
            </IconButton>
          </Badge>
          <UserDropdown />
        </Stack>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
