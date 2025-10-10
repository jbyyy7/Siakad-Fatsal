import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [identityNumber, setIdentityNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const user = await authService.login(identityNumber, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <AcademicCapIcon className="w-16 h-16 mx-auto text-brand-600" />
          <h2 className="mt-4 text-3xl font-bold text-gray-900">SIAKAD</h2>
          <p className="mt-2 text-sm text-gray-600">Sistem Informasi Akademik Terpadu</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="identity_number" className="sr-only">
              Nomor Induk (NIS/NIP)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <UserCircleIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="identity_number"
                name="identity_number"
                type="text"
                required
                className="w-full py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                placeholder="Nomor Induk (NIS/NIP)"
                value={identityNumber}
                onChange={(e) => setIdentityNumber(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Kata Sandi
            </label>
            <div className="relative">
               <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <LockClosedIcon className="w-5 h-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 border border-gray-300 rounded-md focus:outline-none focus:ring-brand-500 focus:border-brand-500"
                placeholder="Kata Sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full px-4 py-3 font-semibold text-white bg-brand-600 rounded-md hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:bg-brand-400"
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
