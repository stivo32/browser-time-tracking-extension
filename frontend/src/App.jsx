/**
 * Main App Component
 * 
 * Test application for frontend-backend integration
 */

import { RegisterForm } from './components/RegisterForm';
import { LoginForm } from './components/LoginForm';
import { useState } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('register');

  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h1>Browser Time Tracking - Frontend/Backend Test</h1>
        <div style={{ marginTop: '20px' }}>
          <button
            onClick={() => setActiveTab('register')}
            style={{
              padding: '10px 20px',
              margin: '0 5px',
              backgroundColor: activeTab === 'register' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Register
          </button>
          <button
            onClick={() => setActiveTab('login')}
            style={{
              padding: '10px 20px',
              margin: '0 5px',
              backgroundColor: activeTab === 'login' ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Login
          </button>
        </div>
      </div>
      {activeTab === 'register' ? <RegisterForm /> : <LoginForm />}
    </div>
  );
}

export default App;
