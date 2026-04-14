import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const API_BASE = 'http://localhost:8000';

export default function Login({ setAuthAction }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      if (isLogin) {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        
        const res = await axios.post(`${API_BASE}/login`, formData, {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        setAuthAction(res.data.access_token);
      } else {
        await axios.post(`${API_BASE}/register`, { username, password });
        setIsLogin(true);
        setUsername('');
        setPassword('');
        setSuccess('Account created successfully! Please sign in.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-header">{isLogin ? 'Sign In' : 'Create Account'}</h2>
        
        {error && <div className="dialogue error-dialogue">{error}</div>}
        {success && <div className="dialogue success-dialogue">{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
              placeholder="Enter your username"
            />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" className="submit-btn mt-2">
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        
        <p className="toggle-mode">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={toggleMode}>
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}