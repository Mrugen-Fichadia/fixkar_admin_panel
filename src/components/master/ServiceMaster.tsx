import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Paper,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import type { ServiceCategory, ServiceSubCategory } from '../../hooks/useServices';
import { useServices } from '../../hooks/useServices';

type CategoryFormState = {
  name: string;
  status: 'Active' | 'Inactive';
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
};

export default function ServiceMaster() {
  const { 
    categories = [], 
    loading = false, 
    error = null,
    addCategory, 
    updateCategory, 
    deleteCategory 
  } = useServices();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ServiceCategory | ServiceSubCategory | null>(null);
  const [category, setCategory] = useState<CategoryFormState>({ 
    name: '', 
    status: 'Active' 
  });
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedParent, setSelectedParent] = useState<string>('');
  const [snackbar, setSnackbar] = useState<SnackbarState>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  const handleAddCategory = async () => {
    const trimmedName = category.name.trim();
    if (!trimmedName) {
      setSnackbar({
        open: true,
        message: 'Please enter a category name',
        severity: 'error'
      });
      return;
    }

    try {
      const result = await addCategory({
        name: trimmedName,
        status: category.status,
        ...(selectedParent && { parentId: selectedParent })
      });
      
      if (result?.success) {
        setSnackbar({
          open: true,
          message: `Successfully added ${selectedParent ? 'subcategory' : 'category'}`,
          severity: 'success'
        });
        handleCloseDialog();
      } else {
        throw new Error(result?.error || 'Failed to add category');
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to add category',
        severity: 'error'
      });
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    const trimmedName = category.name.trim();
    if (!trimmedName) {
      setSnackbar({
        open: true,
        message: 'Please enter a category name',
        severity: 'error'
      });
      return;
    }

    try {
      const result = await updateCategory(editingCategory.id!, {
        name: trimmedName,
        status: category.status
      });
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'Category updated successfully',
          severity: 'success'
        });
        handleCloseDialog();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to update category',
        severity: 'error'
      });
    }
  };

  const handleEditClick = (categoryItem: ServiceCategory | ServiceSubCategory) => {
    setEditingCategory(categoryItem);
    setCategory({ 
      name: categoryItem.name, 
      status: categoryItem.status 
    });
    setSelectedParent('parentId' in categoryItem ? categoryItem.parentId : '');
    setIsDialogOpen(true);
  };

  const handleAddClick = (parentId: string | null = null) => {
    setEditingCategory(null);
    setCategory({ name: '', status: 'Active' });
    setSelectedParent(parentId || '');
    setIsDialogOpen(true);
  };
  
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
    setCategory({ name: '', status: 'Active' });
    setSelectedParent('');
  };
  
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCategory(prev => ({
      ...prev,
      [e.target.name]: e.target.name === 'status' ? e.target.checked ? 'Active' : 'Inactive' : e.target.value
    }));
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleStatusToggle = async (id: string) => {
    try {
      const categoryToUpdate = categories.find(c => c.id === id);
      let subToUpdate: ServiceSubCategory | undefined;
      
      if (!categoryToUpdate) {
        // Check if it's a subcategory
        for (const cat of categories) {
          subToUpdate = cat.subCategories?.find(s => s.id === id);
          if (subToUpdate) break;
        }
      }
      
      const itemToUpdate = categoryToUpdate || subToUpdate;
      if (!itemToUpdate) return;

      const newStatus = itemToUpdate.status === 'Active' ? 'Inactive' : 'Active';
      const result = await updateCategory(id, { status: newStatus });
      
      if (result?.success) {
        setSnackbar({
          open: true,
          message: 'Status updated successfully',
          severity: 'success'
        });
      } else {
        throw new Error(result?.error || 'Failed to update status');
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : 'Failed to update status',
        severity: 'error'
      });
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const result = await deleteCategory(id);
        if (result.success) {
          setSnackbar({
            open: true,
            message: 'Item deleted successfully',
            severity: 'success'
          });
        } else {
          throw new Error(result.error);
        }
      } catch (err) {
        setSnackbar({
          open: true,
          message: err instanceof Error ? err.message : 'Failed to delete item',
          severity: 'error'
        });
      }
    }
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h1">Service Categories</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => handleAddClick()}
        >
          Add Category
        </Button>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width="40px"></TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((cat) => (
                  <>
                    <TableRow key={cat.id} hover>
                      <TableCell>
                        {cat.subCategories && cat.subCategories.length > 0 ? (
                          <IconButton
                            size="small"
                            onClick={() => toggleCategory(cat.id!)}
                          >
                            {expandedCategories[cat.id!] ? (
                              <KeyboardArrowUp />
                            ) : (
                              <KeyboardArrowDown />
                            )}
                          </IconButton>
                        ) : null}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{cat.name}</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={cat.status === 'Active'}
                              onChange={() => handleStatusToggle(cat.id!)}
                              color="primary"
                            />
                          }
                          label={cat.status}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(cat.createdAt || '').toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleEditClick(cat)} size="small">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteClick(cat.id!)} size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddClick(cat.id);
                          }}
                          title="Add Subcategory"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {expandedCategories[cat.id!] && cat.subCategories?.map((sub) => (
                      <TableRow key={sub.id} hover sx={{ bgcolor: 'action.hover' }}>
                        <TableCell></TableCell>
                        <TableCell sx={{ paddingLeft: 4 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ ml: 2 }}>
                              └─ {sub.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>Subcategory</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          {new Date(sub.createdAt || '').toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleEditClick(sub)} size="small">
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteClick(sub.id!)} size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={categories.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </TableContainer>
      )}

      {/* Add/Edit Category Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingCategory 
            ? `Edit ${editingCategory && 'parentId' in editingCategory ? 'Subcategory' : 'Category'}` 
            : `Add New ${selectedParent ? 'Subcategory' : 'Category'}`}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!editingCategory && (
              <TextField
                select
                fullWidth
                label="Parent Category (leave empty for main category)"
                value={selectedParent}
                onChange={(e) => setSelectedParent(e.target.value)}
                SelectProps={{ native: true }}
                margin="normal"
              >
                <option value="">Main Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </TextField>
            )}
            
            <TextField
              label={`${selectedParent ? 'Subcategory' : 'Category'} Name`}
              fullWidth
              name="name"
              value={category.name}
              onChange={handleCategoryChange}
              margin="normal"
            />
            
            <FormControlLabel
              control={
                <Switch
                  name="status"
                  checked={category.status === 'Active'}
                  onChange={handleCategoryChange}
                  color="primary"
                />
              }
              label={`Status: ${category.status}`}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={editingCategory ? handleUpdateCategory : handleAddCategory}
            variant="contained"
            disabled={!category.name.trim()}
          >
            {editingCategory ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}