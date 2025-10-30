import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../ui/insta/_form.scss';
import BasicDetailsIcon from '../assets/icons/BasicDetailsIcon.svg';
import { useDispatch } from 'react-redux';
import { setUser, setOtpVerified } from '../store/actions';
import api, { userAPI } from '../services/api';
import '../ui/insta/_form.scss';
import { InputField, UiModal } from '../ui/insta/_form';
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
  const [submittingApp, setSubmittingApp] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateMessage, setDuplicateMessage] = useState('');

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
    if (submittingApp) return;
    setError('');
    if (!appNumber || appNumber.trim() === '') {
      setError('Application number is required');
      return;
    }
    setSubmittingApp(true);

    // Check if a submission with this application number and category already exists
    try {
      const checkResp = await api.post('/user/check-duplicate', { 
        appNumber, 
        category 
      });
      
      if (checkResp?.data?.isDuplicate) {
        setDuplicateMessage(checkResp.data.message || 'Questionnaire already submitted with this application number and category');
        setDuplicateDialogOpen(true);
        return;
      }
    } catch (err) {
      // If the endpoint doesn't exist or there's another error, continue with the flow
      console.log('Duplicate check error or endpoint not available:', err);
      // Don't show an error to the user, just continue with the flow
    }

    // default data if lookup returns nothing
    const data = { ...DUMMY_DATA, Appnumber: appNumber };
    setAppData(data);

    try {
      // attempt lookup via backend API using services
      const lookupResp = await userAPI.lookup({ appNumber });
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

      // request backend to send OTP (services)
      const mobileToUse = (dataFromApi?.Mobile || dataFromApi?.mobile || data.Mobile || mobile);
      await userAPI.sendOtp({ mobile: mobileToUse, appNumber });
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
    finally {
      setSubmittingApp(false);
    }
  };

  const verifyOtp = async () => {
    if (verifying) return;
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
      setVerifying(true);
      const mobileToUse = mobile || (appData && (appData.Mobile || appData.mobile || appData.mobileNumber));
      const resp = await userAPI.verifyOtp({ mobile: mobileToUse, otp: code });
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
    } finally { setVerifying(false); }
  };

  // resend OTP (calls backend, falls back to client generation)
  const resendOtp = async () => {
    setError('');
    try {
      setResending(true);
      await userAPI.sendOtp({ mobile, appNumber });
      // reset UI only on success
      setOtpDigits(new Array(6).fill(''));
      setSecondsLeft(120);
      setResendDisabled(true);
    } catch (err) {
      console.error('resend-otp failed', err?.response?.data || err.message || err);
      setError('Failed to resend OTP. Please try again later.');
      return;
    } finally { setResending(false); }
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

  const handleCloseDialog = () => {
    setDuplicateDialogOpen(false);
  };

  const stepTitle = step === 'otp' ? 'OTP' : `${category} - Application`;
  const stepIndex = step === 'otp' ? 'Step 2/3' : 'Step 1/3';

  return (
    <div className="insta-page" style={{ paddingTop: 24 }}>
      {/* Duplicate Submission Dialog */}
      <UiModal isShowing={duplicateDialogOpen} hide={handleCloseDialog}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>Duplicate Submission</div>
        <div style={{ color: 'var(--insta-muted)', marginBottom: 12 }}>{duplicateMessage}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="insta-button btn-outline-primary" onClick={handleCloseDialog}>OK</button>
        </div>
      </UiModal>

      <div className="insta-card" style={{ maxWidth: 900, margin: '0 auto', padding: 24 }}>
        <div className="insta-page-header">
          <div className="insta-header-icon">
            <img src={BasicDetailsIcon} alt="Basic details" style={{ width: 60, height: 60 }} />
          </div>
          <div>
            <div style={{ color: 'var(--insta-muted)', fontWeight: 600 }}>{stepIndex}</div>
            <div className="insta-header-title">{stepTitle}</div>
            <div className="insta-header-sub">{step === 'otp' ? 'Please enter the OTP sent to you' : 'Please enter your application number'}</div>
            <div className="insta-header-underline" />
          </div>
        </div>

        {step === 'lookup' && (
          <div style={{ marginTop: 12 }}>
            <div className="insta-narrow">
              <InputField
                fullWidth
                label="Application Number"
                name="appNumber"
                value={appNumber}
                onChange={(v) => setAppNumber(v)}
                placeholder="Enter application number"
              />

              {error && <div style={{ color: 'var(--insta-red)', marginTop: 8 }}>{error}</div>}

              <div className="desktop-cta" style={{ justifyContent: 'center', marginTop: 12 }}>
                <button className="insta-button" onClick={submitAppNumber} disabled={submittingApp}>
                  {submittingApp ? 'PLEASE WAIT...' : 'NEXT'}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'otp' && (
          <div style={{ marginTop: 12 }}>
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

              <div className="insta-otp-resend">
                {resendDisabled ? (
                  `Resend OTP (in ${Math.max(0, secondsLeft)}s)`
                ) : (
                  <button onClick={resendOtp} disabled={resending} style={{ background: 'transparent', border: 'none', color: 'var(--insta-primary)', fontWeight: 700, cursor: resending ? 'not-allowed' : 'pointer', opacity: resending ? 0.6 : 1 }}>
                    {resending ? 'Resending…' : 'Resend OTP'}
                  </button>
                )}
              </div>

              <div className="desktop-cta" style={{ justifyContent: 'center', marginTop: 14 }}>
                <button className="insta-otp-submit" onClick={verifyOtp} disabled={verifying}>
                  {verifying ? 'SUBMITTING…' : 'SUBMIT'}
                </button>
              </div>

            </div>

            {error && <div style={{ color: 'var(--insta-red)', marginTop: 8, textAlign: 'center' }}>{error}</div>}
          </div>
        )}
      </div>

      {/* Insta footer bar (mobile only via CSS) */}
      {step !== 'form' && (
        <div className="insta-footer">
          {step === 'lookup' && (
            <button className="insta-proceed mobile-cta proceed-btn" onClick={submitAppNumber} disabled={submittingApp}>
              {submittingApp ? 'PLEASE WAIT…' : 'NEXT'}
            </button>
          )}
          {step === 'otp' && (
            <button className="insta-proceed mobile-cta proceed-btn" onClick={verifyOtp} disabled={verifying}>
              {verifying ? 'SUBMITTING…' : 'SUBMIT'}
            </button>
          )}
        </div>
      )}
      {(submittingApp || verifying) && (
        <div className="screen-loader">
          <div className="spinner" />
        </div>
      )}
    </div>
  );
};

export default CategoryEntry;
