import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  Container,
  LinearProgress,
  
} from '@mui/material';
import axios from 'axios';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Inline field errors are shown per-question; no global snackbars/toasts

const UserForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract category from pathname (e.g., /Health -> Health)
  const category = location.pathname.substring(1); // Remove leading slash
  
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const questionRefs = useRef({});

  useEffect(() => {
    fetchQuestions();
  }, [category]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Validate category
      const validCategories = ['Health', 'Travel', 'Occupation', 'Avocation'];
      if (!validCategories.includes(category)) {
        setError(`Invalid category: ${category}. Please use Health, Travel, Occupation, or Avocation.`);
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`http://localhost:5000/api/user/questions/${category}`);
      setQuestions(response.data.questions);
      
      if (response.data.questions.length === 0) {
        setError(`No questions found for ${category} category. Please create some questions in the admin panel first.`);
      }
    } catch (err) {
      setError('Failed to load questions. Please try again.');
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  // No snackbar/toast; errors render under each field

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    setError('');
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });
    }
  };

  const handleFieldBlur = (question) => {
    const value = formData[question.questionId];
    const errorMsg = validateQuestion(question, value);
    setFieldErrors(prev => ({
      ...prev,
      [question.questionId]: errorMsg || undefined
    }));
  };

  const validateQuestion = (question, value) => {
    // Check if question is required
    const isRequired = question.validator_values?.required || false;
    
    // Handle empty values for different field types
    const isEmpty = !value || 
                    value === '' || 
                    (Array.isArray(value) && value.length === 0);
    
    if (isRequired && isEmpty) {
      return question.validators?.required?.message || `${question.question} is required`;
    }

    // Skip other validations if value is empty and not required
    if (isEmpty) {
      return null;
    }

    // Validate based on validators
    if (question.validators) {
      // Validate max value (for numbers)
      if (question.validators.max?.value !== '' && question.validators.max?.value !== null && question.validators.max?.value !== undefined) {
        const numValue = Number(value);
        const maxValue = Number(question.validators.max.value);
        if (!isNaN(numValue) && !isNaN(maxValue) && numValue > maxValue) {
          return question.validators.max.message && question.validators.max.message.trim() !== '' 
            ? question.validators.max.message 
            : `${question.question} must not exceed ${maxValue}`;
        }
      }

      // Validate min value (for numbers)
      if (question.validators.min?.value !== '' && question.validators.min?.value !== null && question.validators.min?.value !== undefined) {
        const numValue = Number(value);
        const minValue = Number(question.validators.min.value);
        if (!isNaN(numValue) && !isNaN(minValue) && numValue < minValue) {
          return question.validators.min.message && question.validators.min.message.trim() !== '' 
            ? question.validators.min.message 
            : `${question.question} must be at least ${minValue}`;
        }
      }

      // Validate max length
      if (question.validators.maxLength?.value && value.length > question.validators.maxLength.value) {
        return question.validators.maxLength.message && question.validators.maxLength.message.trim() !== '' 
          ? question.validators.maxLength.message 
          : `${question.question} exceeds maximum length of ${question.validators.maxLength.value} characters`;
      }

      // Validate min length
      if (question.validators.minLength?.value && value.length < question.validators.minLength.value) {
        return question.validators.minLength.message && question.validators.minLength.message.trim() !== '' 
          ? question.validators.minLength.message 
          : `${question.question} must be at least ${question.validators.minLength.value} characters`;
      }

      // Validate email
      if (question.validators.email && question.option_type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return question.error_messages?.email && question.error_messages.email.trim() !== '' 
            ? question.error_messages.email 
            : `${question.question} must be a valid email`;
        }
      }
    }
    
    return null;
  };

  const shouldShowSubQuestions = (question) => {
    // First check if there are any sub-questions defined
    if (!question.subQuestions || question.subQuestions.length === 0) {
      return false;
    }
    
    // Then check if children trigger value is set
    if (!question.children) {
      return false;
    }
    
    const parentValue = formData[question.questionId];
    
    // If no parent value selected, don't show sub-questions
    if (!parentValue) {
      return false;
    }
    
    // Support multiple trigger values separated by comma
    const triggerValues = question.children.split(',').map(val => val.trim().toLowerCase());
    return triggerValues.includes(parentValue.toString().toLowerCase());
  };

  const sortQuestionsByNumber = (questions) => {
    return [...questions].sort((a, b) => {
      // Extract numeric part from question numbers
      const getNumericValue = (qNum) => {
        if (!qNum) return 999999; // Put questions without numbers at the end
        const match = qNum.match(/^(\d+)/);
        return match ? parseInt(match[1]) : 999999;
      };
      
      const aNum = getNumericValue(a.questionNumber);
      const bNum = getNumericValue(b.questionNumber);
      
      if (aNum !== bNum) {
        return aNum - bNum;
      }
      
      // If numbers are equal, sort by order as fallback
      return (a.order || 0) - (b.order || 0);
    });
  };

  const getAllQuestionsToValidate = () => {
    const allQuestions = [];
    questions.forEach(question => {
      allQuestions.push(question);
      if (shouldShowSubQuestions(question)) {
        // Only include sub-questions that match the current trigger value
        question.subQuestions.forEach(subQ => {
          if (subQ.triggerValue) {
            const parentValue = formData[question.questionId];
            if (parentValue && parentValue.toString().toLowerCase() === subQ.triggerValue.toLowerCase()) {
              allQuestions.push(subQ);
            }
          } else {
            allQuestions.push(subQ);
          }
        });
      }
    });
    return allQuestions;
  };

  const validateAllQuestions = () => {
    const allQuestions = getAllQuestionsToValidate();
    const errors = {};
    let firstErrorQuestionId = null;
    
    for (const question of allQuestions) {
      const value = formData[question.questionId];
      const errorMsg = validateQuestion(question, value);
      if (errorMsg) {
        errors[question.questionId] = errorMsg;
        if (!firstErrorQuestionId) {
          firstErrorQuestionId = question.questionId;
        }
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError(`Please fill in all required fields`);
      
      // Scroll to first error
      if (firstErrorQuestionId && questionRefs.current[firstErrorQuestionId]) {
        questionRefs.current[firstErrorQuestionId].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAllQuestions()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      
      await axios.post('http://localhost:5000/api/user/submit', {
        category,
        answers: formData
      });
      
      setSuccess(true);
      setFormData({});
      // Success UI is handled by success flag below
    } catch (err) {
      const errorMessage = 'Failed to submit form. Please try again.';
      setError(errorMessage);
      setFieldErrors(prev => ({ ...prev, submit: errorMessage }));
      console.error('Error submitting form:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question, showNumber = true) => {
    const value = formData[question.questionId] || '';
    const isRequired = question.validator_values?.required || false;
    const questionLabel = showNumber && question.questionNumber 
      ? `${question.questionNumber}. ${question.question}` 
      : question.question;

    switch (question.option_type) {
      case 'text':
      case 'email':
      case 'number':
        const inputProps = {};
        
        if (question.option_type === 'number') {
          if (question.validators?.max?.value !== '' && question.validators?.max?.value !== null) {
            inputProps.max = question.validators.max.value;
          }
          if (question.validators?.min?.value !== '' && question.validators?.min?.value !== null) {
            inputProps.min = question.validators.min.value;
          }
        }
        
        let helperText = '';
        if (question.option_type === 'number') {
          if (question.validators?.min?.value && question.validators?.max?.value) {
            helperText = `Enter a value between ${question.validators.min.value} and ${question.validators.max.value}`;
          } else if (question.validators?.min?.value) {
            helperText = `Minimum value: ${question.validators.min.value}`;
          } else if (question.validators?.max?.value) {
            helperText = `Maximum value: ${question.validators.max.value}`;
          }
        }
        
        return (
          <TextField
            fullWidth
            type={question.option_type}
            label={questionLabel}
            name={question.questionId}
            value={value}
            onChange={(e) => handleInputChange(question.questionId, e.target.value)}
            onBlur={() => handleFieldBlur(question)}
            required={isRequired}
            variant="outlined"
            margin="normal"
            inputProps={inputProps}
            helperText={fieldErrors[question.questionId] || helperText || undefined}
            error={!!fieldErrors[question.questionId]}
          />
        );

      case 'textarea':
        return (
          <TextField
            fullWidth
            multiline
            rows={4}
            label={questionLabel}
            name={question.questionId}
            value={value}
            onChange={(e) => handleInputChange(question.questionId, e.target.value)}
            onBlur={() => handleFieldBlur(question)}
            required={isRequired}
            variant="outlined"
            margin="normal"
          />
        );

      case 'select':
        return (
          <FormControl fullWidth margin="normal" required={isRequired} error={!!fieldErrors[question.questionId]}>
            <InputLabel>{questionLabel}</InputLabel>
            <Select
              value={value}
              onChange={(e) => handleInputChange(question.questionId, e.target.value)}
              label={questionLabel}
            >
              {question.options?.map((option, index) => (
                <MenuItem key={index} value={option.val}>
                  {option.val}
                </MenuItem>
              ))}
            </Select>
            {fieldErrors[question.questionId] && (
              <FormHelperText error>{fieldErrors[question.questionId]}</FormHelperText>
            )}
          </FormControl>
        );

      case 'radio':
        return (
          <FormControl component="fieldset" margin="normal" required={isRequired} error={!!fieldErrors[question.questionId]}>
            <FormLabel component="legend">{questionLabel}</FormLabel>
            <RadioGroup
              value={value}
              onChange={(e) => handleInputChange(question.questionId, e.target.value)}
              onBlur={() => handleFieldBlur(question)}
            >
              {question.options?.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option.val}
                  control={<Radio />}
                  label={option.val}
                />
              ))}
            </RadioGroup>
            {fieldErrors[question.questionId] && (
              <FormHelperText error>{fieldErrors[question.questionId]}</FormHelperText>
            )}
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControl component="fieldset" margin="normal" required={isRequired} error={!!fieldErrors[question.questionId]}>
            <FormLabel component="legend">{questionLabel}</FormLabel>
            <FormGroup>
              {question.options?.map((option, index) => (
                <FormControlLabel
                  key={index}
                  control={
                    <Checkbox
                      checked={value?.includes(option.val) || false}
                      onChange={(e) => {
                        const currentValues = value || [];
                        const newValues = e.target.checked
                          ? [...currentValues, option.val]
                          : currentValues.filter(v => v !== option.val);
                        handleInputChange(question.questionId, newValues);
                      }}
                    />
                  }
                  label={option.val}
                />
              ))}
            </FormGroup>
            {fieldErrors[question.questionId] && (
              <FormHelperText error>{fieldErrors[question.questionId]}</FormHelperText>
            )}
          </FormControl>
        );

      case 'date':
        return (
          <TextField
            fullWidth
            type="date"
            label={questionLabel}
            name={question.questionId}
            value={value}
            onChange={(e) => handleInputChange(question.questionId, e.target.value)}
            onBlur={() => handleFieldBlur(question)}
            required={isRequired}
            variant="outlined"
            margin="normal"
            InputLabelProps={{ shrink: true }}
            helperText={fieldErrors[question.questionId] || undefined}
            error={!!fieldErrors[question.questionId]}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 8, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading {category} Questions...
        </Typography>
      </Container>
    );
  }

  if (success) {
    return (
      <Container maxWidth="md" sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 80, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Thank You!
          </Typography>
          <Typography variant="h6" color="text.secondary" paragraph>
            Your {category} form has been submitted successfully.
          </Typography>
          <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => {
                setSuccess(false);
                setFormData({});
                fetchQuestions();
              }}
            >
              Submit Another Response
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/')}
            >
              Go to Home
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: { xs: 3, md: 5 } }}>
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Chip 
            label={category} 
            color="primary" 
            sx={{ fontSize: '1rem', fontWeight: 600, px: 2, py: 3, mb: 2 }}
          />
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {category} Information Form
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Please fill out all required fields marked with *
          </Typography>
        </Box>

        {/* Progress */}
        {questions.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Progress
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {Object.keys(formData).length} / {getAllQuestionsToValidate().length} answered
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(Object.keys(formData).length / getAllQuestionsToValidate().length) * 100} 
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {questions.length === 0 ? (
          <Alert severity="info">
            No questions available for {category} category. Please check back later.
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {sortQuestionsByNumber(questions).map((question, index) => (
                <React.Fragment key={index}>
                  <Box 
                    ref={el => questionRefs.current[question.questionId] = el}
                    sx={{ 
                      p: 3, 
                      border: fieldErrors[question.questionId] ? '2px solid #d32f2f' : '1px solid #e0e0e0', 
                      borderRadius: 2,
                      backgroundColor: fieldErrors[question.questionId] ? '#ffebee' : '#fafafa',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s ease'
                    }}>
                    <Box sx={{ 
                      '& .MuiTextField-root': { mb: 0 },
                      '& .MuiFormControl-root': { mb: 0 }
                    }}>
                      {renderQuestion(question)}
                    </Box>
                  </Box>
                  
                  {/* Render Sub-Questions */}
                  {shouldShowSubQuestions(question) && (
                    <Box sx={{ 
                      ml: { xs: 2, sm: 4 }, 
                      p: 3, 
                      border: '2px solid #1976d2', 
                      borderRadius: 2,
                      backgroundColor: '#e3f2fd',
                      boxShadow: '0 2px 4px rgba(25,118,210,0.2)'
                    }}>
                      <Typography variant="h6" color="primary" gutterBottom fontWeight="600" sx={{ mb: 3 }}>
                        📋 Additional Questions
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {question.subQuestions
                          .filter(subQ => {
                            // If triggerValue is set, only show if parent value matches
                            if (subQ.triggerValue) {
                              const parentValue = formData[question.questionId];
                              return parentValue && parentValue.toString().toLowerCase() === subQ.triggerValue.toLowerCase();
                            }
                            // If no triggerValue, show for any parent value that triggers sub-questions
                            return true;
                          })
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((subQuestion, subIndex) => (
                            <Box 
                              key={subIndex}
                              ref={el => questionRefs.current[subQuestion.questionId] = el}
                              sx={{ 
                                p: 2.5, 
                                border: fieldErrors[subQuestion.questionId] ? '2px solid #d32f2f' : '1px solid #90caf9', 
                                borderRadius: 2,
                                backgroundColor: fieldErrors[subQuestion.questionId] ? '#ffebee' : 'white',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <Box sx={{ 
                                '& .MuiTextField-root': { mb: 0 },
                                '& .MuiFormControl-root': { mb: 0 }
                              }}>
                                {renderQuestion(subQuestion)}
                              </Box>
                            </Box>
                          ))}
                      </Box>
                    </Box>
                  )}
                </React.Fragment>
              ))}
            </Box>

            <Box display="flex" justifyContent="center" marginTop={4}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                sx={{ 
                  minWidth: 200,
                  height: 48,
                  fontSize: '1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4
                  }
                }}
              >
                {submitting ? <CircularProgress size={24} /> : 'Submit Form'}
              </Button>
            </Box>
          </form>
        )}
      </Paper>

      {/* Toast removed: errors are shown inline below each question */}
    </Container>
  );
};

export default UserForm;
