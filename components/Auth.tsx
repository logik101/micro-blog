
import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import Logo from './Logo';

interface AuthProps {
  onLogin: (username: string) => void;
  onBack: () => void;
  language: Language;
}

const Auth: React.FC<AuthProps> = ({ onLogin, onBack, language }) => {
  const t = TRANSLATIONS[language];
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const cleanUsername = username.trim().toLowerCase();
    const cleanPassword = password.trim();

    setTimeout(() => {
      if (cleanUsername === 'admin' && cleanPassword === 'admin') {
        onLogin(username.trim());
      } else {
        setError(language === 'fr' ? 'Identifiants invalides.' : 'Invalid credentials.');
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 font-sans selection:bg-[#1a3a8a] selection:text-white">
      <div className="max-w-md w-full bg-white p-8 md:p-12 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 transition-all duration-300 hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Logo size="lg" className="transform -rotate-3 hover:rotate-0 transition-transform duration-300" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">{t.adminPortal}</h2>
          <p className="text-gray-400 mt-2 font-medium">{t.adminSubtitle}</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-8 flex items-center border border-red-100 animate-in fade-in slide-in-from-top-4 duration-300">
            <svg className="w-5 h-5 mr-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">{t.username}</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 font-semibold focus:ring-4 focus:ring-[#1a3a8a]/5 focus:border-[#1a3a8a] focus:bg-white focus:outline-none transition-all"
              placeholder="admin"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1">{t.password}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-gray-900 font-semibold focus:ring-4 focus:ring-[#1a3a8a]/5 focus:border-[#1a3a8a] focus:bg-white focus:outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full flex justify-center py-4 px-4 rounded-2xl shadow-xl text-sm font-bold text-white transition-all ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#1a3a8a] hover:bg-[#152e6d]'
            }`}
          >
            {isLoading ? '...' : t.signIn}
          </button>
        </form>
        
        <button
          onClick={onBack}
          className="mt-8 w-full text-center text-sm font-bold text-gray-400 hover:text-[#1a3a8a] transition-all flex items-center justify-center gap-2 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          {t.backToPublic}
        </button>
      </div>
      
      <div className="mt-8 text-center bg-white/50 backdrop-blur-sm px-6 py-2 rounded-full border border-gray-200 shadow-sm">
        <p className="text-gray-500 text-xs font-medium">
          {t.credentials}: <span className="text-[#1a3a8a] font-bold">admin</span> / <span className="text-[#1a3a8a] font-bold">admin</span>
        </p>
      </div>
    </div>
  );
};

export default Auth;
