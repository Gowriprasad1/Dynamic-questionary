import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Fab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { formsAPI, categoriesAPI } from '../services/api';
import FormBuilder from '../components/FormBuilder';
import FormEditor from '../components/FormEditor';
import DynamicForm from '../components/DynamicForm';
import QuestionAdder from '../components/QuestionAdder';

const HomePage = () => {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedForm, setSelectedForm] = useState(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [showFormEditor, setShowFormEditor] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [formToDelete, setFormToDelete] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [showQuestionAdder, setShowQuestionAdder] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [targetFormForQuestion, setTargetFormForQuestion] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchForms();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Initialize default categories if fetch fails
      setCategories([
        { name: 'Health' },
        { name: 'Travel' },
        { name: 'Occupation' },
        { name: 'Avocation' }
      ]);
    }
  };

  const fetchForms = async () => {
    try {
      setLoading(true);
      const response = await formsAPI.getAll();
      setForms(response.data);
    } catch (err) {
      setError('Failed to load forms');
      console.error('Error fetching forms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormCreated = (newForm) => {
    // Add new form to the list
    setForms([newForm, ...forms]);
    setShowFormBuilder(false);
    setEditFormData(null);
    setSelectedTab(0);
  };

  const handleFormUpdated = (updatedForm) => {
    // Update existing form in the list
    setForms(forms.map(form => form._id === updatedForm._id ? updatedForm : form));
    setShowFormEditor(false);
    setEditFormData(null);
    setSelectedTab(0);
  };

  const handleCreateSampleForm = async () => {
    try {
      setLoading(true);
      const response = await formsAPI.createSample();
      setForms([response.data, ...forms]);
      setError('');
    } catch (err) {
      setError('Failed to create sample form');
      console.error('Error creating sample form:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewForm = (form) => {
    setSelectedForm(form);
    setSelectedTab(1);
  };

  const handleFormSubmitted = () => {
    setSelectedForm(null);
    setSelectedTab(0);
  };

  const handleDeleteForm = async (formId) => {
    try {
      setLoading(true);
      await formsAPI.delete(formId);
      setForms(forms.filter(form => form._id !== formId));
      setDeleteDialogOpen(false);
      setFormToDelete(null);
      setError('');
    } catch (err) {
      setError('Failed to delete form');
      console.error('Error deleting form:', err);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteDialog = (form) => {
    setFormToDelete(form);
    setDeleteDialogOpen(true);
  };

  const handleEditForm = (form) => {
    setEditFormData(form);
    setShowFormEditor(true);
    setShowFormBuilder(false);
  };

  const handleCancelEdit = () => {
    setShowFormBuilder(false);
    setShowFormEditor(false);
    setEditFormData(null);
  };

  const handleAddQuestionToCategory = (category) => {
    // Find or create a form for this category
    const categoryForm = forms.find(form => 
      form.title.toLowerCase().includes(category.toLowerCase()) ||
      form.questions?.some(q => q.questionType === category)
    );

    if (categoryForm) {
      setTargetFormForQuestion(categoryForm);
      setSelectedCategory(category);
      setShowQuestionAdder(true);
      setShowFormBuilder(false);
      setShowFormEditor(false);
    } else {
      // Create a new form for this category
      setSelectedCategory(category);
      setShowFormBuilder(true);
      setShowQuestionAdder(false);
      setShowFormEditor(false);
    }
  };

  const handleQuestionAdded = async (questionData) => {
    try {
      setLoading(true);
      const response = await formsAPI.addQuestion(targetFormForQuestion._id, questionData);
      
      // Update the forms list with the updated form
      setForms(forms.map(form => 
        form._id === targetFormForQuestion._id ? response.data : form
      ));
      
      setShowQuestionAdder(false);
      setTargetFormForQuestion(null);
      setSelectedCategory(null);
      setError('');
    } catch (err) {
      setError('Failed to add question');
      console.error('Error adding question:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelQuestionAdd = () => {
    setShowQuestionAdder(false);
    setTargetFormForQuestion(null);
    setSelectedCategory(null);
  };

  const getFilteredForms = () => {
    if (categoryFilter === 'All') {
      return forms;
    }
    return forms.filter(form => 
      form.questions?.some(q => q.questionType === categoryFilter)
    );
  };

  const renderFormCard = (form) => {
    const categories = [...new Set(form.questions?.map(q => q.questionType) || [])];
    const primaryCategory = categories[0]; // Get the primary category for this form
    
    return (
      <Card key={form._id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            {form.title}
          </Typography>
          {form.description && (
            <Typography variant="body2" color="text.secondary" paragraph>
              {form.description}
            </Typography>
          )}
          <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {categories.map((cat, idx) => (
              <Chip key={idx} label={cat} size="small" color="primary" variant="outlined" />
            ))}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {form.questions ? form.questions.length : form.fields?.length || 0} question{(form.questions ? form.questions.length : form.fields?.length || 0) !== 1 ? 's' : ''}
          </Typography>
          <Typography variant="caption" display="block" color="text.secondary">
            Created: {new Date(form.createdAt).toLocaleDateString()}
          </Typography>
        </CardContent>
        <CardActions sx={{ flexWrap: 'wrap', gap: 0.5 }}>
          <Button
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => handleViewForm(form)}
          >
            View Form
          </Button>
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={() => handleEditForm(form)}
            color="primary"
          >
            Edit
          </Button>
          <Button
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => openDeleteDialog(form)}
            color="error"
          >
            Delete
          </Button>
          {primaryCategory && (
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => handleAddQuestionToCategory(primaryCategory)}
              variant="outlined"
              color="success"
            >
              Add Question
            </Button>
          )}
        </CardActions>
      </Card>
    );
  };

  const renderFormsList = () => {
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ margin: 2 }}>
          {error}
        </Alert>
      );
    }

    if (forms.length === 0) {
      return (
        <Box textAlign="center" padding={4}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No forms created yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Create your first dynamic form to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowFormBuilder(true)}
          >
            Create Form
          </Button>
        </Box>
      );
    }

    const filteredForms = getFilteredForms();

    return (
      <>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FilterIcon />
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Filter by Category</InputLabel>
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              label="Filter by Category"
            >
              <MenuItem value="All">All Categories</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat._id || cat.name} value={cat.name}>
                  {cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredForms.length} of {forms.length} forms
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {filteredForms.map(renderFormCard)}
        </Grid>
      </>
    );
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MERN Dynamic Form Builder
          </Typography>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            textColor="inherit"
            indicatorColor="secondary"
          >
            <Tab label="Forms" />
            {selectedForm && <Tab label="Fill Form" />}
          </Tabs>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ marginTop: 3, marginBottom: 3 }}>
        {selectedTab === 0 && (
          <>
            {showQuestionAdder ? (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
                  <Typography variant="h5">
                    Add Question to {selectedCategory} Category
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleCancelQuestionAdd}
                  >
                    Cancel
                  </Button>
                </Box>
                <QuestionAdder
                  category={selectedCategory}
                  onQuestionAdded={handleQuestionAdded}
                  onCancel={handleCancelQuestionAdd}
                />
              </>
            ) : showFormEditor ? (
              <FormEditor
                formData={editFormData}
                onFormUpdated={handleFormUpdated}
                onCancel={handleCancelEdit}
              />
            ) : showFormBuilder ? (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={2}>
                  <Typography variant="h5">
                    {selectedCategory ? `Create ${selectedCategory} Form` : 'Create New Form'}
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                </Box>
                <FormBuilder 
                  onFormCreated={handleFormCreated}
                  editFormData={selectedCategory ? {
                    title: `${selectedCategory} Assessment Form`,
                    description: `Form for ${selectedCategory} related questions`,
                    questions: []
                  } : null}
                />
              </>
            ) : (
              <>
                <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={3}>
                  <Typography variant="h4" component="h1">
                    Your Forms
                  </Typography>
                  <Box display="flex" gap={2}>
                    <Button
                      variant="outlined"
                      onClick={handleCreateSampleForm}
                      disabled={loading}
                    >
                      Create Sample Form
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setShowFormBuilder(true)}
                    >
                      Create New Form
                    </Button>
                  </Box>
                </Box>
                {renderFormsList()}
              </>
            )}
          </>
        )}

        {selectedTab === 1 && selectedForm && (
          <DynamicForm
            formId={selectedForm._id}
            onSuccess={handleFormSubmitted}
          />
        )}
      </Container>

      {!showFormBuilder && !showFormEditor && !showQuestionAdder && selectedTab === 0 && (
        <Fab
          color="primary"
          aria-label="add"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setShowFormBuilder(true)}
        >
          <AddIcon />
        </Fab>
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Form</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the form "{formToDelete?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => handleDeleteForm(formToDelete._id)} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HomePage;
