import React, { useState } from 'react';
import api from '../lib/axios';

interface ResetPasswordProps {
  token: string;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ token }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!token) {
      setError('Reset token is missing');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword,
      });
      setMessage(response.data?.message || 'Password reset successful');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="new-password">New Password:</label>
          <input
            type="password"
            id="new-password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="confirm-new-password">Confirm New Password:</label>
          <input
            type="password"
            id="confirm-new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;
