import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  Card,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as BackIcon,
} from '@mui/icons-material';
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

  const handleAddQuestion = () => {
    setShowAddQuestion(true);
    setEditingQuestionIndex(null);
  };

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
        <Box textAlign="center" padding={4}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No questions in this form
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Use the FormBuilder to add questions
          </Typography>
        </Box>
      );
    }

    // Flatten questions with their sub-questions for display
    const flattenedQuestions = [];
    sortQuestionsByNumber(questions).forEach((question) => {
      const originalIndex = questions.findIndex(q => q.questionId === question.questionId);
      flattenedQuestions.push({ ...question, originalIndex, isSubQuestion: false });
      
      // Add sorted sub-questions right after parent
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
      <List>
        {flattenedQuestions.map((item, displayIndex) => {
          const question = item.isSubQuestion ? item : item;
          const hasSubQuestions = !item.isSubQuestion && question.subQuestions && question.subQuestions.length > 0;
          
          return (
            <Card 
              key={`${question.questionId || displayIndex}-${item.isSubQuestion ? 'sub' : 'main'}`} 
              sx={{ 
                mb: 2, 
                p: 2,
                ml: item.isSubQuestion ? 4 : 0,
                bgcolor: item.isSubQuestion ? 'grey.50' : 'white',
                borderLeft: item.isSubQuestion ? '4px solid #1976d2' : 'none'
              }}
            >
              <ListItem
                sx={{
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  py: 1,
                }}
              >
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip 
                        label={question.questionNumber ? `Q${question.questionNumber}` : `Q${displayIndex + 1}`} 
                        size="small" 
                        color={item.isSubQuestion ? 'secondary' : 'primary'}
                      />
                      {item.isSubQuestion && (
                        <Chip label="Sub-Question" size="small" variant="outlined" color="info" />
                      )}
                      <Chip label={question.questionType} size="small" variant="outlined" />
                      <Chip label={question.option_type} size="small" />
                      {question.validator_values?.required && (
                        <Chip label="Required" size="small" color="error" />
                      )}
                    </Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {question.questionNumber ? `${question.questionNumber}. ` : ''}{question.question}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      ID: {question.questionId}
                    </Typography>
                    {item.isSubQuestion && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Triggered by: {item.parentQuestion?.children}
                      </Typography>
                    )}
                    {hasSubQuestions && (
                      <Box sx={{ mt: 1 }}>
                        <Chip 
                          label={`${question.subQuestions.length} sub-question${question.subQuestions.length !== 1 ? 's' : ''}`}
                          size="small" 
                          color="info"
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          (Triggered by: {question.children})
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={() => handleEditQuestion(
                        item.originalIndex, 
                        item.isSubQuestion ? item.subIndex : null
                      )}
                      color="primary"
                      size="small"
                      title={item.isSubQuestion ? "Edit sub-question" : "Edit question"}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteQuestion(
                        item.originalIndex,
                        item.isSubQuestion ? item.subIndex : null
                      )}
                      color="error"
                      size="small"
                      title={item.isSubQuestion ? "Delete sub-question" : "Delete question"}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>
              </ListItem>
            </Card>
          );
        })}
      </List>
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
      <Box maxWidth="1400px" margin="0 auto" padding={3}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={3}>
            <Typography variant="h5">
              {editingSubQuestion !== null ? '✏️ Edit Sub-Question' : 
               editingQuestionIndex !== null ? '✏️ Edit Question' : '➕ Add New Question'}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={handleCancelQuestionEdit}
            >
              Back to List
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ marginBottom: 3 }}>
              {error}
            </Alert>
          )}

          <FormBuilder
            editFormData={tempFormData}
            onFormCreated={handleQuestionSaved}
            disableAddQuestion={true}
          />
        </Paper>
      </Box>
    );
  }

  // Main list view
  return (
    <Box maxWidth="1400px" margin="0 auto" padding={3}>
      <Paper elevation={3} sx={{ padding: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={3}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Edit Form: {formData.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formData.description}
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveForm}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Form'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ marginBottom: 3 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ marginBottom: 3 }}>
            {success}
          </Alert>
        )}

        <Divider sx={{ my: 3 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center" marginBottom={3}>
          <Typography variant="h5">
            Questions ({questions.length})
          </Typography>
          <Button
            variant="outlined"
            color="secondary"
            onClick={autoRenumberQuestions}
            disabled={questions.length === 0}
          >
            Auto-ReArrange Questions
          </Button>
        </Box>

        {renderQuestionsList()}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Question</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this question? This action cannot be undone.
          </Typography>
          {questionToDelete !== null && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold">
                {questionToDelete.subIndex !== null
                  ? questions[questionToDelete.parentIndex]?.subQuestions[questionToDelete.subIndex]?.question
                  : questions[questionToDelete.parentIndex]?.question}
              </Typography>
              {questionToDelete.subIndex !== null && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  This is a sub-question. Only the sub-question will be deleted.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={confirmDelete} 
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

export default FormEditor;
