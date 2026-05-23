// KDS Guard – Footer
import { Box, Typography } from '@mui/material';
import { ReactElement } from 'react';

const Footer = ({ open }: { open: boolean }): ReactElement => {
  return (
    <Box
      component="footer"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: 40,
        px: { xs: 3, sm: 5.175 },
        bgcolor: 'background.default',
        borderTop: '1px solid',
        borderColor: 'divider',
        ml: open ? 0 : 0,
      }}
    >
      <Typography variant="caption" color="text.disabled">
        KDS Guard · Keystroke Dynamics Security Guard · © 2026
      </Typography>
    </Box>
  );
};

export default Footer;
