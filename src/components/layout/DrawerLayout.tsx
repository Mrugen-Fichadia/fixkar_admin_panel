import React, { useState, useEffect, createContext, useContext } from 'react';
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
  Work as WorkIcon,
  SupportAgent as SupportAgentIcon,
} from '@mui/icons-material';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 260;

export interface HeaderContextType {
  setHeaderActions: React.Dispatch<React.SetStateAction<React.ReactNode>>;
  setCustomTitle: React.Dispatch<React.SetStateAction<string | null>>;
}

export const HeaderContext = createContext<HeaderContextType>({
  setHeaderActions: () => {},
  setCustomTitle: () => {},
});

export const useHeader = () => useContext(HeaderContext);

const AppBar = styled('div', {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open?: boolean }>(({ theme, open }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '56px',
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 2),
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 1px 5px 0 rgba(0, 0, 0, 0.08)',
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
    height: '56px',
    padding: theme.spacing(0, 1),
    '& .MuiToolbar-root': {
      minHeight: '56px',
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
  minHeight: '56px',
  height: '56px',
  background: theme.palette.primary.main,
  color: theme.palette.common.white,
  '& .MuiTypography-h6': {
    fontWeight: 600,
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    '& svg': {
      marginRight: theme.spacing(1.5),
      fontSize: '1.4rem',
    },
  },
}));

const Main = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open',
})<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  marginTop: '56px',
  marginLeft: 0,
  padding: theme.spacing(2.5),
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
  height: 'calc(100vh - 56px)',
  overflowY: 'auto',
  backgroundColor: theme.palette.background.default,
  boxSizing: 'border-box',
  minWidth: 0,
  [theme.breakpoints.down('md')]: {
    marginLeft: 0,
    width: '100%',
    padding: theme.spacing(1.5),
  },
}));

const menuItems = [
  { text: 'User Master', icon: <PeopleIcon />, path: '/users' },
  { text: 'Karigar Master', icon: <BuildIcon />, path: '/karigars' },
  { text: 'Jobs', icon: <WorkIcon />, path: '/jobs' },
  { text: 'Service Master', icon: <SettingsIcon />, path: '/services' },
  { text: 'Notifications', icon: <NotificationsIcon />, path: '/notifications' },
  { text: 'Blocked Users', icon: <BlockIcon />, path: '/blocked-users' },
  { text: 'Heat Map', icon: <MapIcon />, path: '/heatmap' },
  { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
  { text: 'Help & Support', icon: <SupportAgentIcon />, path: '/help-support' },
];

export default function DrawerLayout() {
  useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [headerActions, setHeaderActions] = useState<React.ReactNode>(null);
  const [customTitle, setCustomTitle] = useState<string | null>(null);

  // Clear actions when navigating between tabs
  useEffect(() => {
    setHeaderActions(null);
    setCustomTitle(null);
  }, [location.pathname]);

  const getRouteTitle = (pathname: string): string => {
    if (pathname.startsWith('/jobs')) return 'Jobs Management';
    if (pathname.startsWith('/users')) return 'Customer Management';
    if (pathname.startsWith('/karigars')) return 'Worker Management';
    if (pathname.startsWith('/services')) return 'Service Categories';
    if (pathname.startsWith('/notifications')) return 'Warning Notifications';
    if (pathname.startsWith('/blocked-users')) return 'Blocked Users';
    if (pathname.startsWith('/heatmap')) return 'Heat Map';
    if (pathname.startsWith('/reports')) return 'Reports';
    if (pathname.startsWith('/help-support')) return 'Help & Support Management';
    return '';
  };

  const activeTabTitle = customTitle || getRouteTitle(location.pathname);

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
        <Toolbar sx={{ width: '100%', minHeight: '56px !important', height: '56px', px: { xs: 1, sm: 2 }, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden', flex: 1 }}>
            <IconButton
              color="inherit"
              aria-label={open ? 'close drawer' : 'open drawer'}
              onClick={toggleDrawer}
              edge="start"
              size="small"
              sx={{
                marginRight: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                },
              }}
            >
              {open ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>

            <Typography
              variant="subtitle1"
              noWrap
              sx={{
                fontWeight: 700,
                color: 'text.secondary',
                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                userSelect: 'none',
              }}
            >
              Admin Dashboard
            </Typography>

            {activeTabTitle && (
              <>
                <Typography variant="body2" sx={{ color: 'grey.400', userSelect: 'none' }}>
                  /
                </Typography>
                <Typography
                  variant="subtitle1"
                  noWrap
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    fontSize: { xs: '0.85rem', sm: '0.95rem' },
                  }}
                >
                  {activeTabTitle}
                </Typography>
              </>
            )}

            {/* Injected Header Actions */}
            {headerActions && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: { xs: 1, sm: 2 } }}>
                {headerActions}
              </Box>
            )}
          </Box>

          <Button
            color="inherit"
            size="small"
            startIcon={<LogoutIcon fontSize="small" />}
            onClick={handleLogout}
            sx={{ ml: 1, textTransform: 'none', fontWeight: 600, fontSize: '0.82rem', flexShrink: 0 }}
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
          <IconButton onClick={toggleDrawer} sx={{ color: 'inherit' }}>
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
        <HeaderContext.Provider value={{ setHeaderActions, setCustomTitle }}>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, maxWidth: '100%' }}>
            <Outlet context={{ setHeaderActions, setCustomTitle }} />
          </Box>
        </HeaderContext.Provider>
      </Main>
    </Box>
  );
}
