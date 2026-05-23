// KDS Guard – Footer
import { Box, Typography } from '@mui/material';
import { ReactElement } from 'react';
import { drawerCloseWidth, drawerOpenWidth } from '..';

const Footer = ({ open }: { open: boolean }): ReactElement => {
  return (
    <Box
      component="footer"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 40,
        px: { xs: 2, sm: 3 },
        bgcolor: 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider',
        ml: { xs: 0, sm: `${open ? drawerOpenWidth : drawerCloseWidth}px` },
        transition: 'margin-left 0.2s',
      }}
    >
      <Typography variant="caption" color="text.disabled">
        KDS Guard · Keystroke Dynamics Security Guard · © 2026
      </Typography>
    </Box>
  );
};

export default Footer;
