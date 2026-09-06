import { useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { Theme } from '@mui/material/styles';
import MuiDrawer from '@mui/material/Drawer';
import { 
  Box,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  Logout as LogoutIcon,
  People as PeopleIcon,
  Build as BuildIcon,
  Settings as SettingsIcon,
  Map as MapIcon,
  Assessment as ReportsIcon,
  Notifications as NotificationsIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate } from 'react-router-dom';

const drawerWidth = 260;

const AppBar = styled('div', {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '80px',
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 2),
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 2px 10px 0 rgba(0, 0, 0, 0.08)',
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
  [theme.breakpoints.down('sm')]: {
    height: '64px',
    '& .MuiToolbar-root': {
      minHeight: '64px',
    },
  },
}));

const openedMixin = (theme: Theme) => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme) => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const Drawer = styled(MuiDrawer, { 
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  flexShrink: 0,
  whiteSpace: 'nowrap',
  '& .MuiDrawer-paper': {
    boxSizing: 'border-box',
    position: 'relative',
    left: 0,
    height: '100vh',
    zIndex: theme.zIndex.drawer,
    ...(open ? {
      ...openedMixin(theme),
      '& .MuiListItemButton-root': {
        paddingLeft: theme.spacing(3),
      },
    } : {
      ...closedMixin(theme),
      '&:hover': {
        '& .MuiListItemButton-root': {
          paddingLeft: theme.spacing(3),
        },
      },
    }),
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: theme.zIndex.drawer + 2,
      transform: open ? 'translateX(0)' : 'translateX(-100%)',
      transition: theme.transitions.create('transform', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
  },
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2),
  minHeight: '80px',
  background: theme.palette.primary.main,
  color: theme.palette.common.white,
  '& .MuiTypography-h6': {
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: theme.spacing(1.5),
      fontSize: '1.8rem',
    },
  },
}));

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open',
})<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  marginTop: '80px',
  marginLeft: 0,
  padding: theme.spacing(3),
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`
  }),
  display: 'flex',
  flexDirection: 'column',
  minHeight: 'calc(100vh - 80px)',
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
    width: '100%',
    padding: theme.spacing(2),
  },
}));

const menuItems = [
  { text: 'User Master', icon: <PeopleIcon />, path: '/users' },
  { text: 'Karigar Master', icon: <BuildIcon />, path: '/karigars' },
  { text: 'Service Master', icon: <SettingsIcon />, path: '/services' },
  { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  { text: 'Blocked Users', icon: <BlockIcon />, path: '/blocked-users' },
  { text: 'Heat Map', icon: <MapIcon />, path: '/heatmap' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
];

export default function DrawerLayout() {
  // Theme is used by styled components
  useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/login';
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar open={open}>
        <Toolbar sx={{ width: '100%', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label={open ? 'close drawer' : 'open drawer'}
              onClick={toggleDrawer}
              edge="start"
              sx={{
                marginRight: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              {open ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Admin Dashboard
            </Typography>
          </Box>
          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ ml: 2 }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        open={open}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            position: 'relative',
          },
        }}
      >
        <DrawerHeader>
          <Typography variant="h6" sx={{ flexGrow: 1, ml: 2 }}>
            Menu
          </Typography>
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton onClick={() => navigate(item.path)}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Main open={open}>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
          <Outlet />
        </Box>
      </Main>
    </Box>
  );
}
