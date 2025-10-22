import React, { useState, useEffect, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
// FIX: Import User type
import { User } from './types';
import { authService } from './services/authService';
import { ErrorBoundary, LoadingSkeleton } from './components/ui/ErrorBoundary';
import { useRealtimeNotifications } from './services/realtimeService';

const LoginPage = React.lazy(() => import('./components/LoginPage'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Enable realtime notifications for logged-in users
  useRealtimeNotifications(currentUser?.id || null, currentUser?.schoolId || null);

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
    toast.success(`Selamat datang, ${user.name}`);
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="max-w-md w-full p-8">
          <LoadingSkeleton lines={5} />
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <>
        <Toaster position="top-right" />
        <Suspense fallback={<div className="p-6">Memuat...</div>}>
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
        </Suspense>
      </>
    </ErrorBoundary>
  );
};

export default App;
