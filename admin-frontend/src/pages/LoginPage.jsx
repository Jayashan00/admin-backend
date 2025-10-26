import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // To redirect after login
import { loginUser, storeToken } from '../services/authService';
import './LoginPage.css'; // We'll create this CSS file

function LoginPage({ onLoginSuccess }) { // Receive prop to update App state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await loginUser({ username, password });
      if (response.data && response.data.token) {
        storeToken(response.data.token); // Store token in localStorage
        onLoginSuccess(); // Notify App component that login was successful
        navigate('/'); // Redirect to dashboard
      } else {
        setError('Login failed: No token received.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.status === 401) {
        setError('Incorrect username or password.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Admin Login</h2>
        {error && <p className="login-error">{error}</p>}
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
         {/* Optional: Add a link to a registration page if needed */}
         {/* <p>Don't have an account? <Link to="/register">Register</Link></p> */}
      </form>
    </div>
  );
}

export default LoginPage;