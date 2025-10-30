import React, { useState, useEffect } from 'react';
import '../ui/insta/_form.scss';
import { UiModal } from '../ui/insta/_form';
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
      <div key={form._id} className="insta-card admin-card" style={{ padding: 16 }}>
        <div className="admin-body">
          <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>{form.title}</div>
          {form.description && (
            <div style={{ color: 'var(--insta-muted)', marginBottom: 8 }}>
              {form.description}
            </div>
          )}
          <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {categories.map((cat, idx) => (
              <span key={idx} style={{ border: '1px solid var(--insta-primary)', color: 'var(--insta-primary)', borderRadius: 14, padding: '2px 8px', fontSize: 12 }}>{cat}</span>
            ))}
          </div>
          <div style={{ color: 'var(--insta-muted)', fontSize: 14 }}>
            {form.questions ? form.questions.length : form.fields?.length || 0} question{(form.questions ? form.questions.length : form.fields?.length || 0) !== 1 ? 's' : ''}
          </div>
          <div style={{ color: 'var(--insta-muted)', fontSize: 12 }}>Created: {new Date(form.createdAt).toLocaleDateString()}</div>
        </div>
        <div className="admin-actions">
          <button className="insta-button btn-outline-primary" onClick={() => handleViewForm(form)}>View Form</button>
          <button className="insta-button btn-outline-primary" onClick={() => handleEditForm(form)}>Edit</button>
          <button className="insta-button btn-outline-danger" onClick={() => openDeleteDialog(form)}>Delete</button>
          {primaryCategory && (
            <button className="insta-button btn-outline-primary" onClick={() => handleAddQuestionToCategory(primaryCategory)}>Add Question</button>
          )}
        </div>
      </div>
    );
  };

  const renderFormsList = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <div className="insta-card" style={{ padding: 16 }}>Loading forms...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ margin: 12, color: 'var(--insta-red)', background: '#ffeef0', padding: 12, borderRadius: 8 }}>
          {error}
        </div>
      );
    }

    if (forms.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--insta-muted)' }}>No forms created yet</div>
          <div style={{ color: 'var(--insta-muted)', marginBottom: 12 }}>Create your first dynamic form to get started</div>
          <button className="insta-button" onClick={() => setShowFormBuilder(true)}>Create Form</button>
        </div>
      );
    }

    const filteredForms = getFilteredForms();

    return (
      <>
        <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ color: 'var(--insta-primary)', fontWeight: 600 }}>Filter</div>
          <div>
            <label className="ui-input-label" style={{ display: 'block', marginBottom: 4 }}>Filter by Category</label>
            <select className="ui-input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="All">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div style={{ color: 'var(--insta-muted)' }}>
            Showing {filteredForms.length} of {forms.length} forms
          </div>
        </div>
        <div className="admin-grid">
          {filteredForms.map(renderFormCard)}
        </div>
      </>
    );
  };

  return (
    <div className="insta-page" style={{ paddingBottom: 96 }}>
      {/* <div style={{ background: 'var(--insta-primary)', color: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700 }}>MERN Dynamic Form Builder</div>
          <div className="insta-tabs" role="tablist">
            <button className={`insta-tab ${selectedTab === 0 ? 'active' : ''}`} onClick={() => setSelectedTab(0)}>Forms</button>
            {selectedForm && <button className={`insta-tab ${selectedTab === 1 ? 'active' : ''}`} onClick={() => setSelectedTab(1)}>Fill Form</button>}
          </div>
        </div>
      </div> */}

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
        {selectedTab === 0 && (
          <>
            {showQuestionAdder ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>Add Question to {selectedCategory} Category</div>
                  <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} onClick={handleCancelQuestionAdd}>Cancel</button>
                </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: 18 }}>{selectedCategory ? `Create ${selectedCategory} Form` : 'Create New Form'}</div>
                  <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} onClick={handleCancelEdit}>Cancel</button>
                </div>
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontWeight: 800, fontSize: 22 }}>Your Forms</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} onClick={handleCreateSampleForm} disabled={loading}>Create Sample Form</button>
                    <button className="insta-button" onClick={() => setShowFormBuilder(true)}>Create New Form</button>
                  </div>
                </div>
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
      </div>

      {!showFormBuilder && !showFormEditor && !showQuestionAdder && selectedTab === 0 && (
        <button
          className="insta-button"
          style={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={() => setShowFormBuilder(true)}
        >
          + New Form
        </button>
      )}

      <UiModal isShowing={deleteDialogOpen} hide={() => setDeleteDialogOpen(false)}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Delete Form</div>
        <div style={{ color: 'var(--insta-muted)', marginBottom: 12 }}>
          Are you sure you want to delete the form "{formToDelete?.title}"? This action cannot be undone.
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="insta-button btn-outline-primary" onClick={() => setDeleteDialogOpen(false)}>Cancel</button>
          <button className="insta-button btn-solid-danger" onClick={() => handleDeleteForm(formToDelete._id)}>Delete</button>
        </div>
      </UiModal>
    </div>
  );
}
;

export default HomePage;
