import { useState } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useUsers } from '../../hooks/useUsers';
import type { User } from '../../hooks/useUsers';

export default function UserMaster() {
  const { 
    users, 
    loading, 
    error,
    updateUser, 
    deleteUser 
  } = useUsers();
  
  // Filter users to only show Customers
  const customerUsers = users.filter(user => user.role === 'Customer');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({ 
    name: '', 
    email: '',
    phone: '',
    address: '',
    role: 'Customer',
    isActive: true
  });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const handleUpdateUser = async () => {
    if (!editingUser?.id) return;
    
    try {
      const result = await updateUser(editingUser.id, formData as Omit<User, 'id' | 'createdAt'>);
      if (result.success) {
        setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
        handleCloseModal();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setSnackbar({ 
        open: true, 
        message: error instanceof Error ? error.message : 'Failed to update user', 
        severity: 'error' 
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const result = await deleteUser(id);
        if (result.success) {
          setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error('Error deleting user:', error);
        setSnackbar({ 
          open: true, 
          message: error instanceof Error ? error.message : 'Failed to delete user', 
          severity: 'error' 
        });
      }
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'Customer',
      isActive: user.isActive !== undefined ? user.isActive : true
    });
    setIsAddModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setEditingUser(null);
    setFormData({ 
      name: '', 
      email: '',
      phone: '',
      address: '',
      role: 'Customer',
      isActive: true
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">Customer Management</Typography>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ p: 2, backgroundColor: '#ffebee', borderRadius: 1 }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : (
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {customerUsers.length > 0 ? (
                    customerUsers.map((user) => (
                      <TableRow key={user.uid || user.id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone || 'N/A'}</TableCell>
                        <TableCell sx={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} 
                                  title={user.address}>
                          {user.address || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ 
                            display: 'inline-block', 
                            px: 1, 
                            py: 0.5, 
                            borderRadius: 1,
                            backgroundColor: user.isActive ? 'success.light' : 'grey.300',
                            color: user.isActive ? 'success.contrastText' : 'text.secondary',
                            fontSize: '0.75rem',
                            fontWeight: 'medium'
                          }}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditClick(user)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteUser(user.id || '')}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No customers found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      <Dialog open={isAddModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone"
              name="phone"
              value={formData.phone || ''}
              onChange={handleInputChange}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address || ''}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                name="isActive"
                value={formData.isActive?.toString() || 'true'}
                onChange={handleInputChange}
                label="Status"
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button 
            onClick={handleUpdateUser} 
            variant="contained" 
            color="primary"
            disabled={!formData.name || !formData.email}
          >
            {editingUser ? 'Update' : 'Add'} Customer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
