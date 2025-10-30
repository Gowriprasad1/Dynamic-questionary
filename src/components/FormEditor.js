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
    } else {
      // Editing a parent question
      setEditingQuestionIndex(parentIndex);
      setEditingSubQuestion(null);
    }
    setShowAddQuestion(false);
  };

  const handleDeleteQuestion = (parentIndex, subIndex = null) => {
    setQuestionToDelete({ parentIndex, subIndex });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (questionToDelete.subIndex !== null) {
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
    
    if (editingSubQuestion !== null) {
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
    setShowAddQuestion(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleCancelQuestionEdit = () => {
    setEditingQuestionIndex(null);
    setEditingSubQuestion(null);
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

  // Auto-renumber questions sequentially
  const autoRenumberQuestions = () => {
    // First sort questions by their current question number
    const sortedQuestions = sortQuestionsByNumber(questions);
    
    // Then renumber them sequentially based on sorted order
    const renumbered = sortedQuestions.map((q, index) => ({
      ...q,
      questionNumber: String(index + 1),
      subQuestions: q.subQuestions?.map((subQ, subIndex) => ({
        ...subQ,
        questionNumber: `${index + 1}${String.fromCharCode(97 + subIndex)}` // 1a, 1b, etc.
      })) || []
    }));
    setQuestions(renumbered);
    setSuccess('Questions renumbered successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const sortQuestionsByNumber = (questions) => {
    return [...questions].sort((a, b) => {
      // Extract numeric part and letter suffix from question numbers
      const parseQuestionNumber = (qNum) => {
        if (!qNum) return { num: 999999, letter: '' };
        const match = qNum.match(/^(\d+)([a-z]*)/);
        if (match) {
          return { num: parseInt(match[1]), letter: match[2] || '' };
        }
        return { num: 999999, letter: '' };
      };
      
      const aParsed = parseQuestionNumber(a.questionNumber);
      const bParsed = parseQuestionNumber(b.questionNumber);
      
      // First compare by number
      if (aParsed.num !== bParsed.num) {
        return aParsed.num - bParsed.num;
      }
      
      // If numbers are equal, compare by letter (a comes before b)
      if (aParsed.letter !== bParsed.letter) {
        return aParsed.letter.localeCompare(bParsed.letter);
      }
      
      // If both are equal, sort by order as fallback
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

    // Flatten questions with their sub-questions for display
    const flattenedQuestions = [];
    sortQuestionsByNumber(questions).forEach((question) => {
      const originalIndex = questions.findIndex(q => q.questionId === question.questionId);
      flattenedQuestions.push({ ...question, originalIndex, isSubQuestion: false });
      if (question.subQuestions && question.subQuestions.length > 0) {
        const sortedSubQuestions = sortQuestionsByNumber(question.subQuestions);
        sortedSubQuestions.forEach((subQ) => {
          const subIndex = question.subQuestions.findIndex(sq => sq.questionId === subQ.questionId);
          flattenedQuestions.push({ 
            ...subQ, 
            originalIndex, 
            subIndex,
            isSubQuestion: true, 
            parentQuestion: question 
          });
        });
      }
    });

    return (
      <div>
        {flattenedQuestions.map((item, displayIndex) => {
          const question = item; // unified reference
          const hasSubQuestions = !item.isSubQuestion && question.subQuestions && question.subQuestions.length > 0;

          return (
            <div
              key={`${question.questionId || displayIndex}-${item.isSubQuestion ? 'sub' : 'main'}`}
              className="insta-card"
              style={{
                marginBottom: 12,
                padding: 12,
                marginLeft: item.isSubQuestion ? 16 : 0,
                background: item.isSubQuestion ? '#f7f9ff' : '#fff',
                borderLeft: item.isSubQuestion ? '4px solid var(--insta-primary)' : 'none'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <span style={{ border: '1px solid var(--insta-primary)', color: 'var(--insta-primary)', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>
                      {question.questionNumber ? `Q${question.questionNumber}` : `Q${displayIndex + 1}`}
                    </span>
                    {item.isSubQuestion && (
                      <span style={{ border: '1px solid #888', color: '#555', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>Sub-Question</span>
                    )}
                    <span style={{ border: '1px solid var(--insta-primary)', color: 'var(--insta-primary)', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>{question.questionType}</span>
                    <span style={{ border: '1px solid #ccc', color: '#555', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>{question.option_type}</span>
                    {question.validator_values?.required && (
                      <span style={{ border: '1px solid var(--insta-red)', color: 'var(--insta-red)', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>Required</span>
                    )}
                  </div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    {question.questionNumber ? `${question.questionNumber}. ` : ''}{question.question}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>ID: {question.questionId}</div>
                  {item.isSubQuestion && (
                    <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>Triggered by: {item.parentQuestion?.children}</div>
                  )}
                  {hasSubQuestions && (
                    <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ border: '1px solid #6aa3ff', color: '#2764c7', borderRadius: 10, padding: '2px 8px', fontSize: 12 }}>
                        {question.subQuestions.length} sub-question{question.subQuestions.length !== 1 ? 's' : ''}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--insta-muted)' }}>(Triggered by: {question.children})</span>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    className="insta-button"
                    style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }}
                    onClick={() => handleEditQuestion(
                      item.originalIndex, 
                      item.isSubQuestion ? item.subIndex : null
                    )}
                    title={item.isSubQuestion ? 'Edit sub-question' : 'Edit question'}
                  >
                    Edit
                  </button>
                  <button
                    className="insta-button"
                    style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }}
                    onClick={() => handleDeleteQuestion(
                      item.originalIndex,
                      item.isSubQuestion ? item.subIndex : null
                    )}
                    title={item.isSubQuestion ? 'Delete sub-question' : 'Delete question'}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // If editing a question or adding a new one, show the FormBuilder
  if (editingQuestionIndex !== null || editingSubQuestion !== null || showAddQuestion) {
    let questionToEdit = null;
    
    if (editingSubQuestion !== null) {
      // Editing a sub-question
      questionToEdit = questions[editingSubQuestion.parentIndex].subQuestions[editingSubQuestion.subIndex];
    } else if (editingQuestionIndex !== null) {
      // Editing a parent question
      questionToEdit = questions[editingQuestionIndex];
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
