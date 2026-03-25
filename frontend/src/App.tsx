import React from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import Login from './components/Login';
import Signup from './components/Signup';
import Dashboard from './components/Dashboard';
import './App.css';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [isLogin, setIsLogin] = React.useState(true);

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
        {isLogin ? <Login /> : <Signup />}
        <button
          className="toggle-button"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? 'Need an account? Sign up' : 'Already have an account? Login'}
        </button>
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
