import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Global Instainsure-inspired form styles (Poppins font + controls)
import './ui/insta/_form.scss';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);