import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { categoriesAPI } from '../services/api';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    order: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAllIncludingInactive();
      setCategories(response.data);
    } catch (err) {
      setError('Failed to load categories');
      console.error('Error fetching categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        order: category.order || 0,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        order: categories.length,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', order: 0 });
  };

  const handleSubmit = async () => {
    try {
      setError('');
      if (!formData.name.trim()) {
        setError('Category name is required');
        return;
      }

      if (editingCategory) {
        await categoriesAPI.update(editingCategory._id, formData);
        setSuccess('Category updated successfully');
      } else {
        await categoriesAPI.create(formData);
        setSuccess('Category created successfully');
      }

      handleCloseDialog();
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category');
      console.error('Error saving category:', err);
    }
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await categoriesAPI.delete(categoryToDelete._id);
      setSuccess('Category deleted successfully');
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
      console.error('Error deleting category:', err);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      const response = await categoriesAPI.initializeDefaults();
      setSuccess(response.data.message);
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize categories');
      console.error('Error initializing categories:', err);
    }
  };

  const handleToggleActive = async (category) => {
    try {
      await categoriesAPI.update(category._id, {
        isActive: !category.isActive,
      });
      setSuccess(`Category ${category.isActive ? 'deactivated' : 'activated'} successfully`);
      fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update category status');
      console.error('Error updating category:', err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ marginTop: 3, marginBottom: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={3}>
        <Typography variant="h4" component="h1">
          Category Management
        </Typography>
        <Box display="flex" gap={2}>
          {categories.length === 0 && (
            <Button
              variant="outlined"
              onClick={handleInitializeDefaults}
            >
              Initialize Default Categories
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Category
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ marginBottom: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ marginBottom: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {categories.length === 0 ? (
        <Box textAlign="center" padding={4}>
          <CategoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No categories found
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first category or initialize default categories
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category._id}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" component="h2">
                      {category.name}
                    </Typography>
                    <Chip
                      label={category.isActive ? 'Active' : 'Inactive'}
                      color={category.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>
                  {category.description && (
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {category.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Order: {category.order}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenDialog(category)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleToggleActive(category)}
                    color={category.isActive ? 'warning' : 'success'}
                  >
                    {category.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteClick(category)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Category Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              label="Order"
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              fullWidth
              helperText="Lower numbers appear first"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCategory ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the category "{categoryToDelete?.name}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CategoryManagement;
