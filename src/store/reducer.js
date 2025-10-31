function loadJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}

const initialState = {
  user: loadJSON('insta_user') || null, // { Name, Appnumber, Mobile, Gender, dob, applicationNumber }
  otpVerified: false,
  questions: [],
  answers: loadJSON('insta_answers') || {}, // questionId -> value
  category: loadJSON('insta_category') || null,
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
      try { localStorage.setItem('insta_user', JSON.stringify(action.payload || null)); } catch (_) {}
      return { ...state, user: action.payload };
    case actionTypes.SET_OTP_VERIFIED:
      return { ...state, otpVerified: !!action.payload };
    case actionTypes.SET_QUESTIONS:
      return { ...state, questions: action.payload || [] };
    case actionTypes.SET_CATEGORY:
      try { localStorage.setItem('insta_category', JSON.stringify(action.payload || null)); } catch (_) {}
      return { ...state, category: action.payload || null };
    case actionTypes.SET_ANSWER: {
      const nextAnswers = { ...state.answers, [action.payload.questionId]: action.payload.value };
      try { localStorage.setItem('insta_answers', JSON.stringify(nextAnswers)); } catch (_) {}
      return { ...state, answers: nextAnswers };
    }
    case actionTypes.SET_ALL_ANSWERS: {
      const payload = action.payload || {};
      try { localStorage.setItem('insta_answers', JSON.stringify(payload)); } catch (_) {}
      return { ...state, answers: payload };
    }
    case actionTypes.CLEAR_ANSWERS:
      try { localStorage.removeItem('insta_answers'); } catch (_) {}
      return { ...state, answers: {} };
    default:
      return state;
  }
}
