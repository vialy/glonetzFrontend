import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute = ({ children }) => {
  const { token, user } = useAuth();

  // If token is not available, redirect to login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // If user is not available yet, show loading
  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return children;
};

export default PrivateRoute; 