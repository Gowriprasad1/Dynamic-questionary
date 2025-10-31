import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../ui/insta/_form.scss';
import BasicDetailsIcon from '../assets/icons/BasicDetailsIcon.svg';
import { InputField, DateField, SelectField, CheckboxGroup, TextAreaField } from '../ui/insta/_form';
import { userAPI } from '../services/api';
import { useDispatch, useSelector } from 'react-redux';
import { setQuestions as setQuestionsAction, setAllAnswers, setCategory } from '../store/actions';
 
 

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

  // Try to restore saved progress
  useEffect(() => {
    const tryRestore = async () => {
      try {
        const params = { category };
        if (appNumberProp) params.appNumber = appNumberProp;
        if (mobileProp) params.mobile = mobileProp;
        const resp = await userAPI.progress(params);
        if (resp?.data?.success && resp.data.progress?.answers) {
          const saved = resp.data.progress.answers;
          let restored = {};
          if (Array.isArray(saved)) {
            saved.forEach(it => { if (it && it.questionId !== undefined) restored[it.questionId] = it.answer; });
          } else if (typeof saved === 'object' && saved !== null) {
            restored = saved;
          }
          setFormData(restored);
          try { dispatch(setAllAnswers(restored)); } catch(e){}
          // If user already progressed to page 2, go to review directly
          const page = resp?.data?.progress?.pageNumber;
          if (page === 2) {
            navigate(`/${encodeURIComponent(category)}/review`);
            return;
          }
        }
      } catch(e) { /* ignore missing progress */ }
    };
    tryRestore();
  }, [category, appNumberProp, mobileProp, dispatch, navigate]);

  // Helpers for recursive rendering and trigger matching
  const normalize = (v) => (v === undefined || v === null) ? '' : String(v).trim().toLowerCase();
  const splitTokens = (s) => String(s || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

  const matchesTrigger = (parentValue, triggerValue, options = []) => {
    if (!triggerValue) return true;
    const tokens = Array.isArray(triggerValue) ? triggerValue.map(normalize) : splitTokens(triggerValue);
    // Build a set of comparable strings from parent's current answer: include both val and key
    const collectTokens = (val) => {
      const out = new Set();
      out.add(normalize(val));
      const opt = (options || []).find(o => String(o?.val) === String(val));
      if (opt && opt.key !== undefined) out.add(normalize(opt.key));
      return out;
    };
    if (Array.isArray(parentValue)) {
      const parentSets = parentValue.map(v => collectTokens(v));
      return tokens.some(t => parentSets.some(set => set.has(t)));
    }
    const set = collectTokens(parentValue);
    return tokens.some(t => set.has(t));
  };

  // Render a single node's field UI
  const renderQuestion = (question) => {
    const value = formData[question.questionId];
    const isRequired = question.validator_values?.required || false;
    const baseLabel = `${question.questionNumber ? question.questionNumber + '. ' : ''}${question.question || ''}`;
    const afterLabel = (question.listItems && question.listItems.length > 0) ? (
      <ol className="insta-numbered-list">
        {question.listItems.map((it, i) => (
          <li key={i} dangerouslySetInnerHTML={{ __html: it }} />
        ))}
      </ol>
    ) : null;

    switch (question.option_type) {
      case 'text':
      case 'email':
      case 'number': {
        const inputProps = {};
        if (question.option_type === 'number') {
          if (question.validators?.max?.value !== '' && question.validators?.max?.value !== null) inputProps.max = question.validators.max.value;
          if (question.validators?.min?.value !== '' && question.validators?.min?.value !== null) inputProps.min = question.validators.min.value;
        }
        return (
          <InputField
            fullWidth
            type={question.option_type}
            label={baseLabel}
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
      }
      case 'textarea':
        return (
          <TextAreaField
            label={baseLabel}
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
            label={baseLabel}
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
            {baseLabel && (
              typeof baseLabel === 'string' ? (
                <label className="ui-input-label">{baseLabel}{isRequired ? ' *' : ''}</label>
              ) : (
                <div className="ui-input-label">{baseLabel}</div>
              )
            )}
            {afterLabel}
            <div className="insta-tabs" role="tablist" aria-label={typeof baseLabel === 'string' ? baseLabel : question.questionId}>
              {question.options?.map((option, index) => (
                <button
                  type="button"
                  key={index}
                  className={`insta-tab ${value === option.val ? 'active' : ''}`}
                  onClick={() => handleInputChange(question.questionId, option.val)}
                  onBlur={() => handleFieldBlur(question)}
                >
                  {option.key}
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
            label={baseLabel}
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

  const renderNode = (node) => {
    const pv = formData[node.questionId];
    const hasChildren = Array.isArray(node.subQuestions) && node.subQuestions.length > 0;
    const childrenViaField = node.children ? matchesTrigger(pv, node.children, node.options || []) : false;
    const anyChildMatches = hasChildren ? (node.subQuestions || []).some(sq => matchesTrigger(pv, sq?.triggerValue, node.options || [])) : false;
    const parentAllowsChildren = childrenViaField || anyChildMatches;
    return (
      <div key={node.questionId || node.question} style={{ marginBottom: 8 }}>
        <div
          ref={el => { if (node.questionId) questionRefs.current[node.questionId] = el; }}
          style={{
            padding: 12,
            border: fieldErrors[node.questionId] ? '2px solid #d32f2f' : '1px solid var(--insta-border)',
            borderRadius: 8,
            backgroundColor: fieldErrors[node.questionId] ? '#ffebee' : 'var(--insta-card-bg)'
          }}
        >
          {renderQuestion(node)}
        </div>
        {(Array.isArray(node.subQuestions) ? node.subQuestions : [])
          .filter(sq => parentAllowsChildren && matchesTrigger(pv, sq.triggerValue, node.options || []))
          .map(sq => (
            <div key={(sq.questionId || sq.question) + '-wrap'} style={{ marginLeft: 16 }}>
              {renderNode(sq)}
            </div>
          ))}
      </div>
    );
  };

  // No snackbar/toast; errors render under each field

  const handleInputChange = (fieldName, value) => {
    let nextStateRef = null;
    setFormData(prev => {
      let next = { ...prev, [fieldName]: value };

      // Clear child answers no longer matching (value-only)
      const norm = (s) => (s === undefined || s === null) ? '' : String(s).trim().toLowerCase();
      const v = norm(value);
      const parent = (questions || []).find(q => q.questionId === fieldName);
      if (parent && Array.isArray(parent.subQuestions) && parent.subQuestions.length > 0) {
        parent.subQuestions.forEach((sq) => {
          if (!sq) return;
          if (sq.triggerValue) {
            const tv = norm(sq.triggerValue);
            if (tv !== v && Object.prototype.hasOwnProperty.call(next, sq.questionId)) {
              const { [sq.questionId]: _, ...rest } = next;
              next = rest;
              setFieldErrors(prevErr => {
                if (!prevErr || !prevErr[sq.questionId]) return prevErr;
                const ne = { ...prevErr };
                delete ne[sq.questionId];
                return ne;
              });
            }
          }
        });
      }

      nextStateRef = next;
      return next;
    });
    setError('');
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => { const next = { ...prev }; delete next[fieldName]; return next; });
    }
    // Capture final state and mirror to Redux answers for persistence
    if (nextStateRef) {
      try { dispatch(setAllAnswers(nextStateRef)); } catch(e) {}
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

  // const shouldShowSubQuestions = (question) => {
  //   if (!question.subQuestions || question.subQuestions.length === 0) return false;
  //   const parentValue = formData[question.questionId];
  //   if (parentValue === undefined || parentValue === null || parentValue === '') return false;
  //   const norm = (s) => (s === undefined || s === null) ? '' : String(s).trim().toLowerCase();
  //   const pv = norm(parentValue);
  //   const selected = (question.options || []).find(o => String(o?.val) === String(parentValue));
  //   const pk = norm(selected?.key);
  //   const anyChildMatches = (question.subQuestions || []).some((sq) => {
  //     if (!sq || !sq.triggerValue) return false;
  //     const tv = norm(sq.triggerValue);
  //     return tv === pv;
  //   });
  //   if (anyChildMatches) return true;
  //   const anyChildHasTrigger = (question.subQuestions || []).some((sq) => sq && sq.triggerValue);
  //   if (!anyChildHasTrigger && question.children) {
  //     const triggers = question.children.split(',').map(v => norm(v));
  //     if (triggers.includes(pv) || triggers.includes(pk)) return true;
  //   }
  //   return false;
  // };

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
    const all = [];
    const walk = (nodes, parentValue) => {
      (nodes || []).forEach((n) => {
        all.push(n);
        const pv = formData[n.questionId];
        const subs = Array.isArray(n.subQuestions) ? n.subQuestions : [];
        subs.forEach((sq) => {
          if (matchesTrigger(pv, sq.triggerValue)) {
            walk([sq], pv);
          }
        });
      });
    };
    walk(questions, null);
    return all;
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
      // store raw answers in redux
      dispatch(setAllAnswers(draft.rawAnswers || draft.answers));
      // Build answers array for save-progress (map all nodes recursively)
      const qMap = {};
      const walkMap = (nodes) => {
        (nodes || []).forEach(n => {
          if (n && n.questionId) qMap[n.questionId] = n.question;
          if (Array.isArray(n.subQuestions)) walkMap(n.subQuestions);
        });
      };
      walkMap(questions || []);
      const answersArray = Object.entries(draft.rawAnswers || draft.answers || {}).map(([questionId, answer]) => ({
        question: qMap[questionId] || questionId,
        answer,
        questionId,
      }));
      // save progress before navigating to review
      try { await userAPI.saveProgress({ category, appNumber: appNumberProp || null, mobile: mobileProp || null, answers: answersArray }); } catch(e) { /* non-blocking */ }
      navigate(`/${encodeURIComponent(category)}/review`);
    } catch (err) {
      console.error('Failed to prepare review', err);
      setError('Failed to prepare review. Please try again.');
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
                <div style={{ color: 'var(--insta-muted)', fontSize: 14 }}>Mobile: <strong>{reduxUser.Mobile || ''}</strong></div>
                <div style={{ color: 'var(--insta-muted)', fontSize: 14 }}>Gender: <strong>{reduxUser.Gender || ''}</strong></div>
                <div style={{ color: 'var(--insta-muted)', fontSize: 14 }}>DOB: <strong>{reduxUser.dob || ''}</strong></div>
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
              {sortQuestionsByNumber(questions).map((question) => renderNode(question))}
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
