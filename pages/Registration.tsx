
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface Props {
  onComplete: (user: UserProfile) => void;
}

const Registration: React.FC<Props> = ({ onComplete }) => {
  const [academyName, setAcademyName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [pin, setPin] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!academyName.trim()) return;

    onComplete({
      academyName,
      managerName,
      pin: pin || undefined,
      isRegistered: true,
    });
  };

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-6 bg-slate-950">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-amber-500 rounded-full flex items-center justify-center text-4xl shadow-lg mb-4">
            🏏
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dinda Academy Scorer</h1>
          <p className="mt-2 text-slate-400">Welcome to the Academy of Expensive Bowling!</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-800">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Academy Name *</label>
              <input
                required
                type="text"
                className="mt-1 block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="e.g. Lords of Dinda"
                value={academyName}
                onChange={e => setAcademyName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Manager Name (Optional)</label>
              <input
                type="text"
                className="mt-1 block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="Coach Ashok"
                value={managerName}
                onChange={e => setManagerName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Login PIN (4-digits, optional)</label>
              <input
                type="password"
                maxLength={4}
                className="mt-1 block w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 outline-none"
                placeholder="1234"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 transition-colors"
          >
            Create My Academy
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registration;
