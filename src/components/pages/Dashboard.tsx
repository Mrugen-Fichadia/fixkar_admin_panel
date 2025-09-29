import React from 'react';
import { Box, Typography, Paper, Grid } from '@mui/material';
import {
  People as PeopleIcon,
  Build as BuildIcon,
  Settings as SettingsIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';

const StatCard = ({ title, value, icon: Icon, color = 'primary' }) => (
  <Paper sx={{ p: 3, height: '100%' }}>
    <Box display="flex" alignItems="center">
      <Box
        sx={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: `${color}.light`,
          color: `${color}.contrastText`,
          mr: 2,
        }}
      >
        <Icon fontSize="large" />
      </Box>
      <Box>
        <Typography variant="h6" color="textSecondary">
          {title}
        </Typography>
        <Typography variant="h4">{value}</Typography>
      </Box>
    </Box>
  </Paper>
);

export default function Dashboard() {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Users" value="1,234" icon={PeopleIcon} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Karigars" value="56" icon={BuildIcon} color="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Services" value="24" icon={SettingsIcon} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Revenue" value="₹1,23,456" icon={MoneyIcon} color="warning" />
        </Grid>
      </Grid>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>
        <Box display="flex" gap={2} flexWrap="wrap">
          <Box
            sx={{
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            <Typography>Add New User</Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            <Typography>Register Karigar</Typography>
          </Box>
          <Box
            sx={{
              p: 2,
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': { borderColor: 'primary.main' },
            }}
          >
            <Typography>Create Service</Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
