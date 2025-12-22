import React from 'react';
import {
  AppBar,
  Box,
  Chip,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Toolbar,
  Typography,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import SettingsIcon from '@mui/icons-material/Settings';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { ENVIRONMENTS } from '../../config/environment';
import styles from '../../styles/AppLayout.module.css';

const drawerWidth = 240;

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
  { label: 'Courses', path: '/courses', icon: <SchoolIcon fontSize="small" /> },
  { label: 'Settings', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
];

const AppLayout = ({ environment, onEnvironmentChange }) => {
  const location = useLocation();

  return (
    <Box className={styles.appShell}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={1}
        sx={{
          width: `calc(100% - ${drawerWidth}px)`,
          ml: `${drawerWidth}px`,
          backdropFilter: 'blur(10px)',
        }}
      >
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Asharvi Admin
          </Typography>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="environment-select-label">Environment</InputLabel>
            <Select
              labelId="environment-select-label"
              id="environment-select"
              value={environment}
              label="Environment"
              onChange={(event) => onEnvironmentChange(event.target.value)}
            >
              <MenuItem value={ENVIRONMENTS.staging}>Staging</MenuItem>
              <MenuItem value={ENVIRONMENTS.production}>Production</MenuItem>
            </Select>
          </FormControl>
          {environment === ENVIRONMENTS.production && (
            <Chip
              className={styles.productionChip}
              color="error"
              variant="outlined"
              label="Production"
              size="small"
            />
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            paddingTop: '12px',
          },
        }}
        classes={{ paper: styles.drawerPaper }}
      >
        <Toolbar>
          <Typography variant="subtitle1" className={styles.navHeader}>
            Navigation
          </Typography>
        </Toolbar>
        <Divider />
        <List className={styles.navList}>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <ListItemButton
                key={item.path}
                component={Link}
                to={item.path}
                selected={isActive}
                sx={{ borderRadius: '10px', margin: '4px 12px' }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: isActive ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            );
          })}
        </List>
      </Drawer>

      <Box component="main" className={styles.mainContent}>
        <div className={styles.toolbarSpacer} />
        <div className={styles.contentInner}>
          <Outlet />
        </div>
      </Box>
    </Box>
  );
};

export default AppLayout;
