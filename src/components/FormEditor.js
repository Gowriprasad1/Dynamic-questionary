import React, { useState } from 'react';
import '../ui/insta/_form.scss';
import { formsAPI } from '../services/api';
import FormBuilder from './FormBuilder';

const FormEditor = ({ formData, onFormUpdated, onCancel }) => {
  const [questions, setQuestions] = useState(formData?.questions || []);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [editingSubQuestion, setEditingSubQuestion] = useState(null); // { parentIndex, subIndex }
  const [editingNestedPath, setEditingNestedPath] = useState(null); // e.g., [parentIndex, subIndex, grandIndex, ...]
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // removed unused handleAddQuestion

  const handleEditQuestion = (parentIndex, subIndex = null) => {
    if (subIndex !== null) {
      // Editing a sub-question
      setEditingSubQuestion({ parentIndex, subIndex });
      setEditingQuestionIndex(null);
      setEditingNestedPath(null);
    } else {
      // Editing a parent question
      setEditingQuestionIndex(parentIndex);
      setEditingSubQuestion(null);
      setEditingNestedPath(null);
    }
    setShowAddQuestion(false);
  };

  // Edit for grandchildren or deeper
  const handleEditNested = (path) => {
    setEditingQuestionIndex(null);
    setEditingSubQuestion(null);
    setEditingNestedPath(path); // array of indices
    setShowAddQuestion(false);
  };

  const handleDeleteQuestion = (parentIndex, subIndex = null) => {
    setQuestionToDelete({ parentIndex, subIndex });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (Array.isArray(questionToDelete.path)) {
      // Delete arbitrary depth
      const updated = [...questions];
      const path = questionToDelete.path;
      if (path.length >= 2) {
        let parent = updated[path[0]];
        for (let i = 1; i < path.length - 1; i++) {
          parent = parent.subQuestions[path[i]];
        }
        const lastIndex = path[path.length - 1];
        parent.subQuestions = parent.subQuestions.filter((_, i) => i !== lastIndex);
        setQuestions(updated);
        setSuccess('Sub-question deleted successfully');
      }
    } else if (questionToDelete.subIndex !== null) {
      // Delete a sub-question
      const updatedQuestions = [...questions];
      const parentQuestion = updatedQuestions[questionToDelete.parentIndex];
      parentQuestion.subQuestions = parentQuestion.subQuestions.filter(
        (_, i) => i !== questionToDelete.subIndex
      );
      setQuestions(updatedQuestions);
      setSuccess('Sub-question deleted successfully');
    } else {
      // Delete a parent question
      const updatedQuestions = questions.filter((_, i) => i !== questionToDelete.parentIndex);
      setQuestions(updatedQuestions);
      setSuccess('Question deleted successfully');
    }
    setDeleteDialogOpen(false);
    setQuestionToDelete(null);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleQuestionSaved = (savedFormData) => {
    // Extract the questions from the saved form data
    const savedQuestions = savedFormData.questions || [];
    
    if (editingNestedPath !== null) {
      // update at arbitrary depth
      const updated = [...questions];
      const val = savedQuestions[0];
      const path = editingNestedPath;
      let parent = updated[path[0]];
      for (let i = 1; i < path.length - 1; i++) {
        parent = parent.subQuestions[path[i]];
      }
      parent.subQuestions[path[path.length - 1]] = val;
      setQuestions(updated);
      setSuccess('Sub-question updated successfully');
    } else if (editingSubQuestion !== null) {
      // Update existing sub-question
      const updatedQuestions = [...questions];
      const parentQuestion = updatedQuestions[editingSubQuestion.parentIndex];
      parentQuestion.subQuestions[editingSubQuestion.subIndex] = savedQuestions[0];
      setQuestions(updatedQuestions);
      setSuccess('Sub-question updated successfully');
    } else if (editingQuestionIndex !== null) {
      // Update existing parent question
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = savedQuestions[0];
      setQuestions(updatedQuestions);
      setSuccess('Question updated successfully');
    } else {
      // Add new questions - insert at correct position based on question number
      const updatedQuestions = [...questions, ...savedQuestions];
      // Sort by question number to maintain correct order
      const sortedQuestions = sortQuestionsByNumber(updatedQuestions);
      setQuestions(sortedQuestions);
      setSuccess('Question(s) added successfully');
    }
    
    setEditingQuestionIndex(null);
    setEditingSubQuestion(null);
    setEditingNestedPath(null);
    setShowAddQuestion(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCancelQuestionEdit = () => {
    setEditingQuestionIndex(null);
    setEditingSubQuestion(null);
    setEditingNestedPath(null);
    setShowAddQuestion(false);
  };

  const handleSaveForm = async () => {
    try {
      setLoading(true);
      setError('');

      const updatedFormData = {
        title: formData.title,
        description: formData.description,
        questions: questions.map((q, index) => ({
          ...q,
          order: index,
        })),
      };

      const response = await formsAPI.update(formData._id, updatedFormData);
      setSuccess('Form saved successfully!');
      
      if (onFormUpdated) {
        onFormUpdated(response.data);
      }
    } catch (err) {
      setError('Failed to save form');
      console.error('Error saving form:', err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-renumber questions sequentially (hierarchical: 1, 1.1, 1.1.1, ...)
  const autoRenumberQuestions = () => {
    const sorted = sortQuestionsByNumber(questions);
    const assign = (nodes, prefix = '') => (nodes || []).map((n, idx) => {
      const num = prefix ? `${prefix}.${idx + 1}` : String(idx + 1);
      return {
        ...n,
        questionNumber: num,
        subQuestions: assign(n.subQuestions || [], num)
      };
    });
    const renumbered = assign(sorted);
    setQuestions(renumbered);
    setSuccess('Questions renumbered successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const sortQuestionsByNumber = (arr) => {
    const parse = (q) => String(q || '')
      .split('.')
      .map((seg) => (seg === '' ? Number.MAX_SAFE_INTEGER : parseInt(seg, 10)))
      .map((n) => (isNaN(n) ? Number.MAX_SAFE_INTEGER : n));
    return [...arr].sort((a, b) => {
      const aa = parse(a.questionNumber);
      const bb = parse(b.questionNumber);
      const len = Math.max(aa.length, bb.length);
      for (let i = 0; i < len; i++) {
        const av = aa[i] ?? Number.MAX_SAFE_INTEGER;
        const bv = bb[i] ?? Number.MAX_SAFE_INTEGER;
        if (av !== bv) return av - bv;
      }
      return (a.order || 0) - (b.order || 0);
    });
  };

  const renderQuestionsList = () => {
    if (questions.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--insta-muted)' }}>No questions in this form</div>
          <div style={{ color: 'var(--insta-muted)' }}>Use the FormBuilder to add questions</div>
        </div>
      );
    }
    const renderNode = (node, depth, path) => {
      const isSub = depth > 0;
      const key = `${node.questionId || ''}-${depth}-${path.join('-')}`;
      const tools = (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="insta-button"
            style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }}
            onClick={() => {
              if (depth === 0) return handleEditQuestion(path[0], null);
              if (depth === 1) return handleEditQuestion(path[0], path[1]);
              return handleEditNested(path);
            }}
            title={depth >= 1 ? 'Edit sub-question' : 'Edit question'}
          >
            Edit
          </button>
          <button
            className="insta-button"
            style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }}
            onClick={() => {
              if (depth === 0) return handleDeleteQuestion(path[0], null);
              if (depth === 1) return handleDeleteQuestion(path[0], path[1]);
              // depth >= 2: delete by path
              setQuestionToDelete({ path });
              setDeleteDialogOpen(true);
            }}
            title={depth >= 1 ? 'Delete sub-question' : 'Delete question'}
          >
            Delete
          </button>
        </div>
      );
      return (
        <div
          key={key}
          className="insta-card"
          style={{
            marginBottom: 12,
            padding: 12,
            marginLeft: depth * 16,
            background: isSub ? '#f7f9ff' : '#fff',
            borderLeft: isSub ? '4px solid var(--insta-primary)' : 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ border: '1px solid var(--insta-primary)', color: 'var(--insta-primary)', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>
                  {node.questionNumber ? `Q${node.questionNumber}` : ''}
                </span>
                {isSub && (
                  <span style={{ border: '1px solid #888', color: '#555', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>Sub-Question</span>
                )}
                <span style={{ border: '1px solid var(--insta-primary)', color: 'var(--insta-primary)', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>{node.questionType}</span>
                <span style={{ border: '1px solid #ccc', color: '#555', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>{node.option_type}</span>
                {node.validator_values?.required && (
                  <span style={{ border: '1px solid var(--insta-red)', color: 'var(--insta-red)', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>Required</span>
                )}
              </div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                {node.questionNumber ? `${node.questionNumber}. ` : ''}{node.question}
              </div>
              <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>ID: {node.questionId}</div>
              {depth === 1 && (
                <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>Triggered by: {questions[path[0]]?.children}</div>
              )}
            </div>
            {tools}
          </div>
          {(node.subQuestions || []).length > 0 && (node.subQuestions).map((sq, i) => (
            <React.Fragment key={`${key}-c-${i}`}>
              {renderNode(sq, depth + 1, [...path, i])}
            </React.Fragment>
          ))}
        </div>
      );
    };
    return (
      <div>
        {sortQuestionsByNumber(questions).map((q, i) => renderNode(q, 0, [i]))}
      </div>
    );
  };

  // If editing a question or adding a new one, show the FormBuilder
  if (editingQuestionIndex !== null || editingSubQuestion !== null || editingNestedPath !== null || showAddQuestion) {
    let questionToEdit = null;
    
    if (editingSubQuestion !== null) {
      // Editing a sub-question
      questionToEdit = questions[editingSubQuestion.parentIndex].subQuestions[editingSubQuestion.subIndex];
    } else if (editingQuestionIndex !== null) {
      // Editing a parent question
      questionToEdit = questions[editingQuestionIndex];
    } else if (editingNestedPath !== null) {
      // walk by path: [p, s, g, ...]
      let node = questions[editingNestedPath[0]];
      for (let i = 1; i < editingNestedPath.length; i++) {
        node = node.subQuestions[editingNestedPath[i]];
      }
      questionToEdit = node;
    }
    
    // Create a temporary form with just this one question for editing
    const tempFormData = questionToEdit ? {
      _id: formData._id,
      title: formData.title,
      description: formData.description,
      questions: [questionToEdit],
    } : null;
    
    return (
      <div className="insta-page" style={{ paddingTop: 12 }}>
        <div className="insta-card" style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 18 }}>
              {editingSubQuestion !== null ? '✏️ Edit Sub-Question' : 
               editingQuestionIndex !== null ? '✏️ Edit Question' : '➕ Add New Question'}
            </div>
            <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} onClick={handleCancelQuestionEdit}>
              Back to List
            </button>
          </div>

          {error && (
            <div style={{ marginBottom: 12, color: 'var(--insta-red)', background: '#ffeef0', padding: 12, borderRadius: 8 }}>
              {error}
            </div>
          )}

          <FormBuilder
            editFormData={tempFormData}
            onFormCreated={handleQuestionSaved}
            disableAddQuestion={true}
          />
        </div>
      </div>
    );
  }

  // Main list view
  return (
    <div className="insta-page" style={{ paddingTop: 12 }}>
      <div className="insta-card" style={{ maxWidth: 1200, margin: '0 auto', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 22 }}>Edit Form: {formData.title}</div>
            <div style={{ color: 'var(--insta-muted)' }}>{formData.description}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} onClick={onCancel}>Cancel</button>
            <button className="insta-button" onClick={handleSaveForm} disabled={loading}>{loading ? 'Saving...' : 'Save Form'}</button>
          </div>
        </div>

        {error && (
          <div style={{ marginBottom: 12, color: 'var(--insta-red)', background: '#ffeef0', padding: 12, borderRadius: 8 }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ marginBottom: 12, color: 'green', background: '#eaf9ea', padding: 12, borderRadius: 8 }}>
            {success}
          </div>
        )}

        <div style={{ height: 1, background: 'var(--insta-border)', margin: '12px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700 }}>Questions ({questions.length})</div>
          <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} onClick={autoRenumberQuestions} disabled={questions.length === 0}>
            Auto-ReArrange Questions
          </button>
        </div>

        {renderQuestionsList()}
      </div>

      {deleteDialogOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="insta-card" style={{ width: '90%', maxWidth: 520, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Delete Question</div>
            <div style={{ color: 'var(--insta-muted)' }}>
              Are you sure you want to delete this question? This action cannot be undone.
            </div>
            {questionToDelete !== null && (
              <div style={{ marginTop: 12, padding: 10, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontWeight: 600 }}>
                  {questionToDelete.subIndex !== null
                    ? questions[questionToDelete.parentIndex]?.subQuestions[questionToDelete.subIndex]?.question
                    : questions[questionToDelete.parentIndex]?.question}
                </div>
                {questionToDelete.subIndex !== null && (
                  <div style={{ fontSize: 12, color: 'var(--insta-muted)', marginTop: 6 }}>
                    This is a sub-question. Only the sub-question will be deleted.
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
              <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} onClick={() => setDeleteDialogOpen(false)}>Cancel</button>
              <button className="insta-button" style={{ background: 'var(--insta-red)' }} onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormEditor;
