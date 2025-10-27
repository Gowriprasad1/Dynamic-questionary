import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Paper, Typography, Button } from '@mui/material';
import { useDispatch } from 'react-redux';
import { setUser, setOtpVerified } from '../store/actions';
import axios from 'axios';
import '../ui/insta/_form.scss';
import { InputField } from '../ui/insta/_form';
import UserForm from './UserForm';

const DUMMY_DATA = {
  Name: 'HariPrasad',
  Appnumber: '987654321',
  Mobile: '8688520261',
  Gender: 'Male',
  dob: '14/06/2001'
};

function formatMobile(m) {
  if (!m) return '';
  return m.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3');
}

const CategoryEntry = () => {
  const { category } = useParams();
  const [step, setStep] = useState('lookup'); // lookup, otp, form
  const [appNumber, setAppNumber] = useState('');
  const [appData, setAppData] = useState(null);
  const [mobile, setMobile] = useState('');
  const [otpDigits, setOtpDigits] = useState(new Array(6).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [error, setError] = useState('');

  const dispatch = useDispatch();

  useEffect(() => {
    // reset when category changes
    setStep('lookup');
    setAppNumber('');
    setAppData(null);
    setMobile('');
    setError('');
  }, [category]);

  const submitAppNumber = async () => {
    setError('');
    if (!appNumber || appNumber.trim() === '') {
      setError('Application number is required');
      return;
    }

    // default data if lookup returns nothing
    const data = { ...DUMMY_DATA, Appnumber: appNumber };
    setAppData(data);

    try {
      // attempt lookup via backend API (POST /api/user/lookup)
      const lookupResp = await axios.post('http://localhost:5000/api/user/lookup', { appNumber });
        const dataFromApi = lookupResp?.data || null;
        if (dataFromApi) {
          // normalize response and store in redux
          const userObj = {
            Name: dataFromApi.Name || dataFromApi.name || '',
            Appnumber: dataFromApi.Appnumber || dataFromApi.appNumber || dataFromApi.applicationNumber || appNumber,
            Mobile: dataFromApi.Mobile || dataFromApi.mobile || dataFromApi.mobileNumber || '',
            Gender: dataFromApi.Gender || dataFromApi.gender || '',
            dob: dataFromApi.dob || dataFromApi.DOB || ''
          };
          setAppData(userObj);
          setMobile(userObj.Mobile);
          dispatch(setUser(userObj));
        } else {
          setAppData(data);
          setMobile(data.Mobile);
          dispatch(setUser({
            Name: data.Name,
            Appnumber: data.Appnumber,
            Mobile: data.Mobile,
          }));
        }

      // request backend to send OTP (POST /api/user/send-otp)
      const mobileToUse = (dataFromApi?.Mobile || dataFromApi?.mobile || data.Mobile || mobile);
      await axios.post('http://localhost:5000/api/user/send-otp', { mobile: mobileToUse, appNumber });
      // backend will handle generation; update mobile state and proceed
      setMobile(mobileToUse);
      // initialize otp UI and timer only on successful send
      setOtpDigits(new Array(6).fill(''));
      setSecondsLeft(120);
      setResendDisabled(true);
      setStep('otp');
    } catch (err) {
      console.error('submitAppNumber error', err?.response?.data || err.message || err);
      setError('Lookup or send OTP failed. Please try again later.');
      return;
    }
  };

  const verifyOtp = async () => {
    setError('');
    let code = otpDigits.join('');
    // fallback: if state array not fully populated (race), read values from DOM inputs
    if (code.length !== 6 || code.includes('')) {
      const inputs = Array.from(document.querySelectorAll('input[id^="otp-"]'));
      const domCode = inputs.map(i => (i.value || '').toString().trim()).join('');
      if (domCode.length === 6 && !domCode.includes('')) {
        code = domCode;
      }
  }
  console.log('Verifying OTP, entered code=', code);
    if (code.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    // Try backend verification first
    try {
      const mobileToUse = mobile || (appData && (appData.Mobile || appData.mobile || appData.mobileNumber));
      const resp = await axios.post('http://localhost:5000/api/user/verify-otp', { mobile: mobileToUse, otp: code });
      console.log('verify response:', resp && resp.data);
      if (resp?.data?.success) {
        // mark verified in redux and proceed
        dispatch(setOtpVerified(true));
        setStep('form');
        return;
      }
      // if backend responds with failure, show message
      setError(resp?.data?.message || 'OTP verification failed');
    } catch (err) {
      // log detailed error; no client-side fallback
      console.error('verifyOtp error response:', err?.response?.data || err.message || err);
      setError(err?.response?.data?.message || 'Invalid OTP');
    }
  };

  // resend OTP (calls backend, falls back to client generation)
  const resendOtp = async () => {
    setError('');
    try {
      await axios.post('http://localhost:5000/api/user/send-otp', { mobile, appNumber });
      // reset UI only on success
      setOtpDigits(new Array(6).fill(''));
      setSecondsLeft(120);
      setResendDisabled(true);
    } catch (err) {
      console.error('resend-otp failed', err?.response?.data || err.message || err);
      setError('Failed to resend OTP. Please try again later.');
      return;
    }
  };

  useEffect(() => {
    let timer;
    if (secondsLeft > 0) {
      timer = setInterval(() => setSecondsLeft(s => s - 1), 1000);
      setResendDisabled(true);
    } else {
      setResendDisabled(false);
    }
    return () => clearInterval(timer);
  }, [secondsLeft]);

  // focus first OTP input when OTP step is active
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        const el = document.getElementById('otp-0');
        if (el) el.focus();
      }, 80);
    }
  }, [step]);

  if (step === 'form') {
    // render the existing UserForm but pass category, appNumber and mobile so it can save/review
    return <UserForm category={category} appNumber={appNumber} mobile={mobile} />;
  }

  return (
    <Box maxWidth="900px" margin="0 auto" padding={3}>
      <Paper elevation={3} sx={{ padding: 4 }} className="insta-card">
        <div className="insta-page-header">
          <div className="insta-header-icon">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="16" rx="2" stroke="#005e9e" strokeWidth="1.2" fill="#fff"/><path d="M7 9h10" stroke="#005e9e" strokeWidth="1.2" strokeLinecap="round"/><path d="M7 13h6" stroke="#005e9e" strokeWidth="1.2" strokeLinecap="round"/></svg>
          </div>
          <div>
            <div className="insta-header-title">{category} - Application</div>
            <div className="insta-header-sub">Please enter your application number</div>
            <div className="insta-header-underline" />
          </div>
        </div>

        {step === 'lookup' && (
          <Box sx={{ mt: 3 }}>
            <InputField
              fullWidth
              label="Application Number"
              name="appNumber"
              value={appNumber}
              onChange={(v) => setAppNumber(v)}
              placeholder="Enter application number"
            />

            {error && <div style={{ color: '#d32f2f', marginTop: 8 }}>{error}</div>}

            <Box display="flex" justifyContent="center" mt={3}>
              <button className="insta-button" onClick={submitAppNumber}>NEXT</button>
            </Box>
          </Box>
        )}

        {step === 'otp' && (
          <Box sx={{ mt: 3 }}>
            <div className="insta-otp-panel">
              <div className="insta-otp-title">Please enter the One-Time-Password sent to your mobile number.</div>
              <div className="insta-otp-sub">Your OTP is valid for 2 minutes</div>

              <div style={{ textAlign: 'center', marginBottom: 8, color: '#666' }}>Mobile Number: {formatMobile(mobile)}</div>
              <div className="insta-otp-row">
                {otpDigits.map((d, i) => (
                  <input
                      key={i}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={d}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        if (!val) return;
                        const next = [...otpDigits];
                        next[i] = val[val.length - 1];
                        setOtpDigits(next);
                        // focus next
                        const nextInput = document.getElementById(`otp-${i+1}`);
                        if (nextInput) nextInput.focus();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Backspace') {
                          e.preventDefault();
                          const prev = [...otpDigits];
                          if (prev[i]) {
                            prev[i] = '';
                            setOtpDigits(prev);
                          } else if (i > 0) {
                            const prevInput = document.getElementById(`otp-${i-1}`);
                            if (prevInput) prevInput.focus();
                            prev[i-1] = '';
                            setOtpDigits(prev);
                          }
                        } else if (e.key === 'ArrowLeft' && i > 0) {
                          const prevInput = document.getElementById(`otp-${i-1}`);
                          if (prevInput) prevInput.focus();
                        } else if (e.key === 'ArrowRight' && i < 5) {
                          const nextInput = document.getElementById(`otp-${i+1}`);
                          if (nextInput) nextInput.focus();
                        }
                      }}
                      id={`otp-${i}`}
                      className="insta-otp-input"
                      onPaste={(e) => {
                        e.preventDefault();
                        const paste = (e.clipboardData || window.clipboardData).getData('text').trim();
                        if (/^\d{6}$/.test(paste)) {
                          const arr = paste.split('');
                          setOtpDigits(arr);
                          // focus last
                          const last = document.getElementById('otp-5');
                          if (last) last.focus();
                        }
                      }}
                  />
                ))}
              </div>

              <div className="insta-otp-resend">{resendDisabled ? `Resend OTP (in ${Math.max(0, secondsLeft)}s)` : 'You can resend the OTP now'}</div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 14 }}>
                <button className="insta-otp-submit" onClick={verifyOtp}>SUBMIT</button>
                <button
                  onClick={resendOtp}
                  disabled={resendDisabled}
                  style={{
                    background: resendDisabled ? '#f0f0f0' : '#fff',
                    color: resendDisabled ? '#999' : 'var(--insta-primary)',
                    border: '1px solid var(--insta-primary)',
                    padding: '10px 18px',
                    borderRadius: 20,
                    cursor: resendDisabled ? 'not-allowed' : 'pointer'
                  }}
                >
                  {resendDisabled ? `Resend OTP (${Math.max(0, secondsLeft)}s)` : 'Resend OTP'}
                </button>
              </div>

            </div>

            {error && <div style={{ color: '#d32f2f', marginTop: 8, textAlign: 'center' }}>{error}</div>}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default CategoryEntry;
