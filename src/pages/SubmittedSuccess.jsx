import React from 'react';
import '../ui/insta/_form.scss';

const SubmittedSuccess = () => {
  return (
    <div className="insta-page" style={{ paddingTop: 24 }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
        <div className="insta-card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: 'var(--insta-primary)' }}>
            Submitted Successfully
          </div>
          <div style={{ color: 'var(--insta-muted)', marginBottom: 4 }}>
            Your responses have been submitted.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmittedSuccess;
