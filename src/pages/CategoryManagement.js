import React, { useState, useEffect } from 'react';
import '../ui/insta/_form.scss';
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
      <div className="insta-page" style={{ paddingTop: 12 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 16, textAlign: 'center' }}>
          <div className="insta-card" style={{ padding: 24 }}>Loading categories...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="insta-page" style={{ paddingTop: 12 }}>
      <div className="insta-card" style={{ maxWidth: 1000, margin: '0 auto', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 22 }}>Category Management</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {categories.length === 0 && (
              <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} onClick={handleInitializeDefaults}>Initialize Default Categories</button>
            )}
            <button className="insta-button" onClick={() => handleOpenDialog()}>Add Category</button>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 12, color: 'var(--insta-red)', background: '#ffeef0', padding: 12, borderRadius: 8 }}>{error}</div>
        )}
        {success && (
          <div style={{ marginBottom: 12, color: 'green', background: '#eaf9ea', padding: 12, borderRadius: 8 }}>{success}</div>
        )}

        {categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <div style={{ fontSize: 18, color: 'var(--insta-muted)', marginBottom: 6 }}>No categories found</div>
            <div style={{ color: 'var(--insta-muted)' }}>Create your first category or initialize default categories</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {categories.map((category) => (
              <div key={category._id} className="insta-card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ fontWeight: 700 }}>{category.name}</div>
                  <span style={{ border: '1px solid var(--insta-border)', borderRadius: 10, padding: '2px 8px', fontSize: 12, color: category.isActive ? 'green' : '#555' }}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {category.description && (
                  <div style={{ color: 'var(--insta-muted)', marginBottom: 6 }}>{category.description}</div>
                )}
                <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>Order: {category.order}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} onClick={() => handleOpenDialog(category)}>Edit</button>
                  <button className="insta-button" style={{ background: '#fff', color: category.isActive ? '#a15c00' : 'green', border: `1px solid ${category.isActive ? '#a15c00' : 'green'}` }} onClick={() => handleToggleActive(category)}>
                    {category.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }} onClick={() => handleDeleteClick(category)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      {dialogOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="insta-card" style={{ width: '90%', maxWidth: 520, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{editingCategory ? 'Edit Category' : 'Add New Category'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input className="ui-input" placeholder="Category Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <textarea className="ui-input" rows={3} placeholder="Description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
              <input className="ui-input" type="number" placeholder="Order" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} onClick={handleCloseDialog}>Cancel</button>
              <button className="insta-button" onClick={handleSubmit}>{editingCategory ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation modal */}
      {deleteDialogOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="insta-card" style={{ width: '90%', maxWidth: 480, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Delete Category</div>
            <div style={{ color: 'var(--insta-muted)', marginBottom: 12 }}>
              Are you sure you want to delete the category "{categoryToDelete?.name}"? This action cannot be undone.
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} onClick={() => setDeleteDialogOpen(false)}>Cancel</button>
              <button className="insta-button" style={{ background: 'var(--insta-red)' }} onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
