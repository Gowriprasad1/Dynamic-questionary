import { actionTypes } from './reducer';

export const setUser = (user) => ({ type: actionTypes.SET_USER, payload: user });
export const setOtpVerified = (flag) => ({ type: actionTypes.SET_OTP_VERIFIED, payload: flag });
export const setQuestions = (questions) => ({ type: actionTypes.SET_QUESTIONS, payload: questions });
export const setCategory = (category) => ({ type: actionTypes.SET_CATEGORY, payload: category });
export const setAnswer = (questionId, value) => ({ type: actionTypes.SET_ANSWER, payload: { questionId, value } });
export const setAllAnswers = (answers) => ({ type: actionTypes.SET_ALL_ANSWERS, payload: answers });
export const clearAnswers = () => ({ type: actionTypes.CLEAR_ANSWERS });
