

import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
// FIX: Import User type
import { User } from './types';
import { authService } from './services/authService';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("Gagal memeriksa sesi pengguna:", error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      {!currentUser ? (
        <>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      ) : (
        <>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/*" element={<Dashboard user={currentUser} onLogout={handleLogout} />} />
        </>
      )}
    </Routes>
  );
};

export default App;