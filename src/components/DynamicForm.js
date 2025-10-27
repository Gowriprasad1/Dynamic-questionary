import React, { useState, useEffect, useRef } from 'react';
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
} from '@mui/material';
// Date picker imports removed - using simple HTML date input instead
import { formsAPI, submissionsAPI } from '../services/api';
import '../ui/insta/_form.scss';
import { InputField, DateField, SelectField, CheckboxGroup, TextAreaField } from '../ui/insta/_form';

const DynamicForm = ({ formId, onSuccess }) => {
  const [form, setForm] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const questionRefs = useRef({});

  useEffect(() => {
    if (formId) {
      fetchForm();
    }
  }, [formId]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const response = await formsAPI.getById(formId);
      console.log('Fetched form data:', response.data);
      console.log('Questions with subQuestions:', response.data.questions?.map(q => ({
        id: q.questionId,
        children: q.children,
        subQuestions: q.subQuestions
      })));
      setForm(response.data);
    } catch (err) {
      setFieldErrors({ load: 'Failed to load form' });
      console.error('Error fetching form:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    // Clear error for this field when user starts typing
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
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

      // Validate pattern
      if (question.validators.pattern?.value) {
        let patternValue = question.validators.pattern.value;
        
        // Remove regex delimiters if present (e.g., /pattern/flags)
        if (patternValue.startsWith('/') && patternValue.lastIndexOf('/') > 0) {
          const lastSlashIndex = patternValue.lastIndexOf('/');
          const pattern = patternValue.substring(1, lastSlashIndex);
          const flags = patternValue.substring(lastSlashIndex + 1);
          patternValue = pattern + (flags ? `,${flags}` : '');
        }
        
        try {
          const regex = new RegExp(patternValue);
          if (!regex.test(value)) {
            return question.validators.pattern.message && question.validators.pattern.message.trim() !== '' 
              ? question.validators.pattern.message 
              : `${question.question} format is invalid`;
          }
        } catch (error) {
          console.error('Invalid regex pattern:', patternValue, error);
          return `Invalid pattern format for ${question.question}`;
        }
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

  const validateForm = () => {
    if (!form) return false;
    
    const errors = {};
    let firstErrorQuestionId = null;
    
    // Validate all main questions
    for (const question of form.questions) {
      const value = formData[question.questionId];
      const errorMsg = validateQuestion(question, value);
      
      if (errorMsg) {
        errors[question.questionId] = errorMsg;
        if (!firstErrorQuestionId) {
          firstErrorQuestionId = question.questionId;
        }
      }

      // Validate sub-questions if they should be shown
      if (shouldShowSubQuestions(question)) {
        for (const subQuestion of question.subQuestions) {
          // Only validate sub-questions that match the current trigger value
          if (subQuestion.triggerValue) {
            const parentValue = formData[question.questionId];
            if (parentValue && parentValue.toString().toLowerCase() !== subQuestion.triggerValue.toLowerCase()) {
              continue; // Skip validation for sub-questions that don't match current parent value
            }
          }
          
          const subValue = formData[subQuestion.questionId];
          const subErrorMsg = validateQuestion(subQuestion, subValue);
          
          if (subErrorMsg) {
            errors[subQuestion.questionId] = subErrorMsg;
            if (!firstErrorQuestionId) {
              firstErrorQuestionId = subQuestion.questionId;
            }
          }
        }
      }
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      
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
    
    // Clear previous field errors
    setFieldErrors({});
    
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      
      await submissionsAPI.submit({
        formId: formId,
        data: formData
      });
      
      setSuccess('Form submitted successfully!');
      setFormData({});
      setFieldErrors({});
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      // Handle server-side validation errors
      if (err.response?.data?.errors) {
        const serverErrors = {};
        err.response.data.errors.forEach(error => {
          serverErrors[error.field] = error.message;
        });
        setFieldErrors(serverErrors);
      } else {
        setFieldErrors({ submit: 'Failed to submit form. Please try again.' });
      }
    } finally {
      setSubmitting(false);
    }
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
    const shouldShow = triggerValues.includes(parentValue.toString().toLowerCase());
    
    console.log(`Checking sub-questions for ${question.questionId}:`, {
      parentValue,
      triggerValues,
      hasSubQuestions: question.subQuestions.length,
      shouldShow
    });
    
    return shouldShow;
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

  const renderQuestion = (question, showNumber = true) => {
    const value = formData[question.questionId] || '';
    const isRequired = question.validator_values?.required || false;
    const baseLabel = showNumber && question.questionNumber
      ? `${question.questionNumber}. ${question.question}`
      : question.question;

    // If admin provided listItems (array), render them as an ordered list after the main label
    const afterLabel = (question.listItems && question.listItems.length > 0) ? (
      <ol className="insta-numbered-list">
        {question.listItems.map((it, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: it }} />
        ))}
      </ol>
    ) : null;
    const labelText = baseLabel;

    switch (question.option_type) {
      case 'text':
      case 'email':
      case 'number':
        const inputProps = {
          maxLength: question.validators?.maxLength?.value || undefined,
          minLength: question.validators?.minLength?.value || undefined,
          pattern: question.validators?.pattern?.value || undefined
        };
        
        // Add min/max for number inputs
        if (question.option_type === 'number') {
          if (question.validators?.max?.value !== '' && question.validators?.max?.value !== null && question.validators?.max?.value !== undefined) {
            inputProps.max = question.validators.max.value;
          }
          if (question.validators?.min?.value !== '' && question.validators?.min?.value !== null && question.validators?.min?.value !== undefined) {
            inputProps.min = question.validators.min.value;
          }
        }
        
        // Build helper text
        let helperText = '';
        if (question.option_type === 'number') {
          if (question.validators?.min?.value && question.validators?.max?.value) {
            helperText = `Enter a value between ${question.validators.min.value} and ${question.validators.max.value}`;
          } else if (question.validators?.min?.value) {
            helperText = `Minimum value: ${question.validators.min.value}`;
          } else if (question.validators?.max?.value) {
            helperText = `Maximum value: ${question.validators.max.value}`;
          }
        } else if (question.validators?.maxLength?.value) {
          helperText = `Maximum ${question.validators.maxLength.value} characters`;
        }
        
        return (
          <InputField
            fullWidth
            type={question.option_type}
            label={labelText}
            afterLabel={afterLabel}
            name={question.questionId}
            value={value}
            onChange={(v) => handleInputChange(question.questionId, v)}
            required={isRequired}
            placeholder={question.placeholder || ''}
            min={inputProps.min}
            max={inputProps.max}
            error={fieldErrors[question.questionId]}
          />
        );

      case 'textarea':
        return (
          <TextAreaField
            label={labelText}
            afterLabel={afterLabel}
            value={value}
            onChange={(v) => handleInputChange(question.questionId, v)}
            rows={4}
            error={fieldErrors[question.questionId]}
            placeholder={question.placeholder || ''}
          />
        );

      case 'select':
        return (
          <SelectField
            label={labelText}
            afterLabel={afterLabel}
            value={value}
            onChange={(v) => handleInputChange(question.questionId, v)}
            options={question.options || []}
            error={fieldErrors[question.questionId]}
            name={question.questionId}
          />
        );

      case 'radio':
        return (
          <FormControl component="fieldset" margin="normal" required={isRequired} error={!!fieldErrors[question.questionId]}>
            <FormLabel component="legend">{labelText}</FormLabel>
            {afterLabel}
            <div className="insta-tabs" role="tablist" aria-label={typeof labelText === 'string' ? labelText : question.questionId}>
              {question.options?.map((option, index) => (
                <button
                  type="button"
                  key={index}
                  className={`insta-tab ${value === option.val ? 'active' : ''}`}
                  onClick={() => handleInputChange(question.questionId, option.val)}
                >
                  {option.val}
                </button>
              ))}
            </div>
            {fieldErrors[question.questionId] && (
              <FormHelperText error>{fieldErrors[question.questionId]}</FormHelperText>
            )}
          </FormControl>
        );

      case 'checkbox':
        return (
          <CheckboxGroup
            label={labelText}
            afterLabel={afterLabel}
            value={Array.isArray(value) ? value : []}
            onChange={(v) => handleInputChange(question.questionId, v)}
            options={question.options || []}
            error={fieldErrors[question.questionId]}
            name={question.questionId}
          />
        );

      case 'date':
        return (
          <DateField
            value={value ? new Date(value) : null}
            onChange={(v) => handleInputChange(question.questionId, v)}
          />
        );

      case 'file':
        return (
          <InputField
            fullWidth
            type="file"
            label={labelText}
            afterLabel={afterLabel}
            name={question.questionId}
            onChange={(v, e) => handleInputChange(question.questionId, e?.target?.files?.[0] ?? v)}
            required={isRequired}
            error={fieldErrors[question.questionId]}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!form) {
    return (
      <Alert severity="error">
        Form not found
      </Alert>
    );
  }

  return (
    <Box maxWidth="900px" margin="0 auto" padding={3}>
      <Paper elevation={3} sx={{ padding: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 2, fontWeight: 600 }}>
          {form.title}
        </Typography>
        
        {form.description && (
          <Typography variant="body1" color="text.secondary" paragraph align="center" sx={{ mb: 4 }}>
            {form.description}
          </Typography>
        )}

        {success && (
          <Alert severity="success" sx={{ marginBottom: 3 }}>
            {success}
          </Alert>
        )}

        {/* Removed global/stacked error to avoid overlapping; errors render inline per field */}

        <form onSubmit={handleSubmit} noValidate>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {sortQuestionsByNumber(form.questions)
              .map((question, index) => (
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
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Chip 
                        label={question.questionType} 
                        color="primary" 
                        size="small" 
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>
                    <Box sx={{ 
                      '& .MuiTextField-root': { 
                        mb: 0 
                      },
                      '& .MuiFormControl-root': {
                        mb: 0
                      }
                    }}>
                      {renderQuestion(question)}
                    </Box>
                  </Box>
                  
                  {/* Render Sub-Questions if condition is met */}
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
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                <Chip 
                                  label={subQuestion.questionType} 
                                  color="primary" 
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontWeight: 500 }}
                                />
                              </Box>
                              <Box sx={{ 
                                '& .MuiTextField-root': { 
                                  mb: 0 
                                },
                                '& .MuiFormControl-root': {
                                  mb: 0
                                }
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
      </Paper>
    </Box>
  );
};

export default DynamicForm;
