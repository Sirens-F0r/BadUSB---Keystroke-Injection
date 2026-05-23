import { useState, ReactElement, PropsWithChildren } from 'react';
import { Box, Drawer } from '@mui/material';
import Topbar from './Topbar/Topbar';
import Sidebar from './Sidebar/Sidebar';
import Footer from './Footer/Footer';

export const drawerOpenWidth = 240;
export const drawerCloseWidth = 72;

const MainLayout = ({ children }: PropsWithChildren): ReactElement => {
  const [open, setOpen] = useState<boolean>(false);
  const handleDrawerToggle = () => setOpen(!open);

  return (
    <>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Topbar open={open} handleDrawerToggle={handleDrawerToggle} />
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={open}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerOpenWidth },
          }}
        >
          <Sidebar open={open} />
        </Drawer>
        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          component="aside"
          open={open}
          sx={{
            display: { xs: 'none', sm: 'block' },
            width: open ? drawerOpenWidth : drawerCloseWidth,
            '& .MuiDrawer-paper': {
              width: open ? drawerOpenWidth : drawerCloseWidth,
              bgcolor: 'background.default',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <Sidebar open={open} />
        </Drawer>
        <Box
          component="main"
          overflow="auto"
          sx={{
            width: 1,
            flexGrow: 1,
            pt: 2,
            pr: { xs: 2, sm: 3 },
            pb: 4,
            pl: { xs: 2, sm: 3 },
          }}
        >
          <Box sx={{ height: 76, flexShrink: 0 }} />
          {children}
        </Box>
      </Box>
      <Footer open={open} />
    </>
  );
};

export default MainLayout;
