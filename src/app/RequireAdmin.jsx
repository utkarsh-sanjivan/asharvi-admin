import React from 'react';
import { CircularProgress, Stack } from '@mui/material';
import { useAuth } from '../auth/AuthContext';
import ForbiddenPage from '../pages/Forbidden/Forbidden';

const RequireAdmin = ({ children }) => {
  const { hasAdminRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: '60vh' }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!hasAdminRole) {
    return <ForbiddenPage />;
  }

  return children;
};

export default RequireAdmin;
