import React, { useState, useEffect } from 'react';
import '../ui/insta/_form.scss';
import { formsAPI, categoriesAPI } from '../services/api';

const FormBuilder = ({ onFormCreated, editFormData = null, disableAddQuestion = false }) => {
  const [formId] = useState(editFormData?._id || null);
  const [formTitle, setFormTitle] = useState(editFormData?.title || '');
  const [formDescription, setFormDescription] = useState(editFormData?.description || '');
  const [questions, setQuestions] = useState(editFormData?.questions || []);
  const [loading, setLoading] = useState(false);
  const [, setError] = useState('');
  const [, setSuccess] = useState('');
  const [categories, setCategories] = useState([]);
  const isEditMode = !!editFormData;

  const fieldTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'number', label: 'Number' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkboxes' },
    { value: 'date', label: 'Date Picker' },
    { value: 'file', label: 'File Upload' },
  ];

  const validatorTypes = [
    'required', 'max', 'min', 'maxLength', 'minLength', 
    'pattern', 'email', 'maxDate', 'minDate', 'maxPastDays', 'maxFutureDays'
  ];

  useEffect(() => {
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

  const createEmptyQuestion = (order = 0) => ({
    question: '',
    questionType: '',
    questionId: '',
    questionNumber: '',
    option_type: 'text',
    options: [],
    validator_values: {
      max: '',
      min: '',
      maxDate: '',
      minDate: '',
      pattern: '',
      maxLength: '',
      minLength: '',
      maxPastDays: '',
      maxFutureDays: '',
      required: false
    },
    error_messages: {
      max: '',
      min: '',
      maxDate: '',
      minDate: '',
      pattern: '',
      required: '',
      maxLength: '',
      minLength: '',
      maxPastDays: '',
      maxFutureDays: ''
    },
    validators: {},
    validator_options: [],
    children: '',
    triggerValue: '', // For sub-questions: which parent value triggers this sub-question
    subQuestions: [],
    // listItems allows admin to provide ordered list content (rendered as <ol> in frontend)
    listItems: [],
    parentQuestionId: '',
    order: order,
  });

  const addQuestion = () => {
    const newQuestion = createEmptyQuestion(questions.length);
    setQuestions([...questions, newQuestion]);
  };

  const addSubQuestion = (questionIndex) => {
    const question = questions[questionIndex];
    const newSubQuestion = createEmptyQuestion(question.subQuestions?.length || 0);
    const updatedSubQuestions = [...(question.subQuestions || []), newSubQuestion];
    updateQuestion(questionIndex, { subQuestions: updatedSubQuestions });
  };

  // Sub-question list item handlers
  const addSubQuestionListItem = (questionIndex, subQuestionIndex) => {
    const question = questions[questionIndex];
    const subQuestion = question.subQuestions[subQuestionIndex];
    const newList = [...(subQuestion.listItems || []), ''];
    updateSubQuestion(questionIndex, subQuestionIndex, { listItems: newList });
  };

  const updateSubQuestionListItem = (questionIndex, subQuestionIndex, itemIndex, value) => {
    const question = questions[questionIndex];
    const subQuestion = question.subQuestions[subQuestionIndex];
    const newList = [...(subQuestion.listItems || [])];
    newList[itemIndex] = value;
    updateSubQuestion(questionIndex, subQuestionIndex, { listItems: newList });
  };

  const removeSubQuestionListItem = (questionIndex, subQuestionIndex, itemIndex) => {
    const question = questions[questionIndex];
    const subQuestion = question.subQuestions[subQuestionIndex];
    const newList = (subQuestion.listItems || []).filter((_, i) => i !== itemIndex);
    updateSubQuestion(questionIndex, subQuestionIndex, { listItems: newList });
  };

  const updateSubQuestion = (questionIndex, subQuestionIndex, updates) => {
    const question = questions[questionIndex];
    const updatedSubQuestions = question.subQuestions.map((subQ, i) =>
      i === subQuestionIndex ? { ...subQ, ...updates } : subQ
    );
    updateQuestion(questionIndex, { subQuestions: updatedSubQuestions });
  };

  const removeSubQuestion = (questionIndex, subQuestionIndex) => {
    const question = questions[questionIndex];
    const updatedSubQuestions = question.subQuestions.filter((_, i) => i !== subQuestionIndex);
    updateQuestion(questionIndex, { subQuestions: updatedSubQuestions });
  };

  // Sub-question option handlers
  const addSubQuestionOption = (questionIndex, subQuestionIndex) => {
    const question = questions[questionIndex];
    const subQuestion = question.subQuestions[subQuestionIndex];
    const newOptions = [...(subQuestion.options || []), { key: '', val: '' }];
    updateSubQuestion(questionIndex, subQuestionIndex, { options: newOptions });
  };

  const updateSubQuestionOption = (questionIndex, subQuestionIndex, optionIndex, field, value) => {
    const question = questions[questionIndex];
    const subQuestion = question.subQuestions[subQuestionIndex];
    const newOptions = [...subQuestion.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
    updateSubQuestion(questionIndex, subQuestionIndex, { options: newOptions });
  };

  const removeSubQuestionOption = (questionIndex, subQuestionIndex, optionIndex) => {
    const question = questions[questionIndex];
    const subQuestion = question.subQuestions[subQuestionIndex];
    const newOptions = subQuestion.options.filter((_, i) => i !== optionIndex);
    updateSubQuestion(questionIndex, subQuestionIndex, { options: newOptions });
  };

  // (Removed unused sub-question validator handlers)

  const updateQuestion = (index, updates) => {
    const updatedQuestions = questions.map((question, i) =>
      i === index ? { ...question, ...updates } : question
    );
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex) => {
    const question = questions[questionIndex];
    const newOptions = [...(question.options || []), { key: '', val: '' }];
    updateQuestion(questionIndex, { options: newOptions });
  };

  // List item handlers (for questions that contain numbered list content)
  const addListItem = (questionIndex) => {
    const question = questions[questionIndex];
    const newList = [...(question.listItems || []), ''];
    updateQuestion(questionIndex, { listItems: newList });
  };

  const updateListItem = (questionIndex, itemIndex, value) => {
    const question = questions[questionIndex];
    const newList = [...(question.listItems || [])];
    newList[itemIndex] = value;
    updateQuestion(questionIndex, { listItems: newList });
  };

  const removeListItem = (questionIndex, itemIndex) => {
    const question = questions[questionIndex];
    const newList = (question.listItems || []).filter((_, i) => i !== itemIndex);
    updateQuestion(questionIndex, { listItems: newList });
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    const question = questions[questionIndex];
    const newOptions = [...question.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
    updateQuestion(questionIndex, { options: newOptions });
  };

  const removeOption = (questionIndex, optionIndex) => {
    const question = questions[questionIndex];
    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    updateQuestion(questionIndex, { options: newOptions });
  };

  // (Removed unused generateQuestionId)

  const handleQuestionChange = (index, question) => {
    updateQuestion(index, { question });
  };

  const updateValidatorValue = (questionIndex, validatorType, value) => {
    const question = questions[questionIndex];
    const newValidatorValues = { ...question.validator_values, [validatorType]: value };
    updateQuestion(questionIndex, { validator_values: newValidatorValues });
  };

  const updateErrorMessage = (questionIndex, validatorType, value) => {
    const question = questions[questionIndex];
    const newErrorMessages = { ...question.error_messages, [validatorType]: value };
    updateQuestion(questionIndex, { error_messages: newErrorMessages });
  };


  const toggleValidatorOption = (questionIndex, validatorType) => {
    const question = questions[questionIndex];
    const validatorOptions = [...question.validator_options];
    const index = validatorOptions.indexOf(validatorType);
    
    if (index > -1) {
      validatorOptions.splice(index, 1);
    } else {
      validatorOptions.push(validatorType);
    }
    
    updateQuestion(questionIndex, { validator_options: validatorOptions });
  };

  const validateForm = () => {
    if (!formTitle.trim()) {
      setError('Form title is required');
      return false;
    }

    if (questions.length === 0) {
      setError('At least one question is required');
      return false;
    }

    for (const question of questions) {
      if (!question.question.trim()) {
        setError('All questions must have a question text');
        return false;
      }
      if (!question.questionId.trim()) {
        setError('All questions must have a question ID');
        return false;
      }
      if (!question.questionType.trim()) {
        setError('All questions must have a question type');
        return false;
      }
      if (['select', 'radio', 'checkbox'].includes(question.option_type) && (!question.options || question.options.length === 0)) {
        setError(`${question.question} must have at least one option`);
        return false;
      }
    }

    return true;
  };

  const generateValidatorsObject = (question) => {
    const validators = {};
    
    // Generate validators object from validator_values and error_messages
    validatorTypes.forEach(validatorType => {
      if (question.validator_options.includes(validatorType)) {
        const value = question.validator_values[validatorType];
        const message = question.error_messages[validatorType];
        
        // For validators that need value and message structure
        if (['max', 'min', 'pattern', 'required', 'maxLength', 'minLength'].includes(validatorType)) {
          validators[validatorType] = {
            value: value || '',
            message: message || ''
          };
        } else {
          // For simple string validators
          validators[validatorType] = value || '';
        }
      } else {
        // Set empty values for non-selected validators
        if (['max', 'min', 'pattern', 'required', 'maxLength', 'minLength'].includes(validatorType)) {
          validators[validatorType] = { value: '', message: '' };
        } else {
          validators[validatorType] = '';
        }
      }
    });
    
    return validators;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
  setLoading(true);
  setError('');
      
      const formData = {
        title: formTitle,
        description: formDescription,
        questions: questions.map((question, index) => ({
          ...question,
          validators: generateValidatorsObject(question),
          subQuestions: question.subQuestions?.map((subQ, subIndex) => ({
            ...subQ,
            validators: generateValidatorsObject(subQ),
            order: subIndex,
          })) || [],
          order: index,
        })),
      };

      

      let response;
      if (isEditMode && formId) {
        response = await formsAPI.update(formId, formData);
        setSuccess('Form updated successfully!');
      } else {
        response = await formsAPI.create(formData);
        setSuccess('Form created successfully!');
      }
      
      
      
      if (!isEditMode) {
        setFormTitle('');
        setFormDescription('');
        setQuestions([]);
      }
      
      if (onFormCreated) {
        onFormCreated(response.data);
      }
    } catch (err) {
      setError(isEditMode ? 'Failed to update form' : 'Failed to create form');
      console.error('Error saving form:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionOptions = (question, questionIndex) => {
    if (!['select', 'radio', 'checkbox'].includes(question.option_type)) {
      return null;
    }

    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Options:</div>
        {question.options?.map((option, optionIndex) => (
          <div key={optionIndex} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input className="ui-input" placeholder={`Option key ${optionIndex + 1}`} value={option.key} onChange={(e) => updateOption(questionIndex, optionIndex, 'key', e.target.value)} style={{ flex: 1 }} />
            <input className="ui-input" placeholder={`Option value ${optionIndex + 1}`} value={option.val} onChange={(e) => updateOption(questionIndex, optionIndex, 'val', e.target.value)} style={{ flex: 1 }} />
            <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }} onClick={() => removeOption(questionIndex, optionIndex)}>Delete</button>
          </div>
        ))}
        <button className="insta-button" onClick={() => addOption(questionIndex)}>Add Option</button>
      </div>
    );
  };

  // (Removed unused renderSubQuestionOptions)

  const renderValidatorSection = (question, questionIndex) => {
    const isSelected = (vt) => question.validator_options.includes(vt);
    const numTypes = ['max', 'min', 'maxLength', 'minLength'];
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Validation Rules</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {validatorTypes.map((validatorType) => (
            <button
              key={validatorType}
              type="button"
              className="insta-button"
              style={{ background: isSelected(validatorType) ? 'var(--insta-primary)' : '#fff', color: isSelected(validatorType) ? '#fff' : 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }}
              onClick={() => toggleValidatorOption(questionIndex, validatorType)}
            >
              {validatorType}
            </button>
          ))}
        </div>
        {validatorTypes.map((validatorType) => (
          <div key={validatorType} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {validatorType === 'required' ? (
                <select
                  className="ui-input"
                  style={{ flex: 1 }}
                  disabled={!isSelected(validatorType)}
                  value={question.validator_values?.[validatorType] === true || question.validator_values?.[validatorType] === 'true' ? 'true' : 'false'}
                  onChange={(e) => updateValidatorValue(questionIndex, validatorType, e.target.value === 'true')}
                >
                  <option value="true">true</option>
                  <option value="false">false</option>
                </select>
              ) : (
                <input
                  className="ui-input"
                  style={{ flex: 1 }}
                  placeholder={`${validatorType} value`}
                  disabled={!isSelected(validatorType)}
                  value={question.validator_values?.[validatorType] || ''}
                  onChange={(e) => updateValidatorValue(questionIndex, validatorType, e.target.value)}
                  type={numTypes.includes(validatorType) ? 'number' : 'text'}
                />
              )}
              <input
                className="ui-input"
                style={{ flex: 1 }}
                placeholder={`${validatorType} error message`}
                disabled={!isSelected(validatorType)}
                value={question.error_messages?.[validatorType] || ''}
                onChange={(e) => updateErrorMessage(questionIndex, validatorType, e.target.value)}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="insta-container">
      <div className="insta-card" style={{ padding: 12 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>Form Title</div>
          </div>
          <input className="ui-input" placeholder="Form Title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} required />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div style={{ fontWeight: 700 }}>Form Description</div>
          </div>
          <textarea className="ui-input" rows={4} placeholder="Form Description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />

          <div style={{ height: 1, background: 'var(--insta-border)' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 700 }}>Form Questions</div>
            {!disableAddQuestion && (
              <button type="button" className="insta-button" onClick={addQuestion}>Add Question</button>
            )}
          </div>

          {questions.map((question, index) => (
            <div key={index} className="insta-card" style={{ padding: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontWeight: 700 }}>Question {index + 1}</div>
                <div style={{ flex: 1 }} />
                <button type="button" className="insta-button" style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }} onClick={() => removeQuestion(index)}>Delete</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea className="ui-input" rows={2} placeholder="Question Text" value={question.question} onChange={(e) => handleQuestionChange(index, e.target.value)} required />

                <input className="ui-input" placeholder="Question Number (e.g., 1, 2, 3)" value={question.questionNumber} onChange={(e) => updateQuestion(index, { questionNumber: e.target.value })} />

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 260px' }}>
                    <label className="ui-input-label" style={{ display: 'block', marginBottom: 4 }}>Category/Question Type</label>
                    <select className="ui-input" value={question.questionType} onChange={(e) => updateQuestion(index, { questionType: e.target.value })} required>
                      {categories.map((cat) => (
                        <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <input className="ui-input" placeholder="Question ID (unique identifier)" value={question.questionId} onChange={(e) => updateQuestion(index, { questionId: e.target.value })} required style={{ flex: '1 1 260px' }} />
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 260px' }}>
                    <label className="ui-input-label" style={{ display: 'block', marginBottom: 4 }}>Option Type</label>
                    <select className="ui-input" value={question.option_type} onChange={(e) => updateQuestion(index, { option_type: e.target.value })}>
                      {fieldTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <input className="ui-input" placeholder="Children (Trigger for sub-questions)" value={question.children} onChange={(e) => updateQuestion(index, { children: e.target.value })} style={{ flex: '1 1 260px' }} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>Comma-separated answers that can trigger sub-questions (e.g., 'yes,no')</div>

                {renderQuestionOptions(question, index)}
                {renderValidatorSection(question, index)}

                {/* List Items for this question */}
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontWeight: 600 }}>List Items</div>
                    <button type="button" className="insta-button" onClick={() => addListItem(index)}>Add List Item</button>
                  </div>
                  {(question.listItems || []).length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>No list items added.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {question.listItems.map((item, itemIndex) => (
                        <div key={itemIndex} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                          <textarea className="ui-input" rows={2} placeholder={`List item ${itemIndex + 1}`} value={item} onChange={(e) => updateListItem(index, itemIndex, e.target.value)} style={{ flex: 1 }} />
                          <button type="button" className="insta-button" style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }} onClick={() => removeListItem(index, itemIndex)}>Delete</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {question.children ? (
                  <div style={{ marginTop: 8, padding: 12, border: '1px solid var(--insta-primary)', borderRadius: 8, background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--insta-primary)' }}>Child Questions</div>
                        <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>Possible trigger values: {question.children}</div>
                      </div>
                      <button type="button" className="insta-button" onClick={() => addSubQuestion(index)}>Add Child Question</button>
                    </div>

                    {question.subQuestions.length > 0 && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>Existing Child Questions:</div>
                        {question.subQuestions.map((subQ, subIndex) => (
                          <div key={subIndex} style={{ padding: 10, marginBottom: 8, border: '1px solid var(--insta-border)', borderRadius: 8, background: '#fff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <div>
                                <div style={{ fontWeight: 600 }}>{subQ.questionNumber ? `${subQ.questionNumber}. ` : ''}{subQ.question}</div>
                                <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>ID: {subQ.questionId} | Type: {subQ.option_type}{subQ.triggerValue ? ` | Trigger: "${subQ.triggerValue}"` : ''}</div>
                              </div>
                              <button type="button" className="insta-button" style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }} onClick={() => removeSubQuestion(index, subIndex)}>Delete</button>
                            </div>

                            {/* Sub-question List Items */}
                            <div style={{ marginTop: 6 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <div style={{ fontWeight: 600 }}>List Items</div>
                                <button type="button" className="insta-button" onClick={() => addSubQuestionListItem(index, subIndex)}>Add List Item</button>
                              </div>
                              {(subQ.listItems || []).length === 0 ? (
                                <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>No list items added.</div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {subQ.listItems.map((item, itemIndex) => (
                                    <div key={itemIndex} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                      <textarea className="ui-input" rows={2} placeholder={`List item ${itemIndex + 1}`} value={item} onChange={(e) => updateSubQuestionListItem(index, subIndex, itemIndex, e.target.value)} style={{ flex: 1 }} />
                                      <button type="button" className="insta-button" style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }} onClick={() => removeSubQuestionListItem(index, subIndex, itemIndex)}>Delete</button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline sub-question hint (kept simple) */}
                    <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>Use the QuestionAdder flow elsewhere to add detailed sub-questions if needed.</div>
                  </div>
                ) : (
                  <div style={{ marginTop: 8, background: '#f1f5ff', border: '1px solid #cdddfd', padding: 10, borderRadius: 8, color: '#274c9b' }}>
                    Set a trigger value in the "Children" field above to enable adding sub-questions.
                  </div>
                )}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
            <button type="button" className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} onClick={() => { setFormTitle(''); setFormDescription(''); setQuestions([]); }}>Reset</button>
            <button type="submit" className="insta-button" disabled={loading}>{loading ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Form'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormBuilder;
