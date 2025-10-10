import React, { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
import { AcademicCapIcon } from './icons/AcademicCapIcon';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { EnvelopeIcon } from './icons/EnvelopeIcon';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await authService.login(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError('Email atau password salah.');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoEmails = {
    'admin': 'admin@fathussalafi.ac.id',
    'kepala.yayasan': 'kepala.yayasan@fathussalafi.ac.id',
    'kepsek.mi': 'kepsek.mi@fathussalafi.ac.id',
    'rina.m': 'rina.m@fathussalafi.ac.id',
    'cinta.ma': 'cinta.ma@fathussalafi.ac.id',
    'andi.mi': 'andi.mi@fathussalafi.ac.id'
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
        <div className="max-w-md w-full">
            <div className="text-center mb-8">
                <AcademicCapIcon className="mx-auto h-16 w-16 text-brand-600" />
                <h1 className="mt-4 text-3xl font-extrabold text-gray-900 tracking-tight">SIAKAD Fathus Salafi</h1>
                <p className="mt-2 text-sm text-gray-600">Selamat datang kembali! Silakan masuk ke akun Anda.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="email" className="text-sm font-medium text-gray-700">Email</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="nama@fathussalafi.ac.id"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
                         <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                                <LockClosedIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                            />
                        </div>
                    </div>
                    
                    {error && <p className="text-sm text-red-600 text-center">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:bg-brand-400 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? 'Memproses...' : 'Masuk'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600 bg-gray-200/50 p-4 rounded-lg">
                <p className="font-semibold">Untuk demo, klik username lalu isi password:</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2">
                    {Object.entries(demoEmails).map(([username, emailAddr]) => (
                        <button key={username} onClick={() => setEmail(emailAddr)} className="inline-block bg-white px-2 py-1 rounded-md shadow-sm text-xs hover:bg-brand-50">{username}</button>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};

export default LoginPage;