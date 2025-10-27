import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CategoryEntry from './CategoryEntry';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';

jest.mock('axios');

describe('CategoryEntry flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('lookup -> otp -> paste OTP -> verify', async () => {
    // mock lookup and send-otp and verify-otp
    axios.post.mockImplementation((url, data) => {
      if (url.endsWith('/api/user/lookup') || url === 'http://localhost:5000/api/user/lookup') {
        return Promise.resolve({ data: { Name: 'Test', Appnumber: data.appNumber, Mobile: '8688520261' } });
      }
      if (url.endsWith('/api/user/send-otp') || url === 'http://localhost:5000/api/user/send-otp') {
        return Promise.resolve({ data: { success: true } });
      }
      if (url.endsWith('/api/user/verify-otp') || url === 'http://localhost:5000/api/user/verify-otp') {
        return Promise.resolve({ data: { success: true } });
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <MemoryRouter initialEntries={["/Health"]}>
        <Routes>
          <Route path="/:category" element={<CategoryEntry />} />
        </Routes>
      </MemoryRouter>
    );

  // Enter application number (select by placeholder)
  const appInput = screen.getByPlaceholderText(/Enter application number/i);
  fireEvent.change(appInput, { target: { value: '12345' } });

    const nextBtn = screen.getByRole('button', { name: /NEXT/i });
    fireEvent.click(nextBtn);

    // Wait for OTP inputs to appear
    await waitFor(() => expect(screen.getByText(/Your OTP is valid for 2 minutes/i)).toBeInTheDocument());

    const firstOtp = screen.getByRole('textbox', { name: '', hidden: true }) || screen.getByDisplayValue('');
    // Instead of querying by role, paste into the first otp input via querySelector
    const otpInputs = document.querySelectorAll('input[id^="otp-"]');
    expect(otpInputs.length).toBe(6);

    // Simulate paste of 6 digits into first input
    fireEvent.paste(otpInputs[0], { clipboardData: { getData: () => '123456' } });

    // Verify inputs are filled
    await waitFor(() => {
      const values = Array.from(otpInputs).map(i => i.value).join('');
      expect(values).toBe('123456');
    });

    // Click submit
    const submitBtn = screen.getByRole('button', { name: /SUBMIT/i });
    fireEvent.click(submitBtn);

    // verify that verify-otp was called
    await waitFor(() => expect(axios.post).toHaveBeenCalledWith('http://localhost:5000/api/user/verify-otp', expect.objectContaining({ otp: '123456' })));
  }, 20000);
});
