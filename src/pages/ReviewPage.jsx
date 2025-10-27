import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Container, Paper, Box, Typography, Button } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import { clearAnswers } from '../store/actions';
import '../ui/insta/_form.scss';
import jsPDF from 'jspdf';

const ReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
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

  // Early exit if no answers found
  if (!answers || Object.keys(answers).length === 0) {
    return (
      <Container sx={{ mt: 6 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h6">No review data found</Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            Go Home
          </Button>
        </Paper>
      </Container>
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
    try {
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
    }
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    let y = 14;
    doc.setFontSize(14);
    doc.text(`Application Number: ${appNumber || ''}`, 14, y);
    y += 8;
    doc.text(`Mobile: ${mobile || ''}`, 14, y);
    y += 12;
    doc.setFontSize(12);
    doc.text(`Category: ${category}`, 14, y);
    y += 10;

    Object.keys(answers || {}).forEach((key, idx) => {
      const q = qMap[key] || key;
      let ans = answers[key];
      if (typeof ans === 'object') ans = JSON.stringify(ans);

      // Question text
      doc.setFontSize(12);
      const questionLine = `${idx + 1}. ${q}`;
      const qSplit = doc.splitTextToSize(questionLine, 180);
      doc.text(qSplit, 14, y);
      y += qSplit.length * 7;

      // Answer text
      doc.setFontSize(11);
      const answerLine = `Answer: ${ans}`;
      const aSplit = doc.splitTextToSize(answerLine, 170);
      const indented = aSplit.map(ln => `  ${ln}`);
      doc.text(indented, 18, y);
      y += aSplit.length * 6 + 6;

      if (y > 270) {
        doc.addPage();
        y = 14;
      }
    });

    doc.save(`${category || 'submission'}-${appNumber || 'unknown'}.pdf`);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper
        elevation={3}
        className="insta-card"
        sx={{ p: { xs: 3, md: 5 }, position: 'relative' }}
      >
        <div className="insta-page-header">
          <div className="insta-header-icon">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="4"
                y="4"
                width="16"
                height="16"
                rx="2"
                stroke="#005e9e"
                strokeWidth="1.2"
                fill="#fff"
              />
              <path
                d="M7 9h10"
                stroke="#005e9e"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M7 13h6"
                stroke="#005e9e"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="insta-header-title">Review your answers</div>
            <div className="insta-header-sub">
              Please verify your information before final submission
            </div>
            <div className="insta-header-underline" />
          </div>
        </div>

        <Box sx={{ mt: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Application Number: <strong>{appNumber}</strong>
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Mobile: <strong>{mobile}</strong>
          </Typography>

          <Box sx={{ mt: 2 }}>
            {Object.keys(answers || {}).map((key, idx) => {
              const qLabel = qMap[key] || key;
              return (
                <Box
                  key={key}
                  sx={{
                    mb: 2,
                    p: 2,
                    border: '1px solid var(--insta-border)',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="subtitle2">{qLabel}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {typeof answers[key] === 'object'
                      ? JSON.stringify(answers[key])
                      : String(answers[key])}
                  </Typography>
                </Box>
              );
            })}
          </Box>

          <Box
            sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}
          >
            <Button variant="outlined" onClick={handleEdit}>
              Edit
            </Button>
            <Button variant="contained" color="secondary" onClick={handleDownload}>
              Download
            </Button>
            <Button variant="contained" color="primary" onClick={handleSubmitFinal}>
              Submit
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ReviewPage;
