import React from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import './App.css';

type AuthView = 'login' | 'signup' | 'forgot' | 'reset';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [view, setView] = React.useState<AuthView>('login');
  const [resetToken, setResetToken] = React.useState('');

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedView = params.get('view');
    const token = params.get('token') || '';

    if (requestedView === 'reset' && token) {
      setView('reset');
      setResetToken(token);
    }
  }, []);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="app">
      <h1>Secure Authentication System</h1>
      <div className="auth-container">
        {view === 'login' && <Login onForgotPassword={() => setView('forgot')} />}
        {view === 'signup' && <Signup />}
        {view === 'forgot' && <ForgotPassword />}
        {view === 'reset' && <ResetPassword token={resetToken} />}

        {(view === 'login' || view === 'signup') && (
          <button
            className="toggle-button"
            onClick={() => setView(view === 'login' ? 'signup' : 'login')}
          >
            {view === 'login' ? 'Need an account? Sign up' : 'Already have an account? Login'}
          </button>
        )}

        {(view === 'forgot' || view === 'reset') && (
          <button className="toggle-button" onClick={() => setView('login')}>
            Back to login
          </button>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
