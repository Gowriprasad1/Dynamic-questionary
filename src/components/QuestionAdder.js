import React, { useState } from 'react';
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
  ExpandMore as ExpandMoreIcon,
  CheckCircle as ValidationIcon,
} from '@mui/icons-material';

const QuestionAdder = ({ category, onQuestionAdded, onCancel }) => {
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
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSubQuestionForm, setShowSubQuestionForm] = useState(false);
  const [currentSubQuestion, setCurrentSubQuestion] = useState(null);

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
    };
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
              onChange={(e) => updateOption(optionIndex, 'key', e.target.value)}
              placeholder={`Option key ${optionIndex + 1}`}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="Value"
              value={option.val}
              onChange={(e) => updateOption(optionIndex, 'val', e.target.value)}
              placeholder={`Option value ${optionIndex + 1}`}
              sx={{ flex: 1 }}
            />
            <IconButton
              size="small"
              onClick={() => removeOption(optionIndex)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addOption}
        >
          Add Option
        </Button>
      </Box>
    );
  };

  const renderValidatorSection = () => {
    return (
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <ValidationIcon />
            <Typography>Validation Rules</Typography>
            <Box display="flex" gap={0.5}>
              {question.validator_options?.map((option) => (
                <Chip key={option} label={option} size="small" color="primary" />
              ))}
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Validator Options Selection */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Select Validators:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {validatorTypes.map((validatorType) => (
                  <Chip
                    key={validatorType}
                    label={validatorType}
                    size="small"
                    onClick={() => toggleValidatorOption(validatorType)}
                    color={question.validator_options?.includes(validatorType) ? 'primary' : 'default'}
                    variant={question.validator_options?.includes(validatorType) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>

            {/* Validator Values */}
            {question.validator_options?.map((validatorType) => (
              <Box key={validatorType}>
                <Typography variant="caption" gutterBottom display="block">
                  {validatorType.charAt(0).toUpperCase() + validatorType.slice(1)} Validator:
                </Typography>
                <Box display="flex" gap={1}>
                  <TextField
                    size="small"
                    label={`${validatorType} value`}
                    value={question.validator_values[validatorType] || ''}
                    onChange={(e) => updateValidatorValue(validatorType, e.target.value)}
                    type={['max', 'min', 'maxLength', 'minLength'].includes(validatorType) ? 'number' : 'text'}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="Error message"
                    value={question.error_messages[validatorType] || ''}
                    onChange={(e) => updateErrorMessage(validatorType, e.target.value)}
                    sx={{ flex: 1 }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderSubQuestionOptions = () => {
    if (!currentSubQuestion || !['select', 'radio', 'checkbox'].includes(currentSubQuestion.option_type)) {
      return null;
    }

    return (
      <Box sx={{ marginTop: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Options:
        </Typography>
        {currentSubQuestion.options?.map((option, optionIndex) => (
          <Box key={optionIndex} display="flex" alignItems="center" marginBottom={1} gap={1}>
            <TextField
              size="small"
              label="Key"
              value={option.key}
              onChange={(e) => updateSubQuestionOption(optionIndex, 'key', e.target.value)}
              placeholder={`Option key ${optionIndex + 1}`}
              sx={{ flex: 1 }}
            />
            <TextField
              size="small"
              label="Value"
              value={option.val}
              onChange={(e) => updateSubQuestionOption(optionIndex, 'val', e.target.value)}
              placeholder={`Option value ${optionIndex + 1}`}
              sx={{ flex: 1 }}
            />
            <IconButton
              size="small"
              onClick={() => removeSubQuestionOption(optionIndex)}
              color="error"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={addSubQuestionOption}
        >
          Add Option
        </Button>
      </Box>
    );
  };

  const renderSubQuestionValidatorSection = () => {
    if (!currentSubQuestion) return null;

    return (
      <Accordion sx={{ mt: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <ValidationIcon />
            <Typography variant="body2">Validation Rules</Typography>
            <Box display="flex" gap={0.5}>
              {currentSubQuestion.validator_options?.map((option) => (
                <Chip key={option} label={option} size="small" color="primary" />
              ))}
            </Box>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Validator Options Selection */}
            <Box>
              <Typography variant="caption" gutterBottom display="block">
                Select Validators:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {validatorTypes.map((validatorType) => (
                  <Chip
                    key={validatorType}
                    label={validatorType}
                    size="small"
                    onClick={() => toggleSubQuestionValidatorOption(validatorType)}
                    color={currentSubQuestion.validator_options?.includes(validatorType) ? 'primary' : 'default'}
                    variant={currentSubQuestion.validator_options?.includes(validatorType) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>

            {/* Validator Values */}
            {currentSubQuestion.validator_options?.map((validatorType) => (
              <Box key={validatorType}>
                <Typography variant="caption" gutterBottom display="block">
                  {validatorType.charAt(0).toUpperCase() + validatorType.slice(1)} Validator:
                </Typography>
                <Box display="flex" gap={1}>
                  <TextField
                    size="small"
                    label={`${validatorType} value`}
                    value={currentSubQuestion.validator_values[validatorType] || ''}
                    onChange={(e) => updateSubQuestionValidatorValue(validatorType, e.target.value)}
                    type={['max', 'min', 'maxLength', 'minLength'].includes(validatorType) ? 'number' : 'text'}
                    sx={{ flex: 1 }}
                  />
                  <TextField
                    size="small"
                    label="Error message"
                    value={currentSubQuestion.error_messages[validatorType] || ''}
                    onChange={(e) => updateSubQuestionErrorMessage(validatorType, e.target.value)}
                    sx={{ flex: 1 }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  };

  const renderSubQuestionsSection = () => {
    if (!question.children) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          Set a trigger value in the "Children" field above to enable adding sub-questions.
        </Alert>
      );
    }

    return (
      <Box sx={{ mt: 2, p: 2, border: '2px solid #1976d2', borderRadius: 2, backgroundColor: '#f5f5f5' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" color="primary">
              Child Questions
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Possible trigger values: {question.children}
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={addSubQuestion}
            disabled={showSubQuestionForm}
          >
            Add Child Question
          </Button>
        </Box>

        {/* List existing sub-questions */}
        {question.subQuestions.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Existing Child Questions:
            </Typography>
            {question.subQuestions.map((subQ, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  mb: 1,
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  backgroundColor: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight="600">
                    {subQ.questionNumber ? `${subQ.questionNumber}. ` : ''}{subQ.question}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {subQ.questionId} | Type: {subQ.option_type}
                    {subQ.triggerValue && ` | Trigger: "${subQ.triggerValue}"`}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => removeSubQuestion(index)}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {/* Sub-question form */}
        {showSubQuestionForm && currentSubQuestion && (
          <Paper elevation={2} sx={{ p: 2, backgroundColor: 'white' }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="600">
              New Child Question
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Child Question Text"
                value={currentSubQuestion.question}
                onChange={(e) => updateSubQuestion({ question: e.target.value })}
                required
                multiline
                rows={2}
                size="small"
              />

              <TextField
                fullWidth
                label="Sub-Question Number"
                value={currentSubQuestion.questionNumber || ''}
                onChange={(e) => updateSubQuestion({ questionNumber: e.target.value })}
                size="small"
                placeholder="e.g., 1a, 1b, 2a"
                helperText="e.g., 1a, 1b, 2a"
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label="Question ID"
                  value={currentSubQuestion.questionId}
                  onChange={(e) => updateSubQuestion({ questionId: e.target.value })}
                  required
                  size="small"
                  placeholder="e.g., health_sub_q1"
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Option Type</InputLabel>
                  <Select
                    value={currentSubQuestion.option_type}
                    onChange={(e) => updateSubQuestion({ option_type: e.target.value })}
                    label="Option Type"
                  >
                    {fieldTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <TextField
                fullWidth
                label="Trigger Value (parent answer)"
                value={currentSubQuestion.triggerValue || ''}
                onChange={(e) => updateSubQuestion({ triggerValue: e.target.value })}
                size="small"
                placeholder="e.g., yes, salaried"
                helperText="Which parent answer shows this sub-question"
              />

              {renderSubQuestionOptions()}
              {renderSubQuestionValidatorSection()}

              <Box display="flex" justifyContent="flex-end" gap={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={cancelSubQuestion}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={saveSubQuestion}
                >
                  Save Child Question
                </Button>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    );
  };

  return (
    <Paper elevation={3} sx={{ padding: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Add New {category} Question
      </Typography>

      {error && (
        <Alert severity="error" sx={{ marginBottom: 3 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Question Text */}
          <TextField
            fullWidth
            label="Question Text"
            value={question.question}
            onChange={(e) => updateQuestion({ question: e.target.value })}
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
            onChange={(e) => updateQuestion({ questionNumber: e.target.value })}
            placeholder="e.g., 1, 2, 3"
            helperText="Display number (e.g., 1, 2, 3)"
          />

          {/* Row 2: Category and Question ID */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Category/Question Type</InputLabel>
              <Select
                value={question.questionType}
                onChange={(e) => updateQuestion({ questionType: e.target.value })}
                label="Category/Question Type"
              >
                <MenuItem value="Health">Health</MenuItem>
                <MenuItem value="Travel">Travel</MenuItem>
                <MenuItem value="Occupation">Occupation</MenuItem>
                <MenuItem value="Avocation">Avocation</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Question ID (unique identifier)"
              value={question.questionId}
              onChange={(e) => updateQuestion({ questionId: e.target.value })}
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
                onChange={(e) => updateQuestion({ option_type: e.target.value })}
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
              onChange={(e) => updateQuestion({ children: e.target.value })}
              placeholder="e.g., yes, no, salaried"
              helperText="Comma-separated answers that can trigger sub-questions (e.g., 'yes,no')"
            />
          </Box>

          {renderQuestionOptions()}
          {renderValidatorSection()}
          {renderSubQuestionsSection()}

          <Box display="flex" justifyContent="flex-end" gap={2} marginTop={2}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Add Question'}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default QuestionAdder;
