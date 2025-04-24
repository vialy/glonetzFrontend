import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserList from './UserList';
import CertificateList from './CertificateList';
import GroupManagement from './GroupManagement';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // If user is not available, redirect to login
  if (!user) {
    navigate('/login');
    return null;
  }

  // Définir les onglets en fonction du rôle de l'utilisateur
  const tabs = [
    { label: "Certificates", component: <CertificateList /> },
    ...(user.role === 'admin' ? [
      { label: "Users", component: <UserList /> },
      { label: "Groups", component: <GroupManagement /> }
    ] : [])
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {isMobile ? (
            // Version mobile de la barre d'outils
            <>
              <Typography variant="h6" component="div" noWrap>
                Dashboard
              </Typography>
              <IconButton
                color="inherit"
                onClick={handleMenuClick}
                edge="end"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
              >
                <MenuItem disabled>
                  <Typography variant="body2">
                    {user.username}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ExitToAppIcon sx={{ mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            // Version desktop de la barre d'outils
            <>
              <Typography variant="h6" component="div">
                Dashboard
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: theme.palette.secondary.main, mr: 1 }}>
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
                <Typography variant="subtitle1" sx={{ mr: 2 }}>
                  {user.username}
                </Typography>
                <Button 
                  color="inherit" 
                  onClick={handleLogout}
                  startIcon={<ExitToAppIcon />}
                >
                  Logout
                </Button>
              </Box>
            </>
          )}
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="lg" sx={{ 
        mt: 4, 
        px: isMobile ? 1 : 3,
        overflow: 'hidden'
      }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          gutterBottom
          sx={{ mb: 3, textAlign: isMobile ? 'center' : 'left' }}
        >
          Welcome to your Dashboard
        </Typography>
        
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider', 
          mb: 3,
          width: '100%',
          overflow: 'auto'
        }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
          >
            {tabs.map((tab, index) => (
              <Tab 
                key={tab.label}
                label={tab.label}
                sx={{ 
                  minWidth: isMobile ? `${100/tabs.length}%` : 'auto',
                  fontSize: isMobile ? '0.875rem' : '1rem'
                }}
              />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ mt: 2 }}>
          {tabs[activeTab]?.component}
        </Box>
      </Container>
    </Box>
  );
};

export default Dashboard; 