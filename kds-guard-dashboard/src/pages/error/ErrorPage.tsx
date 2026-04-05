// KDS Guard – Error 404 Page

import { ReactElement } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Stack, Button, Typography } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';

const ErrorPage = (): ReactElement => {
  return (
    <Stack
      minHeight="100vh"
      width="fit-content"
      mx="auto"
      justifyContent="center"
      alignItems="center"
      gap={6}
      py={12}
    >
      <IconifyIcon icon="mdi:shield-off-outline" width={120} height={120} color="text.disabled" />
      <Typography variant="h1" color="text.secondary">
        404 – Page Not Found
      </Typography>
      <Typography
        variant="h5"
        fontWeight={400}
        color="text.primary"
        maxWidth={500}
        textAlign="center"
      >
        The page you're looking for doesn't exist or has been moved.
      </Typography>
      <Button
        component={RouterLink}
        to="/"
        size="large"
        variant="contained"
        startIcon={<IconifyIcon icon="mdi:shield-check" />}
      >
        Back to Dashboard
      </Button>
    </Stack>
  );
};

export default ErrorPage;
