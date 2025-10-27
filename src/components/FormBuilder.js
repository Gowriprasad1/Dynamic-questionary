import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ExpandMore as ExpandMoreIcon,
  CheckCircle as ValidationIcon,
} from '@mui/icons-material';
import { formsAPI, categoriesAPI } from '../services/api';

const FormBuilder = ({ onFormCreated, editFormData = null, disableAddQuestion = false }) => {
  const [formId, setFormId] = useState(editFormData?._id || null);
  const [formTitle, setFormTitle] = useState(editFormData?.title || '');
  const [formDescription, setFormDescription] = useState(editFormData?.description || '');
  const [questions, setQuestions] = useState(editFormData?.questions || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  // Sub-question validator handlers
  const updateSubQuestionValidatorValue = (questionIndex, subQuestionIndex, validatorType, value) => {
    const question = questions[questionIndex];
    const subQuestion = question.subQuestions[subQuestionIndex];
    const newValidatorValues = { ...subQuestion.validator_values, [validatorType]: value };
    updateSubQuestion(questionIndex, subQuestionIndex, { validator_values: newValidatorValues });
  };

  const updateSubQuestionErrorMessage = (questionIndex, subQuestionIndex, validatorType, value) => {
    const question = questions[questionIndex];
    const subQuestion = question.subQuestions[subQuestionIndex];
    const newErrorMessages = { ...subQuestion.error_messages, [validatorType]: value };
    updateSubQuestion(questionIndex, subQuestionIndex, { error_messages: newErrorMessages });
  };

  const toggleSubQuestionValidatorOption = (questionIndex, subQuestionIndex, validatorType) => {
    const question = questions[questionIndex];
    const subQuestion = question.subQuestions[subQuestionIndex];
    const validatorOptions = [...(subQuestion.validator_options || [])];
    const index = validatorOptions.indexOf(validatorType);
    
    if (index > -1) {
      validatorOptions.splice(index, 1);
    } else {
      validatorOptions.push(validatorType);
    }
    
    updateSubQuestion(questionIndex, subQuestionIndex, { validator_options: validatorOptions });
  };

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

  const generateQuestionId = (question) => {
    return question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '');
  };

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
  // Debug: print questions array before constructing payload so we can verify listItems exist
  console.log('Questions payload preview:', JSON.stringify(questions, null, 2));
      
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

      console.log('Submitting form data:', JSON.stringify(formData, null, 2));

      let response;
      if (isEditMode && formId) {
        response = await formsAPI.update(formId, formData);
        setSuccess('Form updated successfully!');
      } else {
        response = await formsAPI.create(formData);
        setSuccess('Form created successfully!');
      }
      
      console.log('Server response:', response.data);
      
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
      <Box sx={{ marginTop: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Options:
        </Typography>
        {question.options?.map((option, optionIndex) => (
          <Box key={optionIndex} display="flex" alignItems="center" marginBottom={1} gap={1}>
            <TextField
              size="small"
              label="Key"
              value={option.key}
              onChange={(e) => updateOption(questionIndex, optionIndex, 'key', e.target.value)}
              placeholder={`Option key ${optionIndex + 1}`}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="Value"
              value={option.val}
              onChange={(e) => updateOption(questionIndex, optionIndex, 'val', e.target.value)}
              placeholder={`Option value ${optionIndex + 1}`}
              sx={{ flex: 1 }}
            />
            <IconButton
              size="small"
              onClick={() => removeOption(questionIndex, optionIndex)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => addOption(questionIndex)}
        >
          Add Option
        </Button>
      </Box>
    );
  };

  const renderSubQuestionOptions = (question, questionIndex, subQuestion, subQuestionIndex) => {
    if (!['select', 'radio', 'checkbox'].includes(subQuestion.option_type)) {
      return null;
    }

    return (
      <Grid item xs={12}>
        <Typography variant="caption" gutterBottom display="block">
          Options:
        </Typography>
        {subQuestion.options?.map((option, optionIndex) => (
          <Box key={optionIndex} display="flex" alignItems="center" marginBottom={1} gap={1}>
            <TextField
              size="small"
              label="Key"
              value={option.key}
              onChange={(e) => updateSubQuestionOption(questionIndex, subQuestionIndex, optionIndex, 'key', e.target.value)}
              placeholder={`Option key ${optionIndex + 1}`}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="Value"
              value={option.val}
              onChange={(e) => updateSubQuestionOption(questionIndex, subQuestionIndex, optionIndex, 'val', e.target.value)}
              placeholder={`Option value ${optionIndex + 1}`}
              sx={{ flex: 1 }}
            />
            <IconButton
              size="small"
              onClick={() => removeSubQuestionOption(questionIndex, subQuestionIndex, optionIndex)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => addSubQuestionOption(questionIndex, subQuestionIndex)}
        >
          Add Option
        </Button>
      </Grid>
    );
  };

  const renderSubQuestionValidatorSection = (question, questionIndex, subQuestion, subQuestionIndex) => {
    return (
      <Grid item xs={12}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box display="flex" alignItems="center" gap={1}>
              <ValidationIcon />
              <Typography variant="caption">Validation Rules</Typography>
              <Box display="flex" gap={0.5}>
                {subQuestion.validator_options?.map((option) => (
                  <Chip key={option} label={option} size="small" color="primary" />
                ))}
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {/* Validator Options Selection */}
              <Grid item xs={12}>
                <Typography variant="caption" gutterBottom>
                  Select Validators:
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {validatorTypes.map((validatorType) => (
                    <Chip
                      key={validatorType}
                      label={validatorType}
                      size="small"
                      onClick={() => toggleSubQuestionValidatorOption(questionIndex, subQuestionIndex, validatorType)}
                      color={subQuestion.validator_options?.includes(validatorType) ? 'primary' : 'default'}
                      variant={subQuestion.validator_options?.includes(validatorType) ? 'filled' : 'outlined'}
                    />
                  ))}
                </Box>
              </Grid>

              {/* Validator Values */}
              <Grid item xs={12}>
                <Typography variant="caption" gutterBottom>
                  Validator Values:
                </Typography>
                <Grid container spacing={1}>
                  {validatorTypes.map((validatorType) => (
                    <Grid item xs={12} sm={6} md={4} key={validatorType}>
                      {validatorType === 'required' ? (
                        <FormControl fullWidth size="small" disabled={!subQuestion.validator_options?.includes(validatorType)}>
                          <InputLabel>required value</InputLabel>
                          <Select
                            value={subQuestion.validator_values?.[validatorType] === true || subQuestion.validator_values?.[validatorType] === 'true' ? 'true' : 'false'}
                            onChange={(e) => updateSubQuestionValidatorValue(questionIndex, subQuestionIndex, validatorType, e.target.value === 'true')}
                            label="required value"
                          >
                            <MenuItem value="true">true</MenuItem>
                            <MenuItem value="false">false</MenuItem>
                          </Select>
                        </FormControl>
                      ) : (
                        <TextField
                          fullWidth
                          size="small"
                          label={`${validatorType} value`}
                          value={subQuestion.validator_values?.[validatorType] || ''}
                          onChange={(e) => updateSubQuestionValidatorValue(questionIndex, subQuestionIndex, validatorType, e.target.value)}
                          type={['max', 'min', 'maxLength', 'minLength'].includes(validatorType) ? 'number' : 'text'}
                          disabled={!subQuestion.validator_options?.includes(validatorType)}
                        />
                      )}
                    </Grid>
                  ))}
                </Grid>
              </Grid>

              {/* Error Messages */}
              <Grid item xs={12}>
                <Typography variant="caption" gutterBottom>
                  Error Messages:
                </Typography>
                <Grid container spacing={1}>
                  {validatorTypes.map((validatorType) => (
                    <Grid item xs={12} sm={6} md={4} key={validatorType}>
                      <TextField
                        fullWidth
                        size="small"
                        label={`${validatorType} error message`}
                        value={subQuestion.error_messages?.[validatorType] || ''}
                        onChange={(e) => updateSubQuestionErrorMessage(questionIndex, subQuestionIndex, validatorType, e.target.value)}
                        disabled={!subQuestion.validator_options?.includes(validatorType)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Grid>
    );
  };

  const renderValidatorSection = (question, questionIndex) => {
    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <ValidationIcon />
            <Typography variant="subtitle2">Validation Rules</Typography>
            <Box display="flex" gap={0.5}>
              {question.validator_options.map((option) => (
                <Chip key={option} label={option} size="small" color="primary" />
              ))}
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {/* Validator Options Selection */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Select Validators:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {validatorTypes.map((validatorType) => (
                  <Chip
                    key={validatorType}
                    label={validatorType}
                    onClick={() => toggleValidatorOption(questionIndex, validatorType)}
                    color={question.validator_options.includes(validatorType) ? 'primary' : 'default'}
                    variant={question.validator_options.includes(validatorType) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Grid>

            {/* Validator Values */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Validator Values:
              </Typography>
              <Grid container spacing={2}>
                {validatorTypes.map((validatorType) => (
                  <Grid item xs={12} sm={6} md={4} key={validatorType}>
                    {validatorType === 'required' ? (
                      <FormControl fullWidth size="small" disabled={!question.validator_options.includes(validatorType)}>
                        <InputLabel>required value</InputLabel>
                        <Select
                          value={question.validator_values[validatorType] === true || question.validator_values[validatorType] === 'true' ? 'true' : 'false'}
                          onChange={(e) => updateValidatorValue(questionIndex, validatorType, e.target.value === 'true')}
                          label="required value"
                        >
                          <MenuItem value="true">true</MenuItem>
                          <MenuItem value="false">false</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        fullWidth
                        size="small"
                        label={`${validatorType} value`}
                        value={question.validator_values[validatorType] || ''}
                        onChange={(e) => updateValidatorValue(questionIndex, validatorType, e.target.value)}
                        type={['max', 'min', 'maxLength', 'minLength'].includes(validatorType) ? 'number' : 'text'}
                        disabled={!question.validator_options.includes(validatorType)}
                      />
                    )}
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Error Messages */}
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Error Messages:
              </Typography>
              <Grid container spacing={2}>
                {validatorTypes.map((validatorType) => (
                  <Grid item xs={12} sm={6} md={4} key={validatorType}>
                    <TextField
                      fullWidth
                      size="small"
                      label={`${validatorType} error message`}
                      value={question.error_messages[validatorType] || ''}
                      onChange={(e) => updateErrorMessage(questionIndex, validatorType, e.target.value)}
                      disabled={!question.validator_options.includes(validatorType)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Grid>

          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box maxWidth="1400px" margin="0 auto" padding={3}>
      <Paper elevation={3} sx={{ padding: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 3, fontWeight: 600 }}>
          {isEditMode ? '✏️ Edit Form' : '➕ Create New Form'}
        </Typography>

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

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Form Title */}
            <TextField
              fullWidth
              label="Form Title"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              variant="outlined"
              sx={{ 
                '& .MuiInputBase-root': { height: 56 }
              }}
            />

            {/* Form Description */}
            <TextField
              fullWidth
              label="Form Description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              multiline
              rows={3}
              variant="outlined"
            />

            <Divider sx={{ my: 2 }} />
            
            {/* Questions Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" sx={{ fontWeight: 600 }}>Form Questions</Typography>
              {!disableAddQuestion && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={addQuestion}
                  sx={{ height: 40 }}
                >
                  Add Question
                </Button>
              )}
            </Box>

            {/* Questions List */}
            {questions.map((question, index) => (
              <Card 
                key={index}
                variant="outlined"
                sx={{ 
                  borderRadius: 2,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  '&:hover': {
                    boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
                  }
                }}
              >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" marginBottom={3}>
                      <DragIcon sx={{ marginRight: 1, color: 'text.secondary' }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Question {index + 1}
                      </Typography>
                      <Box flexGrow={1} />
                      <IconButton
                        onClick={() => removeQuestion(index)}
                        color="error"
                        size="medium"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                      {/* Question Text */}
                      <TextField
                        fullWidth
                        label="Question Text"
                        value={question.question}
                        onChange={(e) => handleQuestionChange(index, e.target.value)}
                        required
                        multiline
                        rows={2}
                        variant="outlined"
                      />

                      

                      {/* Row 1: Question Number */}
                      <TextField
                        fullWidth
                        label="Question Number"
                        value={question.questionNumber}
                        onChange={(e) => updateQuestion(index, { questionNumber: e.target.value })}
                        placeholder="e.g., 1, 2, 3"
                        helperText="Display number (e.g., 1, 2, 3)"
                      />

                      {/* Row 2: Category and Question ID */}
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <FormControl fullWidth required>
                          <InputLabel>Category/Question Type</InputLabel>
                          <Select
                            value={question.questionType}
                            onChange={(e) => updateQuestion(index, { questionType: e.target.value })}
                            label="Category/Question Type"
                          >
                            {categories.map((cat) => (
                              <MenuItem key={cat._id || cat.name} value={cat.name}>
                                {cat.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <TextField
                          fullWidth
                          label="Question ID (unique identifier)"
                          value={question.questionId}
                          onChange={(e) => updateQuestion(index, { questionId: e.target.value })}
                          required
                          placeholder="e.g., health_q1, travel_q2"
                          helperText="Enter a unique ID"
                        />
                      </Box>

                      {/* Row 3: Option Type and Children */}
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel>Option Type</InputLabel>
                          <Select
                            value={question.option_type}
                            onChange={(e) => updateQuestion(index, { option_type: e.target.value })}
                            label="Option Type"
                          >
                            {fieldTypes.map((type) => (
                              <MenuItem key={type.value} value={type.value}>
                                {type.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <TextField
                          fullWidth
                          label="Children (Trigger for sub-questions)"
                          value={question.children}
                          onChange={(e) => updateQuestion(index, { children: e.target.value })}
                          placeholder="e.g., yes, true"
                          helperText="Answer that triggers sub-questions"
                        />
                      </Box>

                      {/* List Items (ordered list content) - admin can add any number of list items */}
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          Question Lables
                        </Typography>
                        {(question.listItems || []).map((item, itemIndex) => (
                          <Box key={itemIndex} display="flex" alignItems="center" gap={1} mb={1}>
                            <TextField
                              size="small"
                              label={`Item ${itemIndex + 1}`}
                              value={item}
                              onChange={(e) => updateListItem(index, itemIndex, e.target.value)}
                              placeholder={`List item ${itemIndex + 1}`}
                              sx={{ flex: 1 }}
                            />
                            <IconButton size="small" color="error" onClick={() => removeListItem(index, itemIndex)}>
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        ))}
                        <Button size="small" startIcon={<AddIcon />} onClick={() => addListItem(index)}>
                          Add Lable
                        </Button>
                      </Box>

                      {renderQuestionOptions(question, index)}
                      {renderValidatorSection(question, index)}
                      
                      {/* Sub-Questions Section */}
                      {question.children && (
                        <Box sx={{ mt: 1 }}>
                          <Divider sx={{ my: 2 }} />
                          <Box sx={{ backgroundColor: '#e3f2fd', p: 3, borderRadius: 2, border: '2px solid #1976d2' }}>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                              <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                                📋 Sub-Questions (shown when answer is "{question.children}")
                              </Typography>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<AddIcon />}
                                onClick={() => addSubQuestion(index)}
                              >
                                Add Sub-Question
                              </Button>
                            </Box>
                            
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {question.subQuestions?.map((subQuestion, subIndex) => (
                                <Card key={subIndex} sx={{ backgroundColor: 'white', borderRadius: 2, boxShadow: 1 }}>
                                  <CardContent sx={{ p: 3 }}>
                                    <Box display="flex" alignItems="center" marginBottom={2}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                        Sub-Question {subIndex + 1}
                                      </Typography>
                                      <Box flexGrow={1} />
                                      <IconButton
                                        size="medium"
                                        onClick={() => removeSubQuestion(index, subIndex)}
                                        color="error"
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                                      {/* Sub-Question Text */}
                                      <TextField
                                        fullWidth
                                        label="Sub-Question Text"
                                        value={subQuestion.question}
                                        onChange={(e) => updateSubQuestion(index, subIndex, { question: e.target.value })}
                                        required
                                        multiline
                                        rows={2}
                                        variant="outlined"
                                      />
                                      
                                      {/* Sub-Question List Items (ordered list content) */}
                                      <Box sx={{ mt: 1 }}>
                                        <Typography variant="caption" gutterBottom>
                                          Question Lables
                                        </Typography>
                                        {(subQuestion.listItems || []).map((item, itemIndex) => (
                                          <Box key={itemIndex} display="flex" alignItems="center" gap={1} mb={1}>
                                            <TextField
                                              size="small"
                                              label={`Item ${itemIndex + 1}`}
                                              value={item}
                                              onChange={(e) => updateSubQuestionListItem(index, subIndex, itemIndex, e.target.value)}
                                              placeholder={`List item ${itemIndex + 1}`}
                                              sx={{ flex: 1 }}
                                            />
                                            <IconButton size="small" color="error" onClick={() => removeSubQuestionListItem(index, subIndex, itemIndex)}>
                                              <DeleteIcon />
                                            </IconButton>
                                          </Box>
                                        ))}
                                        <Button size="small" startIcon={<AddIcon />} onClick={() => addSubQuestionListItem(index, subIndex)}>
                                          Add Lable
                                        </Button>
                                      </Box>
                                      
                                      {/* Row 1: Sub-Question Number */}
                                      <TextField
                                        fullWidth
                                        label="Sub-Question Number"
                                        value={subQuestion.questionNumber || ''}
                                        onChange={(e) => updateSubQuestion(index, subIndex, { questionNumber: e.target.value })}
                                        placeholder="e.g., 1a, 1b, 2a"
                                        helperText="e.g., 1a, 1b, 2a"
                                      />
                                      
                                      {/* Row 2: Category and Question ID */}
                                      <Box sx={{ display: 'flex', gap: 2 }}>
                                        <FormControl fullWidth required>
                                          <InputLabel>Category/Question Type</InputLabel>
                                          <Select
                                            value={subQuestion.questionType}
                                            onChange={(e) => updateSubQuestion(index, subIndex, { questionType: e.target.value })}
                                            label="Category/Question Type"
                                          >
                                            {categories.map((cat) => (
                                              <MenuItem key={cat._id || cat.name} value={cat.name}>
                                                {cat.name}
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                        
                                        <TextField
                                          fullWidth
                                          label="Question ID"
                                          value={subQuestion.questionId}
                                          onChange={(e) => updateSubQuestion(index, subIndex, { questionId: e.target.value })}
                                          required
                                          placeholder="e.g., health_sub_q1"
                                        />
                                      </Box>
                                      
                                      {/* Row 3: Option Type and Trigger Value */}
                                      <Box sx={{ display: 'flex', gap: 2 }}>
                                        <FormControl fullWidth>
                                          <InputLabel>Option Type</InputLabel>
                                          <Select
                                            value={subQuestion.option_type}
                                            onChange={(e) => updateSubQuestion(index, subIndex, { option_type: e.target.value })}
                                            label="Option Type"
                                          >
                                            {fieldTypes.map((type) => (
                                              <MenuItem key={type.value} value={type.value}>
                                                {type.label}
                                              </MenuItem>
                                            ))}
                                          </Select>
                                        </FormControl>
                                        
                                        <TextField
                                          fullWidth
                                          label="Trigger Value (parent answer)"
                                          value={subQuestion.triggerValue || ''}
                                          onChange={(e) => updateSubQuestion(index, subIndex, { triggerValue: e.target.value })}
                                          placeholder="e.g., salaried"
                                          helperText="Which parent answer shows this sub-question"
                                        />
                                      </Box>
                                      
                                      {renderSubQuestionOptions(question, index, subQuestion, subIndex)}
                                      {renderSubQuestionValidatorSection(question, index, subQuestion, subIndex)}
                                    </Box>
                                  </CardContent>
                                </Card>
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
            ))}
          </Box>

          <Box display="flex" justifyContent="center" marginTop={4}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || questions.length === 0}
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
              {loading ? <CircularProgress size={24} /> : (isEditMode ? '💾 Update Form' : '✨ Create Form')}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default FormBuilder;
