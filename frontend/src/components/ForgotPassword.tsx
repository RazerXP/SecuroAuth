import React, { useState } from 'react';
import api from '../lib/axios';


const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data?.message || 'If an account exists, a reset link has been sent.');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to process request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Forgot Password</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="forgot-email">Email:</label>
          <input
            type="email"
            id="forgot-email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
