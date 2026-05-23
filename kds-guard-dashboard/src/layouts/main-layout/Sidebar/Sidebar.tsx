// KDS Guard – Sidebar

import { ReactElement } from 'react';
import { List, Toolbar } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import navItems from 'data/nav-items';
import SimpleBar from 'simplebar-react';
import NavItem from './NavItem';
import { drawerCloseWidth, drawerOpenWidth } from '..';
import Image from 'components/base/Image';

const logoPath = '/Logo bảo mật KDS Guard.png';

const Sidebar = ({ open }: { open: boolean }): ReactElement => {
  return (
    <>
      <Toolbar
        sx={{
          position: 'fixed',
          height: 64,
          zIndex: 1,
          bgcolor: 'background.default',
          p: 0,
          justifyContent: 'center',
          width: open ? drawerOpenWidth - 1 : drawerCloseWidth - 1,
        }}
      >
        <RouterLink
          to="/"
          style={{
            marginTop: 24,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            src={logoPath}
            alt="KDS Guard"
            height={open ? 52 : 36}
            sx={{ objectFit: 'contain' }}
          />
        </RouterLink>
      </Toolbar>
      <SimpleBar style={{ maxHeight: 'calc(100vh - 64px)', width: '100%' }}>
        <List
          component="nav"
          sx={{
            mt: 4,
            py: 2.5,
            height: 'calc(100vh - 64px)',
            justifyContent: 'space-between',
          }}
        >
          {navItems.map((navItem) => (
            <NavItem key={navItem.id} navItem={navItem} open={open} />
          ))}
        </List>
      </SimpleBar>
    </>
  );
};

export default Sidebar;
