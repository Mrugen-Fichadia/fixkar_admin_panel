import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  Select,
  InputLabel,
  Snackbar,
  Alert,
  Autocomplete,
  Chip,
  Card,
  CardContent,
  Grid,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Send as SendIcon,
  Warning as WarningIcon,
  Block as BlockIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useUsers, type User } from '../../hooks/useUsers';
import { useNotifications } from '../../hooks/useNotifications';

export default function NotificationMaster() {
  const { users, loading: usersLoading } = useUsers();
  const { sendWarningAndBlock, loading: isSubmitting } = useNotifications();

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [title, setTitle] = useState('Warning Notice');
  const [message, setMessage] = useState('');
  const [violationReason, setViolationReason] = useState('');
  const [executionTime, setExecutionTime] = useState<'Immediate' | 'After 24 Hours' | 'After 15 Days' | 'Custom Date'>('Immediate');
  const [customExecutionDate, setCustomExecutionDate] = useState('');
  const [blockType, setBlockType] = useState<'Temporary' | 'Permanent'>('Temporary');
  const [blockDuration, setBlockDuration] = useState<'1 Month' | '3 Months' | '6 Months' | string>('1 Month');
  const [customDuration, setCustomDuration] = useState('');

  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const durationOptions = [
    { label: '1 Month', value: '1 Month' },
    { label: '3 Months', value: '3 Months' },
    { label: '6 Months', value: '6 Months' },
    { label: 'Custom Date', value: 'Custom' },
  ];

  const handleOpenConfirm = () => {
    if (!selectedUser) {
      setSnackbar({ open: true, message: 'Please select a Target User or Karigar', severity: 'error' });
      return;
    }
    if (!message.trim()) {
      setSnackbar({ open: true, message: 'Notification text message is mandatory', severity: 'error' });
      return;
    }
    if (!violationReason.trim()) {
      setSnackbar({ open: true, message: 'Violation reason is mandatory before sending notification/blocking', severity: 'error' });
      return;
    }
    if (executionTime === 'Custom Date' && !customExecutionDate) {
      setSnackbar({ open: true, message: 'Please select a custom block start date and time', severity: 'error' });
      return;
    }
    if (blockType === 'Temporary' && !blockDuration) {
      setSnackbar({ open: true, message: 'Please specify the temporary block duration', severity: 'error' });
      return;
    }
    if (blockType === 'Temporary' && blockDuration === 'Custom' && !customDuration) {
      setSnackbar({ open: true, message: 'Please pick a custom unblock date', severity: 'error' });
      return;
    }

    // --- Date comparison check ---
    const now = new Date();
    let execDateObj: Date = now;
    if (executionTime === 'After 24 Hours') {
      execDateObj = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (executionTime === 'After 15 Days') {
      execDateObj = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000);
    } else if (executionTime === 'Custom Date' && customExecutionDate) {
      execDateObj = new Date(customExecutionDate);
    }

    let unblockDateObj: Date | null = null;
    if (blockType === 'Temporary') {
      if (blockDuration === '1 Month') {
        unblockDateObj = new Date(execDateObj);
        unblockDateObj.setMonth(unblockDateObj.getMonth() + 1);
      } else if (blockDuration === '3 Months') {
        unblockDateObj = new Date(execDateObj);
        unblockDateObj.setMonth(unblockDateObj.getMonth() + 3);
      } else if (blockDuration === '6 Months') {
        unblockDateObj = new Date(execDateObj);
        unblockDateObj.setMonth(unblockDateObj.getMonth() + 6);
      } else if (blockDuration === 'Custom' && customDuration) {
        unblockDateObj = new Date(customDuration);
      }
    }

    if (blockType === 'Temporary' && unblockDateObj && execDateObj.getTime() >= unblockDateObj.getTime()) {
      setSnackbar({
        open: true,
        message: 'Execution Timing (when block starts) must be earlier than the Temporary Unblock date (when block ends).',
        severity: 'error',
      });
      return;
    }

    setConfirmDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;

    setConfirmDialogOpen(false);

    const finalDuration = blockType === 'Temporary'
      ? (blockDuration === 'Custom' ? customDuration : blockDuration)
      : undefined;

    const result = await sendWarningAndBlock({
      user: selectedUser,
      title: title.trim() || 'Warning Notice',
      message: message.trim(),
      violationReason: violationReason.trim(),
      executionTime,
      customExecutionDate: executionTime === 'Custom Date' ? customExecutionDate : undefined,
      blockType,
      blockDuration: finalDuration,
    });

    if (result.success) {
      setSnackbar({
        open: true,
        message: `Warning notification sent and user ${executionTime === 'Immediate' ? 'blocked immediately' : `scheduled for block (${executionTime === 'Custom Date' ? customExecutionDate : executionTime})`}`,
        severity: 'success',
      });
      // Reset form
      setSelectedUser(null);
      setMessage('');
      setViolationReason('');
      setTitle('Warning Notice');
      setExecutionTime('Immediate');
      setCustomExecutionDate('');
      setBlockType('Temporary');
      setBlockDuration('1 Month');
      setCustomDuration('');
    } else {
      setSnackbar({
        open: true,
        message: result.error || 'Failed to process warning & block operation',
        severity: 'error',
      });
    }
  };

  return (
    <Box sx={{ width: '100%', height: 'calc(100vh - 128px)', overflowY: 'auto', pr: 1, pb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <WarningIcon color="warning" sx={{ fontSize: 32 }} />
        <Typography variant="h5" fontWeight={600}>
          Warning Notifications & Account Blocking
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" /> 1. Select Target User or Karigar
        </Typography>

        <Autocomplete
          options={users}
          loading={usersLoading}
          getOptionLabel={(option) => `${option.name} (${option.role}) - ID: ${option.id || option.uid || 'N/A'}`}
          value={selectedUser}
          onChange={(_, newValue) => setSelectedUser(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search User/Karigar by Name, Role or User ID *"
              variant="outlined"
              fullWidth
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {usersLoading ? <CircularProgress color="inherit" size={20} /> : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id || option.uid}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body1" fontWeight={600}>{option.name}</Typography>
                  <Chip
                    label={option.role}
                    size="small"
                    color={option.role === 'Worker' ? 'secondary' : 'default'}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  ID: {option.id || option.uid} | Email: {option.email} | Phone: {option.phone || 'N/A'}
                </Typography>
              </Box>
            </Box>
          )}
        />

        {selectedUser && (
          <Card variant="outlined" sx={{ mt: 2, bgcolor: 'grey.50' }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Name:</Typography>
                  <Typography variant="body1" fontWeight={600}>{selectedUser.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Role:</Typography>
                  <Chip label={selectedUser.role} color={selectedUser.role === 'Worker' ? 'secondary' : 'default'} size="small" />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">User ID:</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{selectedUser.id || selectedUser.uid || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email / Phone:</Typography>
                  <Typography variant="body2">{selectedUser.email} | {selectedUser.phone || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Mobile App Push Notification (FCM):</Typography>
                  <Chip 
                    label={selectedUser.fcmToken ? 'FCM Push Token Available' : 'No FCM Token Registered'} 
                    color={selectedUser.fcmToken ? 'success' : 'default'} 
                    size="small" 
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <BlockIcon color="error" /> 2. Warning Notification & Mandatory Blocking Details
        </Typography>

        <Box component="form" noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            fullWidth
            label="Notification Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            variant="outlined"
          />

          <TextField
            fullWidth
            required
            multiline
            rows={3}
            label="Warning Message Text *"
            placeholder="Type warning text message to send to user notification collection..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            variant="outlined"
            helperText="This text message will be stored in user/worker notifications sub-collection."
          />

          <Divider />

          <TextField
            fullWidth
            required
            multiline
            rows={2}
            label="Violation Reason *"
            placeholder="Enter reason for violation / warning (Mandatory before blocking)..."
            value={violationReason}
            onChange={(e) => setViolationReason(e.target.value)}
            variant="outlined"
            error={!violationReason && confirmDialogOpen}
            helperText="Mandatory field. Must detail violation before sending notification or storing block data."
          />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" required>
                <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                  Execution Timing *
                </FormLabel>
                <RadioGroup
                  value={executionTime}
                  onChange={(e) => setExecutionTime(e.target.value as 'Immediate' | 'After 24 Hours' | 'After 15 Days' | 'Custom Date')}
                >
                  <FormControlLabel value="Immediate" control={<Radio color="error" />} label="Block Immediately" />
                  <FormControlLabel value="After 24 Hours" control={<Radio color="warning" />} label="Block After 24 Hours" />
                  <FormControlLabel value="After 15 Days" control={<Radio color="warning" />} label="Block After 15 Days" />
                  <FormControlLabel value="Custom Date" control={<Radio color="warning" />} label="Custom Execution Date" />
                </RadioGroup>

                {executionTime === 'Custom Date' && (
                  <TextField
                    sx={{ mt: 1.5 }}
                    fullWidth
                    size="small"
                    type="datetime-local"
                    label="Custom Block Execution Start Date *"
                    InputLabelProps={{ shrink: true }}
                    value={customExecutionDate}
                    onChange={(e) => setCustomExecutionDate(e.target.value)}
                  />
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl component="fieldset" required>
                <FormLabel component="legend" sx={{ fontWeight: 600, mb: 1, color: 'text.primary' }}>
                  Blocking Type *
                </FormLabel>
                <RadioGroup
                  value={blockType}
                  onChange={(e) => setBlockType(e.target.value as 'Temporary' | 'Permanent')}
                >
                  <FormControlLabel value="Temporary" control={<Radio color="warning" />} label="Temporary Blocking (Limited Time)" />
                  <FormControlLabel value="Permanent" control={<Radio color="error" />} label="Permanent Blocking" />
                </RadioGroup>
              </FormControl>

              {blockType === 'Temporary' && (
                <Box sx={{ mt: 2 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Block Duration *</InputLabel>
                    <Select
                      value={blockDuration}
                      label="Block Duration *"
                      onChange={(e) => setBlockDuration(e.target.value)}
                    >
                      {durationOptions.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {blockDuration === 'Custom' && (
                    <TextField
                      sx={{ mt: 2 }}
                      fullWidth
                      size="small"
                      type="date"
                      label="Custom Unblock Date"
                      InputLabelProps={{ shrink: true }}
                      value={customDuration}
                      onChange={(e) => setCustomDuration(e.target.value)}
                    />
                  )}
                </Box>
              )}
            </Grid>
          </Grid>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="error"
              size="large"
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              disabled={isSubmitting}
              onClick={handleOpenConfirm}
            >
              Send Warning & Record Block
            </Button>
          </Box>
        </Box>
      </Paper>

      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main', display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningIcon /> Confirm Warning & Account Blocking
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" paragraph>
            Are you sure you want to send this warning notification and block <strong>{selectedUser?.name}</strong>?
          </Typography>
          <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
            <Typography variant="body2"><strong>Execution Timing:</strong> {executionTime === 'Custom Date' ? `Custom (${customExecutionDate})` : executionTime}</Typography>
            <Typography variant="body2"><strong>Block Type:</strong> {blockType} {blockType === 'Temporary' ? `(${blockDuration === 'Custom' ? customDuration : blockDuration})` : ''}</Typography>
            <Typography variant="body2"><strong>Violation Reason:</strong> {violationReason}</Typography>
            <Typography variant="body2"><strong>Warning Message:</strong> {message}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} color="error" variant="contained" disabled={isSubmitting}>
            Confirm & Send
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
