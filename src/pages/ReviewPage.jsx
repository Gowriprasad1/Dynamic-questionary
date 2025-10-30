import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { clearAnswers } from '../store/actions';
import '../ui/insta/_form.scss';
import BasicDetailsIcon from '../assets/icons/BasicDetailsIcon.svg';

const ReviewPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [submitting, setSubmitting] = useState(false);
  const reduxAnswers = useSelector(state => state.answers || {});
  const reduxUser = useSelector(state => state.user || {});
  const reduxQuestions = useSelector(state => state.questions || []);
  const category = useSelector(state => state.category) || reduxUser?.category || 'Unknown';
  const answers = reduxAnswers;
  const appNumber =
    reduxUser?.Appnumber ||
    reduxUser?.AppNumber ||
    reduxUser?.applicationNumber ||
    '';
  const mobile = reduxUser?.Mobile || '';
  // Handle browser back button to navigate to category page
  useEffect(() => {
    const handlePopState = () => {
      navigate(`/${category}`);
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [category, navigate]);

  // Early exit if no answers found
  if (!answers || Object.keys(answers).length === 0) {
    return (
      <div className="insta-page" style={{ paddingTop: 24 }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '16px' }}>
          <div className="insta-card" style={{ padding: 24 }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>No review data found</div>
            <button className="insta-button" onClick={() => navigate('/')}>Go Home</button>
            {submitting && (
        <div className="screen-loader">
          <div className="spinner" />
        </div>
      )}
    </div>
        </div>
      </div>
    );
  }

  // ✅ Build a global lookup map from questionId -> question text
  const qMap = {};
  (reduxQuestions || []).forEach(q => {
    if (q && q.questionId) qMap[q.questionId] = q.question;
    if (q && Array.isArray(q.subQuestions)) {
      q.subQuestions.forEach(sq => {
        if (sq && sq.questionId) qMap[sq.questionId] = sq.question;
      });
    }
  });

  const handleEdit = () => {
    navigate(`/${category}/form`);
  };

  const handleSubmitFinal = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      // Transform answers from object to array of objects with question, answer, and questionId
      const answersArray = Object.entries(answers || {}).map(([questionId, answer]) => {
        return {
          question: qMap[questionId] || questionId,
          answer: answer,
          questionId: questionId
        };
      });

      const resp = await fetch('http://localhost:5000/api/user/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          appNumber, 
          mobile, 
          category, 
          answers: answersArray 
        }),
      });
      const data = await resp.json();
      if (resp.ok) {
        dispatch(clearAnswers());
        navigate('/submitted');
      } else {
        alert(data.message || 'Failed to submit');
      }
    } catch (err) {
      console.error('submit final error', err);
      alert('Failed to submit. Please try again later.');
    } finally { setSubmitting(false); }
  };

  // Edit function moved to icon in top right corner

  return (
    <div className="insta-page" style={{ paddingTop: 24 }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '16px' }}>
        <div className="insta-card" style={{ padding: 24 }}>

          <div className="insta-page-header">
            <div className="insta-header-icon">
              <img src={BasicDetailsIcon} alt="Basic details" style={{ width: 60, height: 60 }} />
            </div>
            <div>
              <div className="insta-header-title">Review your answers</div>
              <div className="insta-header-sub">Please verify your information before final submission</div>
              <div className="insta-header-underline" />
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <div>
                Application Number: <strong>{appNumber}</strong>
              </div>
              <button className="insta-edit-chip" onClick={handleEdit} aria-label="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" stroke="currentColor" fill="currentColor"/>
                  <path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/>
                </svg>
                Edit
              </button>
            </div>
            <div style={{ marginBottom: 12 }}>
              Mobile: <strong>{mobile}</strong>
            </div>

            <div style={{ marginTop: 8 }}>
              {Object.keys(answers || {}).map((key) => {
                const qLabel = qMap[key] || key;
                return (
                  <div
                    key={key}
                    style={{
                      marginBottom: 12,
                      padding: 12,
                      border: '1px solid var(--insta-border)',
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>{qLabel}</div>
                    <div style={{ color: 'var(--insta-muted)' }}>
                      {typeof answers[key] === 'object'
                        ? JSON.stringify(answers[key])
                        : String(answers[key])}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="desktop-cta" style={{ justifyContent: 'center', marginTop: 16 }}>
              <button className="insta-button" onClick={handleSubmitFinal} disabled={submitting}>
                {submitting ? 'SUBMITTING...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile-only footer CTA */}
      <div className="insta-footer">
        <button className="insta-proceed mobile-cta proceed-btn" onClick={handleSubmitFinal} disabled={submitting}>
          {submitting ? 'SUBMITTING...' : 'PROCEED'}
        </button>
      </div>
    </div>
  );
};

export default ReviewPage;
