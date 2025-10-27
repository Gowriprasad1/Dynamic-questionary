const initialState = {
  user: null, // { Name, Appnumber, Mobile, Gender, dob, applicationNumber }
  otpVerified: false,
  questions: [],
  answers: {}, // questionId -> value
  category: null,
};

export const actionTypes = {
  SET_USER: 'SET_USER',
  SET_OTP_VERIFIED: 'SET_OTP_VERIFIED',
  SET_QUESTIONS: 'SET_QUESTIONS',
  SET_CATEGORY: 'SET_CATEGORY',
  SET_ANSWER: 'SET_ANSWER',
  SET_ALL_ANSWERS: 'SET_ALL_ANSWERS',
  CLEAR_ANSWERS: 'CLEAR_ANSWERS',
};

export default function reducer(state = initialState, action) {
  switch (action.type) {
    case actionTypes.SET_USER:
      return { ...state, user: action.payload };
    case actionTypes.SET_OTP_VERIFIED:
      return { ...state, otpVerified: !!action.payload };
    case actionTypes.SET_QUESTIONS:
      return { ...state, questions: action.payload || [] };
    case actionTypes.SET_CATEGORY:
      return { ...state, category: action.payload || null };
    case actionTypes.SET_ANSWER:
      return { ...state, answers: { ...state.answers, [action.payload.questionId]: action.payload.value } };
    case actionTypes.SET_ALL_ANSWERS:
      return { ...state, answers: action.payload || {} };
    case actionTypes.CLEAR_ANSWERS:
      return { ...state, answers: {} };
    default:
      return state;
  }
}
