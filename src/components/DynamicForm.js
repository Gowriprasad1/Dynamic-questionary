import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  const fetchForm = useCallback(async () => {
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
  }, [formId]);

  useEffect(() => {
    if (formId) {
      fetchForm();
    }
  }, [formId, fetchForm]);

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
          <div className="ui-input-wrapper">
            {typeof labelText === 'string' ? (
              <label className="ui-input-label">{labelText}{isRequired ? ' *' : ''}</label>
            ) : (
              <div className="ui-input-label">{labelText}</div>
            )}
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
              <div className="ui-input-error">{fieldErrors[question.questionId]}</div>
            )}
          </div>
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <div className="insta-card" style={{ padding: 16 }}>Loading form...</div>
      </div>
    );
  }

  if (!form) {
    return (
      <div style={{ margin: 12, color: 'var(--insta-red)', background: '#ffeef0', padding: 12, borderRadius: 8 }}>
        Form not found
      </div>
    );
  }

  return (
    <div className="insta-page" style={{ paddingTop: 12 }}>
      <div className="insta-card" style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <div style={{ textAlign: 'center', fontWeight: 800, fontSize: 22, marginBottom: 8 }}>{form.title}</div>
        {form.description && (
          <div style={{ color: 'var(--insta-muted)', textAlign: 'center', marginBottom: 16 }}>{form.description}</div>
        )}

        {success && (
          <div style={{ marginBottom: 12, color: 'green', background: '#eaf9ea', padding: 12, borderRadius: 8 }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sortQuestionsByNumber(form.questions)
              .map((question, index) => (
                <React.Fragment key={index}>
                  <div 
                    ref={el => questionRefs.current[question.questionId] = el}
                    style={{ 
                      padding: 16, 
                      border: fieldErrors[question.questionId] ? '2px solid #d32f2f' : '1px solid var(--insta-border)',
                      borderRadius: 8,
                      backgroundColor: fieldErrors[question.questionId] ? '#ffebee' : 'var(--insta-card-bg)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ color: 'var(--insta-primary)', fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{question.questionType}</div>
                    <div>
                      {renderQuestion(question)}
                    </div>
                  </div>
                  
                  {shouldShowSubQuestions(question) && (
                    <div style={{ 
                      marginLeft: 16, 
                      padding: 16, 
                      border: '1px solid var(--insta-primary)', 
                      borderRadius: 8,
                      backgroundColor: '#eaf4ff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      <div style={{ fontWeight: 700, color: 'var(--insta-primary)', marginBottom: 8 }}>Additional Questions</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {question.subQuestions
                          .filter(subQ => {
                            if (subQ.triggerValue) {
                              const parentValue = formData[question.questionId];
                              return parentValue && parentValue.toString().toLowerCase() === subQ.triggerValue.toLowerCase();
                            }
                            return true;
                          })
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((subQuestion, subIndex) => (
                            <div 
                              key={subIndex}
                              ref={el => questionRefs.current[subQuestion.questionId] = el}
                              style={{ 
                                padding: 12, 
                                border: fieldErrors[subQuestion.questionId] ? '2px solid #d32f2f' : '1px solid #90caf9', 
                                borderRadius: 8,
                                backgroundColor: fieldErrors[subQuestion.questionId] ? '#ffebee' : '#fff',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <div style={{ color: 'var(--insta-primary)', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{subQuestion.questionType}</div>
                              <div>
                                {renderQuestion(subQuestion)}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <button
              type="submit"
              className="insta-button"
              disabled={submitting}
              style={{ minWidth: 200, height: 48 }}
            >
              {submitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DynamicForm;
