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
      const raw = response.data || [];
      // Normalize so every category has a 'name'
      const cats = raw.map(c => ({
        ...c,
        name: c?.name || c?.category || c?.title || c?.label || ''
      })).filter(c => c.name && c.name.trim() !== '');
      setCategories(cats);
      // If any question has empty questionType, set it to first category name
      if (cats.length > 0) {
        setQuestions(prev => prev.map(q => ({
          ...q,
          questionType: q.questionType && q.questionType.trim() !== '' ? q.questionType : cats[0].name
        })));
      }
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
    // default the questionType to the first available category if present
    const firstCat = (categories && categories.length > 0) ? categories[0].name : '';
    newQuestion.questionType = firstCat;
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

  // Nested (child's child) handlers - minimal
  const addNestedSubQuestion = (questionIndex, subQuestionIndex) => {
    const question = questions[questionIndex];
    const subQuestion = question.subQuestions[subQuestionIndex];
    const newChild = createEmptyQuestion((subQuestion.subQuestions?.length || 0));
    const next = [...(subQuestion.subQuestions || []), newChild];
    updateSubQuestion(questionIndex, subQuestionIndex, { subQuestions: next });
  };

  const updateNestedSubQuestion = (questionIndex, subQuestionIndex, nestedIndex, updates) => {
    const question = questions[questionIndex];
    const subQuestion = question.subQuestions[subQuestionIndex];
    const arr = (subQuestion.subQuestions || []).map((n, i) => i === nestedIndex ? { ...n, ...updates } : n);
    updateSubQuestion(questionIndex, subQuestionIndex, { subQuestions: arr });
  };

  const removeNestedSubQuestion = (questionIndex, subQuestionIndex, nestedIndex) => {
    const question = questions[questionIndex];
    const subQuestion = question.subQuestions[subQuestionIndex];
    const arr = (subQuestion.subQuestions || []).filter((_, i) => i !== nestedIndex);
    updateSubQuestion(questionIndex, subQuestionIndex, { subQuestions: arr });
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
    console.log("trigger")
    if (!validateForm()) return;

    try {
  setLoading(true);
  setError('');
      
      // Auto-generate hierarchical numbering: 1, 1.1, 1.1.1, ...
      const assignNumbers = (nodes, prefix = '') => {
        return (nodes || []).map((node, idx) => {
          const number = prefix ? `${prefix}.${idx + 1}` : String(idx + 1);
          const childWithNums = assignNumbers(node.subQuestions || [], number);
          return {
            ...node,
            questionNumber: number, // overwrite any manual number on save
            subQuestions: childWithNums,
          };
        });
      };
      const questionsWithNumbers = assignNumbers(questions);

      const formData = {
        title: formTitle,
        description: formDescription,
        questions: questionsWithNumbers.map((question, index) => {
          const fallbackType = (categories && categories.length > 0 && categories[0]?.name) ? categories[0].name : 'General';
          const qType = (question.questionType && String(question.questionType).trim() !== '') ? question.questionType : fallbackType;
          const qOut = {
            ...question,
            questionType: qType,
            validators: generateValidatorsObject(question),
            subQuestions: question.subQuestions?.map((subQ, subIndex) => ({
              ...subQ,
              validators: generateValidatorsObject(subQ),
              order: subIndex,
            })) || [],
            order: index,
          };
          console.log('[FormBuilder] Q', index + 1, 'questionType=', qOut.questionType);
          return qOut;
        }),
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
                    <select className="ui-input" value={question.questionType || (categories[0]?.name || '')} onChange={(e) => updateQuestion(index, { questionType: e.target.value })} required>
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

                            {/* Editable fields for child question */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <textarea
                                className="ui-input"
                                rows={2}
                                placeholder="Child Question Text"
                                value={subQ.question || ''}
                                onChange={(e) => updateSubQuestion(index, subIndex, { question: e.target.value })}
                              />

                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <input
                                  className="ui-input"
                                  placeholder="Child Question Number"
                                  value={subQ.questionNumber || ''}
                                  onChange={(e) => updateSubQuestion(index, subIndex, { questionNumber: e.target.value })}
                                  style={{ flex: '1 1 180px' }}
                                />

                                <input
                                  className="ui-input"
                                  placeholder="Child Question ID"
                                  value={subQ.questionId || ''}
                                  onChange={(e) => updateSubQuestion(index, subIndex, { questionId: e.target.value })}
                                  style={{ flex: '1 1 220px' }}
                                />

                                <div style={{ flex: '1 1 260px' }}>
                                  <label className="ui-input-label" style={{ display: 'block', marginBottom: 4 }}>Category/Question Type</label>
                                  <select
                                    className="ui-input"
                                    value={subQ.questionType || (categories[0]?.name || '')}
                                    onChange={(e) => updateSubQuestion(index, subIndex, { questionType: e.target.value })}
                                  >
                                    {categories.map((cat) => (
                                      <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
                                    ))}
                                  </select>
                                </div>

                                <div style={{ flex: '1 1 220px' }}>
                                  <label className="ui-input-label" style={{ display: 'block', marginBottom: 4 }}>Option Type</label>
                                  <select
                                    className="ui-input"
                                    value={subQ.option_type || 'text'}
                                    onChange={(e) => updateSubQuestion(index, subIndex, { option_type: e.target.value })}
                                  >
                                    {fieldTypes.map((t) => (
                                      <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                  </select>
                                </div>

                                <input
                                  className="ui-input"
                                  placeholder="Trigger Value (optional)"
                                  value={subQ.triggerValue || ''}
                                  onChange={(e) => updateSubQuestion(index, subIndex, { triggerValue: e.target.value })}
                                  style={{ flex: '1 1 220px' }}
                                />
                                <input
                                  className="ui-input"
                                  placeholder="Children (comma separated values to trigger its child questions)"
                                  value={subQ.children || ''}
                                  onChange={(e) => updateSubQuestion(index, subIndex, { children: e.target.value })}
                                  style={{ flex: '1 1 320px' }}
                                />
                              </div>
                            </div>

                            {/* Child Options UI (for select/radio/checkbox) */}
                            {['select','radio','checkbox'].includes(subQ.option_type) && (
                              <div style={{ marginTop: 10 }}>
                                <div style={{ fontWeight: 600, marginBottom: 6 }}>Options:</div>
                                {(subQ.options || []).map((opt, optIndex) => (
                                  <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <input
                                      className="ui-input"
                                      placeholder={`Option key ${optIndex + 1}`}
                                      value={opt.key || ''}
                                      onChange={(e) => updateSubQuestionOption(index, subIndex, optIndex, 'key', e.target.value)}
                                      style={{ flex: 1 }}
                                    />
                                    <input
                                      className="ui-input"
                                      placeholder={`Option value ${optIndex + 1}`}
                                      value={opt.val || ''}
                                      onChange={(e) => updateSubQuestionOption(index, subIndex, optIndex, 'val', e.target.value)}
                                      style={{ flex: 1 }}
                                    />
                                    <button
                                      type="button"
                                      className="insta-button"
                                      style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }}
                                      onClick={() => removeSubQuestionOption(index, subIndex, optIndex)}
                                    >Delete</button>
                                  </div>
                                ))}
                                <button type="button" className="insta-button" onClick={() => addSubQuestionOption(index, subIndex)}>Add Option</button>
                              </div>
                            )}
                            
                            {/* Child Validation Rules */}
                            <div style={{ marginTop: 8 }}>
                              <div style={{ fontWeight: 700, marginBottom: 6 }}>Validation Rules</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                {validatorTypes.map((vt) => {
                                  const selected = (subQ.validator_options || []).includes(vt);
                                  return (
                                    <button
                                      key={vt}
                                      type="button"
                                      className="insta-button"
                                      style={{ background: selected ? 'var(--insta-primary)' : '#fff', color: selected ? '#fff' : 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }}
                                      onClick={() => {
                                        const vopts = Array.isArray(subQ.validator_options) ? [...subQ.validator_options] : [];
                                        const pos = vopts.indexOf(vt);
                                        if (pos > -1) vopts.splice(pos, 1); else vopts.push(vt);
                                        updateSubQuestion(index, subIndex, { validator_options: vopts });
                                      }}
                                    >
                                      {vt}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {validatorTypes.map((vt) => {
                              const selected = (subQ.validator_options || []).includes(vt);
                              const numTypes = ['max','min','maxLength','minLength'];
                              const valObj = subQ.validator_values || {};
                              const msgObj = subQ.error_messages || {};
                              return (
                                <div key={vt} style={{ marginBottom: 8 }}>
                                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {vt === 'required' ? (
                                      <select
                                        className="ui-input"
                                        style={{ flex: '1 1 200px' }}
                                        disabled={!selected}
                                        value={(valObj?.[vt] === true || valObj?.[vt] === 'true') ? 'true' : 'false'}
                                        onChange={(e) => {
                                          const nextVals = { ...(subQ.validator_values || {}) };
                                          nextVals[vt] = e.target.value === 'true';
                                          updateSubQuestion(index, subIndex, { validator_values: nextVals });
                                        }}
                                      >
                                        <option value="true">true</option>
                                        <option value="false">false</option>
                                      </select>
                                    ) : (
                                      <input
                                        className="ui-input"
                                        style={{ flex: '1 1 200px' }}
                                        placeholder={`${vt} value`}
                                        disabled={!selected}
                                        value={valObj?.[vt] ?? ''}
                                        onChange={(e) => {
                                          const nextVals = { ...(subQ.validator_values || {}) };
                                          nextVals[vt] = numTypes.includes(vt) ? e.target.value : e.target.value;
                                          updateSubQuestion(index, subIndex, { validator_values: nextVals });
                                        }}
                                        type={numTypes.includes(vt) ? 'number' : 'text'}
                                      />
                                    )}
                                    <input
                                      className="ui-input"
                                      style={{ flex: '1 1 320px' }}
                                      placeholder={`${vt} error message`}
                                      disabled={!selected}
                                      value={msgObj?.[vt] ?? ''}
                                      onChange={(e) => {
                                        const nextMsgs = { ...(subQ.error_messages || {}) };
                                        nextMsgs[vt] = e.target.value;
                                        updateSubQuestion(index, subIndex, { error_messages: nextMsgs });
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}

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

                            {/* Child's Child Questions (placed at end of child editor) */}
                            {subQ.children && String(subQ.children).trim() !== '' && (
                              <div style={{ marginTop: 10, padding: 12, border: '1px dashed var(--insta-border)', borderRadius: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <div style={{ fontWeight: 700 }}>Child's Child Questions</div>
                                  <button type="button" className="insta-button" onClick={() => addNestedSubQuestion(index, subIndex)}>Add Child Question</button>
                                </div>

                                {(subQ.subQuestions || []).length === 0 ? (
                                  <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>No child's child questions yet.</div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {subQ.subQuestions.map((gc, gcIndex) => (
                                      <div key={gcIndex} style={{ padding: 10, border: '1px solid var(--insta-border)', borderRadius: 8, background: '#fff' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                          <div>
                                            <div style={{ fontWeight: 600 }}>{gc.questionNumber ? `${gc.questionNumber}. ` : ''}{gc.question || 'Untitled'}</div>
                                            <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>ID: {gc.questionId} | Type: {gc.option_type}{gc.triggerValue ? ` | Trigger: "${gc.triggerValue}"` : ''}</div>
                                          </div>
                                          <button type="button" className="insta-button" style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }} onClick={() => removeNestedSubQuestion(index, subIndex, gcIndex)}>Delete</button>
                                        </div>

                                        {/* Full field set for child's child */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                          <textarea className="ui-input" rows={2} placeholder="Child's Child Question Text" value={gc.question || ''} onChange={(e) => updateNestedSubQuestion(index, subIndex, gcIndex, { question: e.target.value })} />

                                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <input className="ui-input" placeholder="Child's Child Question Number (auto)" value={gc.questionNumber || ''} onChange={(e) => updateNestedSubQuestion(index, subIndex, gcIndex, { questionNumber: e.target.value })} style={{ flex: '1 1 160px' }} />
                                            <input className="ui-input" placeholder="Child's Child Question ID" value={gc.questionId || ''} onChange={(e) => updateNestedSubQuestion(index, subIndex, gcIndex, { questionId: e.target.value })} style={{ flex: '1 1 220px' }} />

                                            <div style={{ flex: '1 1 240px' }}>
                                              <label className="ui-input-label" style={{ display: 'block', marginBottom: 4 }}>Category/Question Type</label>
                                              <select className="ui-input" value={gc.questionType || (categories[0]?.name || '')} onChange={(e) => updateNestedSubQuestion(index, subIndex, gcIndex, { questionType: e.target.value })}>
                                                {categories.map((cat) => (
                                                  <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
                                                ))}
                                              </select>
                                            </div>

                                            <div style={{ flex: '1 1 220px' }}>
                                              <label className="ui-input-label" style={{ display: 'block', marginBottom: 4 }}>Option Type</label>
                                              <select className="ui-input" value={gc.option_type || 'text'} onChange={(e) => updateNestedSubQuestion(index, subIndex, gcIndex, { option_type: e.target.value })}>
                                                {fieldTypes.map((t) => (
                                                  <option key={t.value} value={t.value}>{t.label}</option>
                                                ))}
                                              </select>
                                            </div>

                                            <input className="ui-input" placeholder="Trigger Value (optional)" value={gc.triggerValue || ''} onChange={(e) => updateNestedSubQuestion(index, subIndex, gcIndex, { triggerValue: e.target.value })} style={{ flex: '1 1 200px' }} />
                                            <input className="ui-input" placeholder="Children (comma values to trigger next level)" value={gc.children || ''} onChange={(e) => updateNestedSubQuestion(index, subIndex, gcIndex, { children: e.target.value })} style={{ flex: '1 1 320px' }} />
                                          </div>

                                          {/* Options for child's child */}
                                          {['select','radio','checkbox'].includes(gc.option_type) && (
                                            <div style={{ marginTop: 8 }}>
                                              <div style={{ fontWeight: 600, marginBottom: 6 }}>Options:</div>
                                              {(gc.options || []).map((opt, optIndex) => (
                                                <div key={optIndex} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                                                  <input className="ui-input" placeholder={`Option key ${optIndex + 1}`} value={opt.key || ''} onChange={(e) => {
                                                    const opts = [...(gc.options || [])];
                                                    opts[optIndex] = { ...opts[optIndex], key: e.target.value };
                                                    updateNestedSubQuestion(index, subIndex, gcIndex, { options: opts });
                                                  }} style={{ flex: 1 }} />
                                                  <input className="ui-input" placeholder={`Option value ${optIndex + 1}`} value={opt.val || ''} onChange={(e) => {
                                                    const opts = [...(gc.options || [])];
                                                    opts[optIndex] = { ...opts[optIndex], val: e.target.value };
                                                    updateNestedSubQuestion(index, subIndex, gcIndex, { options: opts });
                                                  }} style={{ flex: 1 }} />
                                                  <button type="button" className="insta-button" style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }} onClick={() => {
                                                    const opts = (gc.options || []).filter((_, i) => i !== optIndex);
                                                    updateNestedSubQuestion(index, subIndex, gcIndex, { options: opts });
                                                  }}>Delete</button>
                                                </div>
                                              ))}
                                              <button type="button" className="insta-button" onClick={() => {
                                                const opts = [...(gc.options || []), { key: '', val: '' }];
                                                updateNestedSubQuestion(index, subIndex, gcIndex, { options: opts });
                                              }}>Add Option</button>
                                            </div>
                                          )}

                                          {/* Validators (same as child, disabled if not in validator_options) */}
                                          {/* Child's Child Validation Rules */}
                                          <div style={{ marginTop: 8 }}>
                                            <div style={{ fontWeight: 700, marginBottom: 6 }}>Validation Rules</div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                                              {validatorTypes.map((vt) => {
                                                const selected = (gc.validator_options || []).includes(vt);
                                                return (
                                                  <button
                                                    key={vt}
                                                    type="button"
                                                    className="insta-button"
                                                    style={{ background: selected ? 'var(--insta-primary)' : '#fff', color: selected ? '#fff' : 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }}
                                                    onClick={() => {
                                                      const vopts = Array.isArray(gc.validator_options) ? [...gc.validator_options] : [];
                                                      const pos = vopts.indexOf(vt);
                                                      if (pos > -1) vopts.splice(pos, 1); else vopts.push(vt);
                                                      updateNestedSubQuestion(index, subIndex, gcIndex, { validator_options: vopts });
                                                    }}
                                                  >
                                                    {vt}
                                                  </button>
                                                );
                                              })}
                                            </div>
                                          </div>

                                          {validatorTypes.map((vt) => {
                                            const selected = (gc.validator_options || []).includes(vt);
                                            const numTypes = ['max','min','maxLength','minLength'];
                                            const valObj = gc.validator_values || {};
                                            const msgObj = gc.error_messages || {};
                                            return (
                                              <div key={vt} style={{ marginBottom: 8 }}>
                                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                  {vt === 'required' ? (
                                                    <select className="ui-input" style={{ flex: '1 1 200px' }} disabled={!selected} value={(valObj?.[vt] === true || valObj?.[vt] === 'true') ? 'true' : 'false'} onChange={(e) => {
                                                      const nextVals = { ...(gc.validator_values || {}) };
                                                      nextVals[vt] = e.target.value === 'true';
                                                      updateNestedSubQuestion(index, subIndex, gcIndex, { validator_values: nextVals });
                                                    }}>
                                                      <option value="true">true</option>
                                                      <option value="false">false</option>
                                                    </select>
                                                  ) : (
                                                    <input className="ui-input" style={{ flex: '1 1 200px' }} placeholder={`${vt} value`} disabled={!selected} value={valObj?.[vt] ?? ''} onChange={(e) => {
                                                      const nextVals = { ...(gc.validator_values || {}) };
                                                      nextVals[vt] = numTypes.includes(vt) ? e.target.value : e.target.value;
                                                      updateNestedSubQuestion(index, subIndex, gcIndex, { validator_values: nextVals });
                                                    }} type={numTypes.includes(vt) ? 'number' : 'text'} />
                                                  )}
                                                  <input className="ui-input" style={{ flex: '1 1 320px' }} placeholder={`${vt} error message`} disabled={!selected} value={msgObj?.[vt] ?? ''} onChange={(e) => {
                                                    const nextMsgs = { ...(gc.error_messages || {}) };
                                                    nextMsgs[vt] = e.target.value;
                                                    updateNestedSubQuestion(index, subIndex, gcIndex, { error_messages: nextMsgs });
                                                  }} />
                                                </div>
                                              </div>
                                            );
                                          })}

                                          {/* List Items for child's child */}
                                          <div style={{ marginTop: 6 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                              <div style={{ fontWeight: 600 }}>List Items</div>
                                              <button type="button" className="insta-button" onClick={() => {
                                                const list = [...(gc.listItems || []), ''];
                                                updateNestedSubQuestion(index, subIndex, gcIndex, { listItems: list });
                                              }}>Add List Item</button>
                                            </div>
                                            {(gc.listItems || []).length === 0 ? (
                                              <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>No list items added.</div>
                                            ) : (
                                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                                {(gc.listItems || []).map((li, liIdx) => (
                                                  <div key={liIdx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                                    <textarea className="ui-input" rows={2} placeholder={`List item ${liIdx + 1}`} value={li} onChange={(e) => {
                                                      const list = [...(gc.listItems || [])];
                                                      list[liIdx] = e.target.value;
                                                      updateNestedSubQuestion(index, subIndex, gcIndex, { listItems: list });
                                                    }} style={{ flex: 1 }} />
                                                    <button type="button" className="insta-button" style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }} onClick={() => {
                                                      const list = (gc.listItems || []).filter((_, i) => i !== liIdx);
                                                      updateNestedSubQuestion(index, subIndex, gcIndex, { listItems: list });
                                                    }}>Delete</button>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
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
