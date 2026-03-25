import React from 'react';
import { useAuth } from './AuthContext';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      {user && (
        <div>
          <p>Welcome, {user.email}!</p>
          <p>User ID: {user.id}</p>
          <p>Access Token: {localStorage.getItem('accessToken') ? 'Present' : 'None'}</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;