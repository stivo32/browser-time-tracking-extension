/**
 * Login Form Component
 * 
 * Simple form for user login to test backend connection
 */

import { useState } from 'react';
import { login, getCurrentUser } from '../api/auth';

export function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await login(formData);
      setSuccess(`Login successful! Welcome, ${response.user.email}`);
      setFormData({ email: '', password: '' });
      
      // Fetch current user to verify session
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGetUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setSuccess('User data fetched successfully!');
    } catch (err) {
      setError(err.message || 'Failed to get user');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '20px auto', padding: '20px' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>
            Email:
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>
            Password:
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </label>
        </div>
        {error && (
          <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>
        )}
        {success && (
          <div style={{ color: 'green', marginBottom: '10px' }}>{success}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginBottom: '10px',
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
        <button
          type="button"
          onClick={handleGetUser}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Get Current User
        </button>
      </form>
      {user && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <h3>Current User:</h3>
          <pre style={{ fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
