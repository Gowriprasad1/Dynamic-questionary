import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../ui/insta/_form.scss';
import BasicDetailsIcon from '../assets/icons/BasicDetailsIcon.svg';
import { InputField, DateField, SelectField, CheckboxGroup, TextAreaField } from '../ui/insta/_form';
import { userAPI } from '../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { setQuestions as setQuestionsAction, setAnswer, setAllAnswers, setCategory } from '../store/actions';
 
 

// Inline field errors are shown per-question; no global snackbars/toasts

const UserForm = ({ category: categoryProp, appNumber: appNumberProp, mobile: mobileProp }) => {
  const params = useParams();
  const category = categoryProp || params.category;
  const navigate = useNavigate();
  
  const [questions, setQuestions] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const questionRefs = useRef({});
  const formRef = useRef(null);
  const dispatch = useDispatch();
  const fetchQuestions = React.useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching questions for category:', category);
      // Fetch questions for the category - via centralized services
      const response = await userAPI.getQuestions(category);
      console.log('API Response:', response.data);
      console.log('Questions received:', response.data.questions.length);
      setQuestions(response.data.questions);
  // also store questions in redux for global access
  try { dispatch(setQuestionsAction(response.data.questions)); dispatch(setCategory(category)); } catch(e){}
      if (response.data.questions.length === 0) {
        setError(`No questions found for ${category} category. Please create some questions in the admin panel first.`);
      }
    } catch (err) {
      setError('Failed to load questions. Please try again.');
      console.error('Error fetching questions:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  }, [category, dispatch]);

  const reduxAnswers = useSelector(state => state.answers || {});
  const reduxUser = useSelector(state => state.user || null);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Initialize form data from Redux answers when available
  useEffect(() => {
    if (reduxAnswers && Object.keys(reduxAnswers).length > 0) {
      setFormData(reduxAnswers);
    }
  }, [reduxAnswers, category]);

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
    // persist to redux
    try { dispatch(setAnswer(fieldName, value)); } catch (e) {}
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

  // Save draft to Redux and navigate to review page
    // Build a review-friendly answers object mapping question text -> answer
    const answersForReview = {};
    questions.forEach(q => {
      const val = formData[q.questionId];
      if (val !== undefined) {
        answersForReview[q.question] = val;
      }
      // include sub-questions if visible
      if (q.subQuestions && q.subQuestions.length > 0) {
        q.subQuestions.forEach(sq => {
          const sval = formData[sq.questionId];
          if (sval !== undefined) answersForReview[sq.question] = sval;
        });
      }
    });

    const draft = {
      category,
      answers: answersForReview,
      rawAnswers: formData,
      appNumber: appNumberProp || null,
      mobile: mobileProp || null,
      savedAt: new Date().toISOString()
    };
    try {
      // store raw answers in redux and navigate to review
      dispatch(setAllAnswers(draft.rawAnswers || draft.answers));
      navigate('/review');
    } catch (err) {
      console.error('Failed to prepare review', err);
      setError('Failed to prepare review. Please try again.');
    }
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
        const inputProps = {};
        
        if (question.option_type === 'number') {
          if (question.validators?.max?.value !== '' && question.validators?.max?.value !== null) {
            inputProps.max = question.validators.max.value;
          }
          if (question.validators?.min?.value !== '' && question.validators?.min?.value !== null) {
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
        onBlur={() => handleFieldBlur(question)}
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
            {labelText && (
              typeof labelText === 'string' ? (
                <label className="ui-input-label">{labelText}{isRequired ? ' *' : ''}</label>
              ) : (
                <div className="ui-input-label">{labelText}</div>
              )
            )}
            {afterLabel}
            <div className="insta-tabs" role="tablist" aria-label={typeof labelText === 'string' ? labelText : question.questionId}>
              {question.options?.map((option, index) => (
                <button
                  type="button"
                  key={index}
                  className={`insta-tab ${value === option.val ? 'active' : ''}`}
                  onClick={() => handleInputChange(question.questionId, option.val)}
                  onBlur={() => handleFieldBlur(question)}
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
            value={value || []}
            onChange={(v) => handleInputChange(question.questionId, v)}
            options={question.options || []}
            error={fieldErrors[question.questionId]}
            name={question.questionId}
          />
        );

      case 'date':
        return (
          <DateField
            value={value}
            onChange={(v) => handleInputChange(question.questionId, v)}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="insta-page" style={{ paddingTop: 24 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 16, textAlign: 'center' }}>
          <div className="insta-card" style={{ padding: 24 }}>
            <div style={{ fontWeight: 700, color: 'var(--insta-primary)' }}>Loading {category} Questions...</div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="insta-page" style={{ paddingTop: 24 }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: 16 }}>
          <div className="insta-card" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: 'var(--insta-primary)' }}>Thank You!</div>
            <div style={{ color: 'var(--insta-muted)', marginBottom: 16 }}>Your {category} form has been submitted successfully.</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                className="insta-button"
                onClick={() => {
                  setSuccess(false);
                  setFormData({});
                  fetchQuestions();
                }}
              >
                Submit Another Response
              </button>
              <button
                className="insta-proceed"
                onClick={() => navigate('/')}
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="insta-page no-mobile-footer-gap" style={{ paddingTop: 24 }}>
      <div className="insta-card" style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        {/* Header (Instainsure style) */}
        <div className="insta-page-header">
          <div className="insta-header-icon">
            <img src={BasicDetailsIcon} alt="Basic details" style={{ width: 60, height: 60 }} />
          </div>
          <div>
            <div style={{ color: 'var(--insta-muted)', fontWeight: 600 }}>Step 3/3</div>
            <div className="insta-header-title">Personal Declarations</div>
            <div className="insta-header-sub">Read the questions below and select your answers</div>
            {reduxUser && (
              <div style={{ marginTop: 8 }}>
                <div style={{ color: 'var(--insta-muted)', fontSize: 14 }}>Applicant: <strong>{reduxUser.Name || ''}</strong></div>
                <div style={{ color: 'var(--insta-muted)', fontSize: 14 }}>Application Number: <strong>{reduxUser.Appnumber || reduxUser.applicationNumber || ''}</strong></div>
              </div>
            )}
            <div className="insta-header-underline" />
          </div>
        </div>

        {/* Progress removed as per design request */}

        {error && (
          <div style={{ marginBottom: 12, color: 'var(--insta-red)', background: '#ffeef0', padding: 12, borderRadius: 8 }}>
            {error}
          </div>
        )}

        {questions.length === 0 ? (
          <div style={{ background: '#f8fafc', border: '1px solid var(--insta-border)', padding: 12, borderRadius: 8 }}>
            No questions available for {category} category. Please check back later.
          </div>
        ) : (
          <form ref={formRef} onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sortQuestionsByNumber(questions).map((question, index) => (
                <React.Fragment key={index}>
                  <div 
                    ref={el => questionRefs.current[question.questionId] = el}
                    style={{ 
                      padding: 16, 
                      border: fieldErrors[question.questionId] ? '2px solid #d32f2f' : 'none', 
                      borderBottom: fieldErrors[question.questionId] ? undefined : '1px solid var(--insta-border)',
                      borderRadius: 8,
                      backgroundColor: fieldErrors[question.questionId] ? '#ffebee' : 'var(--insta-card-bg)',
                      boxShadow: fieldErrors[question.questionId] ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.3s ease'
                    }}>
                    <div>
                      {renderQuestion(question)}
                    </div>
                  </div>
                  
                  {/* Render Sub-Questions */}
                  {shouldShowSubQuestions(question) && (
                    <div style={{ 
                      marginLeft: 16,
                      padding: 16, 
                      border: `1px solid var(--insta-border)`,
                      borderRadius: 8,
                      backgroundColor: 'var(--insta-card-bg)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                    }}>
                      {/* Sub-questions header removed to match Instainsure styling */}
                      <div className="insta-child" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                            <div 
                              key={subIndex}
                              ref={el => questionRefs.current[subQuestion.questionId] = el}
                              style={{ 
                                padding: 12, 
                                border: fieldErrors[subQuestion.questionId] ? '2px solid #d32f2f' : '1px solid #90caf9', 
                                borderRadius: 8,
                                backgroundColor: fieldErrors[subQuestion.questionId] ? '#ffebee' : 'white',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                transition: 'all 0.3s ease',
                                marginBottom: 8
                              }}
                            >
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

            {/* Desktop inline submit */}
            <div className="desktop-cta" style={{ justifyContent: 'center', marginTop: 16 }}>
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
        )}
      </div>

      {/* Toast removed: errors are shown inline below each question */}
      {/* Insta footer bar (mobile only via CSS) */}
      <div className="insta-footer">
        <button className="insta-proceed mobile-cta proceed-btn" onClick={(e) => handleSubmit(e)} disabled={submitting}>
          {submitting ? 'SUBMITTING...' : 'PROCEED'}
        </button>
      </div>
    </div>
  );
};

export default UserForm;
