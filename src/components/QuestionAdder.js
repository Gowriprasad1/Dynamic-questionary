import React, { useState, useEffect } from 'react';
import '../ui/insta/_form.scss';
import { categoriesAPI } from '../services/api';

const QuestionAdder = ({ category, onQuestionAdded, onCancel }) => {
  const [categories, setCategories] = useState([]);
  const [question, setQuestion] = useState({
    question: '',
    questionType: category || '',
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
    validator_options: [],
    children: '',
    subQuestions: [],
    parentQuestionId: '',
    order: 0,
    // allow admin to add ordered list content associated with the question
    listItems: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSubQuestionForm, setShowSubQuestionForm] = useState(false);
  const [currentSubQuestion, setCurrentSubQuestion] = useState(null);

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

  const updateQuestion = (updates) => {
    setQuestion({ ...question, ...updates });
  };

  const addOption = () => {
    const newOptions = [...question.options, { key: '', val: '' }];
    updateQuestion({ options: newOptions });
  };

  const updateOption = (optionIndex, field, value) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
    updateQuestion({ options: newOptions });
  };

  const removeOption = (optionIndex) => {
    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    updateQuestion({ options: newOptions });
  };

  const updateValidatorValue = (validatorType, value) => {
    const newValidatorValues = { ...question.validator_values, [validatorType]: value };
    updateQuestion({ validator_values: newValidatorValues });
  };

  const updateErrorMessage = (validatorType, value) => {
    const newErrorMessages = { ...question.error_messages, [validatorType]: value };
    updateQuestion({ error_messages: newErrorMessages });
  };

  const toggleValidatorOption = (validatorType) => {
    const validatorOptions = [...question.validator_options];
    const index = validatorOptions.indexOf(validatorType);
    
    if (index > -1) {
      validatorOptions.splice(index, 1);
    } else {
      validatorOptions.push(validatorType);
    }
    
    updateQuestion({ validator_options: validatorOptions });
  };

  const initializeSubQuestion = () => {
    return {
      question: '',
      questionType: question.questionType,
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
      validator_options: [],
      triggerValue: '', // User will specify which parent answer triggers this
      parentQuestionId: question.questionId,
      order: question.subQuestions.length,
      // list items for the child question
      listItems: [],
    };
  };

    // Main question list item handlers
    const addListItem = () => {
      const newList = [...(question.listItems || []), ''];
      updateQuestion({ listItems: newList });
    };

    const updateListItem = (itemIndex, value) => {
      const newList = [...(question.listItems || [])];
      newList[itemIndex] = value;
      updateQuestion({ listItems: newList });
    };

    const removeListItem = (itemIndex) => {
      const newList = (question.listItems || []).filter((_, i) => i !== itemIndex);
      updateQuestion({ listItems: newList });
    };

    // Current sub-question list item handlers (editing the transient currentSubQuestion)
    const addSubQuestionListItem = () => {
      const newList = [...(currentSubQuestion.listItems || []), ''];
      updateSubQuestion({ listItems: newList });
    };

    const updateSubQuestionListItem = (itemIndex, value) => {
      const newList = [...(currentSubQuestion.listItems || [])];
      newList[itemIndex] = value;
      updateSubQuestion({ listItems: newList });
    };

    const removeSubQuestionListItem = (itemIndex) => {
      const newList = (currentSubQuestion.listItems || []).filter((_, i) => i !== itemIndex);
      updateSubQuestion({ listItems: newList });
    };

  const addSubQuestion = () => {
    if (!question.children) {
      setError('Please set a trigger value (Children field) before adding sub-questions');
      return;
    }
    setCurrentSubQuestion(initializeSubQuestion());
    setShowSubQuestionForm(true);
  };

  const saveSubQuestion = () => {
    if (!currentSubQuestion.question.trim()) {
      setError('Sub-question text is required');
      return;
    }
    if (!currentSubQuestion.questionId.trim()) {
      setError('Sub-question ID is required');
      return;
    }

    const newSubQuestions = [...question.subQuestions, currentSubQuestion];
    updateQuestion({ subQuestions: newSubQuestions });
    setCurrentSubQuestion(null);
    setShowSubQuestionForm(false);
    setError('');
  };

  const cancelSubQuestion = () => {
    setCurrentSubQuestion(null);
    setShowSubQuestionForm(false);
    setError('');
  };

  const removeSubQuestion = (index) => {
    const newSubQuestions = question.subQuestions.filter((_, i) => i !== index);
    updateQuestion({ subQuestions: newSubQuestions });
  };

  const updateSubQuestion = (updates) => {
    setCurrentSubQuestion({ ...currentSubQuestion, ...updates });
  };

  const updateSubQuestionOption = (optionIndex, field, value) => {
    const newOptions = [...currentSubQuestion.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
    updateSubQuestion({ options: newOptions });
  };

  const addSubQuestionOption = () => {
    const newOptions = [...currentSubQuestion.options, { key: '', val: '' }];
    updateSubQuestion({ options: newOptions });
  };

  const removeSubQuestionOption = (optionIndex) => {
    const newOptions = currentSubQuestion.options.filter((_, i) => i !== optionIndex);
    updateSubQuestion({ options: newOptions });
  };

  const updateSubQuestionValidatorValue = (validatorType, value) => {
    const newValidatorValues = { ...currentSubQuestion.validator_values, [validatorType]: value };
    updateSubQuestion({ validator_values: newValidatorValues });
  };

  const updateSubQuestionErrorMessage = (validatorType, value) => {
    const newErrorMessages = { ...currentSubQuestion.error_messages, [validatorType]: value };
    updateSubQuestion({ error_messages: newErrorMessages });
  };

  const toggleSubQuestionValidatorOption = (validatorType) => {
    const validatorOptions = [...(currentSubQuestion.validator_options || [])];
    const index = validatorOptions.indexOf(validatorType);
    
    if (index > -1) {
      validatorOptions.splice(index, 1);
    } else {
      validatorOptions.push(validatorType);
    }
    
    updateSubQuestion({ validator_options: validatorOptions });
  };

  const validateQuestion = () => {
    if (!question.question.trim()) {
      setError('Question text is required');
      return false;
    }
    if (!question.questionId.trim()) {
      setError('Question ID is required');
      return false;
    }
    if (!question.questionType.trim()) {
      setError('Question type is required');
      return false;
    }
    if (['select', 'radio', 'checkbox'].includes(question.option_type) && question.options.length === 0) {
      setError('At least one option is required for this field type');
      return false;
    }
    return true;
  };

  const generateValidatorsObject = (questionData) => {
    const validators = {};
    
    // Generate validators object from validator_values and error_messages
    validatorTypes.forEach(validatorType => {
      if (questionData.validator_options?.includes(validatorType)) {
        const value = questionData.validator_values[validatorType];
        const message = questionData.error_messages[validatorType];
        
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateQuestion()) return;

    setLoading(true);
    setError('');
    
    // Process question with validators
    const processedQuestion = {
      ...question,
      validators: generateValidatorsObject(question),
      subQuestions: question.subQuestions.map((subQ, index) => ({
        ...subQ,
        validators: generateValidatorsObject(subQ),
        order: index,
      })),
    };
    
    // Call the parent callback with the processed question data
    onQuestionAdded(processedQuestion);
  };

  const renderQuestionOptions = () => {
    if (!['select', 'radio', 'checkbox'].includes(question.option_type)) {
      return null;
    }

    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Options:</div>
        {question.options?.map((option, optionIndex) => (
          <div key={optionIndex} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input
              className="ui-input"
              placeholder={`Option key ${optionIndex + 1}`}
              value={option.key}
              onChange={(e) => updateOption(optionIndex, 'key', e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              className="ui-input"
              placeholder={`Option value ${optionIndex + 1}`}
              value={option.val}
              onChange={(e) => updateOption(optionIndex, 'val', e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }} onClick={() => removeOption(optionIndex)}>Delete</button>
          </div>
        ))}
        <button className="insta-button" onClick={addOption}>Add Option</button>
      </div>
    );
  };

  const renderValidatorSection = () => {
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Validation Rules</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {validatorTypes.map((validatorType) => (
            <button
              key={validatorType}
              type="button"
              className="insta-button"
              style={{ background: question.validator_options?.includes(validatorType) ? 'var(--insta-primary)' : '#fff', color: question.validator_options?.includes(validatorType) ? '#fff' : 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }}
              onClick={() => toggleValidatorOption(validatorType)}
            >
              {validatorType}
            </button>
          ))}
        </div>
        {question.validator_options?.map((validatorType) => (
          <div key={validatorType} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--insta-muted)', marginBottom: 4 }}>
              {validatorType.charAt(0).toUpperCase() + validatorType.slice(1)} Validator
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="ui-input"
                placeholder={`${validatorType} value`}
                value={question.validator_values[validatorType] || ''}
                onChange={(e) => updateValidatorValue(validatorType, e.target.value)}
                type={['max', 'min', 'maxLength', 'minLength'].includes(validatorType) ? 'number' : 'text'}
                style={{ flex: 1 }}
              />
              <input
                className="ui-input"
                placeholder="Error message"
                value={question.error_messages[validatorType] || ''}
                onChange={(e) => updateErrorMessage(validatorType, e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSubQuestionOptions = () => {
    if (!currentSubQuestion || !['select', 'radio', 'checkbox'].includes(currentSubQuestion.option_type)) {
      return null;
    }

    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Options:</div>
        {currentSubQuestion.options?.map((option, optionIndex) => (
          <div key={optionIndex} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <input
              className="ui-input"
              placeholder={`Option key ${optionIndex + 1}`}
              value={option.key}
              onChange={(e) => updateSubQuestionOption(optionIndex, 'key', e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              className="ui-input"
              placeholder={`Option value ${optionIndex + 1}`}
              value={option.val}
              onChange={(e) => updateSubQuestionOption(optionIndex, 'val', e.target.value)}
              style={{ flex: 1 }}
            />
            <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }} onClick={() => removeSubQuestionOption(optionIndex)}>Delete</button>
          </div>
        ))}
        <button className="insta-button" onClick={addSubQuestionOption}>Add Option</button>
      </div>
    );
  };

  const renderSubQuestionValidatorSection = () => {
    if (!currentSubQuestion) return null;

    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Validation Rules</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
          {validatorTypes.map((validatorType) => (
            <button
              key={validatorType}
              type="button"
              className="insta-button"
              style={{ background: currentSubQuestion.validator_options?.includes(validatorType) ? 'var(--insta-primary)' : '#fff', color: currentSubQuestion.validator_options?.includes(validatorType) ? '#fff' : 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }}
              onClick={() => toggleSubQuestionValidatorOption(validatorType)}
            >
              {validatorType}
            </button>
          ))}
        </div>
        {currentSubQuestion.validator_options?.map((validatorType) => (
          <div key={validatorType} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--insta-muted)', marginBottom: 4 }}>
              {validatorType.charAt(0).toUpperCase() + validatorType.slice(1)} Validator
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="ui-input"
                placeholder={`${validatorType} value`}
                value={currentSubQuestion.validator_values[validatorType] || ''}
                onChange={(e) => updateSubQuestionValidatorValue(validatorType, e.target.value)}
                type={['max', 'min', 'maxLength', 'minLength'].includes(validatorType) ? 'number' : 'text'}
                style={{ flex: 1 }}
              />
              <input
                className="ui-input"
                placeholder="Error message"
                value={currentSubQuestion.error_messages[validatorType] || ''}
                onChange={(e) => updateSubQuestionErrorMessage(validatorType, e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSubQuestionsSection = () => {
    if (!question.children) {
      return (
        <div style={{ marginTop: 8, background: '#f1f5ff', border: '1px solid #cdddfd', padding: 10, borderRadius: 8, color: '#274c9b' }}>
          Set a trigger value in the "Children" field above to enable adding sub-questions.
        </div>
      );
    }

    return (
      <div style={{ marginTop: 8, padding: 12, border: '1px solid var(--insta-primary)', borderRadius: 8, background: '#f8fafc' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--insta-primary)' }}>Child Questions</div>
            <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>Possible trigger values: {question.children}</div>
          </div>
          <button className="insta-button" onClick={addSubQuestion} disabled={showSubQuestionForm}>Add Child Question</button>
        </div>

        {/* List existing sub-questions */}
        {question.subQuestions.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Existing Child Questions:</div>
            {question.subQuestions.map((subQ, index) => (
              <div key={index} style={{ padding: 10, marginBottom: 8, border: '1px solid var(--insta-border)', borderRadius: 8, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{subQ.questionNumber ? `${subQ.questionNumber}. ` : ''}{subQ.question}</div>
                  <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>
                    ID: {subQ.questionId} | Type: {subQ.option_type}{subQ.triggerValue ? ` | Trigger: "${subQ.triggerValue}"` : ''}
                  </div>
                </div>
                <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }} onClick={() => removeSubQuestion(index)}>Delete</button>
              </div>
            ))}
          </div>
        )}

        {/* Sub-question form */}
        {showSubQuestionForm && currentSubQuestion && (
          <div className="insta-card" style={{ padding: 12, background: '#fff' }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>New Child Question</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                className="ui-input"
                placeholder="Child Question Text"
                value={currentSubQuestion.question}
                onChange={(e) => updateSubQuestion({ question: e.target.value })}
              />

              {/* List Items for the new child question */}
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 12, color: 'var(--insta-muted)', marginBottom: 4 }}>Question Lables</div>
                {(currentSubQuestion.listItems || []).map((item, itemIndex) => (
                  <div key={itemIndex} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <input
                      className="ui-input"
                      placeholder={`Item ${itemIndex + 1}`}
                      value={item}
                      onChange={(e) => updateSubQuestionListItem(itemIndex, e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }} onClick={() => removeSubQuestionListItem(itemIndex)}>Delete</button>
                  </div>
                ))}
                <button className="insta-button" onClick={addSubQuestionListItem}>Add Lable</button>
              </div>

              <input
                className="ui-input"
                placeholder="Sub-Question Number (e.g., 1a, 1b, 2a)"
                value={currentSubQuestion.questionNumber || ''}
                onChange={(e) => updateSubQuestion({ questionNumber: e.target.value })}
              />
              <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>e.g., 1a, 1b, 2a</div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="ui-input"
                  placeholder="Question ID"
                  value={currentSubQuestion.questionId}
                  onChange={(e) => updateSubQuestion({ questionId: e.target.value })}
                  required
                  style={{ flex: 1 }}
                />
                <div style={{ flex: 1 }}>
                  <label className="ui-input-label" style={{ display: 'block', marginBottom: 4 }}>Option Type</label>
                  <select className="ui-input" value={currentSubQuestion.option_type} onChange={(e) => updateSubQuestion({ option_type: e.target.value })}>
                    {fieldTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <input
                className="ui-input"
                placeholder="Trigger Value (parent answer)"
                value={currentSubQuestion.triggerValue || ''}
                onChange={(e) => updateSubQuestion({ triggerValue: e.target.value })}
              />
              <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>Which parent answer shows this sub-question</div>

              {renderSubQuestionOptions()}
              {renderSubQuestionValidatorSection()}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} onClick={cancelSubQuestion}>Cancel</button>
                <button className="insta-button" onClick={saveSubQuestion}>Save Child Question</button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

  return (
    <div className="insta-card" style={{ padding: 16 }}>
      <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Add New {category} Question</div>

      {error && (
        <div style={{ marginBottom: 12, color: 'var(--insta-red)', background: '#ffeef0', padding: 12, borderRadius: 8 }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            className="ui-input"
            placeholder="Question Text"
            value={question.question}
            onChange={(e) => updateQuestion({ question: e.target.value })}
            required
          />

          <div>
            <div style={{ fontSize: 12, color: 'var(--insta-muted)', marginBottom: 4 }}>Question Lables</div>
            {(question.listItems || []).map((item, itemIndex) => (
              <div key={itemIndex} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input
                  className="ui-input"
                  placeholder={`Item ${itemIndex + 1}`}
                  value={item}
                  onChange={(e) => updateListItem(itemIndex, e.target.value)}
                  style={{ flex: 1 }}
                />
                <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-red)', border: '1px solid var(--insta-red)' }} onClick={() => removeListItem(itemIndex)} type="button">Delete</button>
              </div>
            ))}
            <button className="insta-button" type="button" onClick={addListItem}>Add Lable</button>
          </div>

          <input
            className="ui-input"
            placeholder="Question Number"
            value={question.questionNumber}
            onChange={(e) => updateQuestion({ questionNumber: e.target.value })}
          />
          <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>Display number (e.g., 1, 2, 3)</div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="ui-input-label" style={{ display: 'block', marginBottom: 4 }}>Category/Question Type</label>
              <select className="ui-input" value={question.questionType} onChange={(e) => updateQuestion({ questionType: e.target.value })} required>
                {categories.map((cat) => (
                  <option key={cat._id || cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            <input
              className="ui-input"
              placeholder="Question ID (unique identifier)"
              value={question.questionId}
              onChange={(e) => updateQuestion({ questionId: e.target.value })}
              required
              style={{ flex: 1 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label className="ui-input-label" style={{ display: 'block', marginBottom: 4 }}>Option Type</label>
              <select className="ui-input" value={question.option_type} onChange={(e) => updateQuestion({ option_type: e.target.value })}>
                {fieldTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <input
              className="ui-input"
              placeholder="Children (Trigger for sub-questions)"
              value={question.children}
              onChange={(e) => updateQuestion({ children: e.target.value })}
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ fontSize: 12, color: 'var(--insta-muted)' }}>Comma-separated answers that can trigger sub-questions (e.g., 'yes,no')</div>

          {renderQuestionOptions()}
          {renderValidatorSection()}
          {renderSubQuestionsSection()}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button className="insta-button" style={{ background: '#fff', color: 'var(--insta-primary)', border: '1px solid var(--insta-primary)' }} type="button" onClick={onCancel}>Cancel</button>
            <button className="insta-button" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Question'}</button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default QuestionAdder;
