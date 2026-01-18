
import React, { useState } from 'react';
import { UserProfile } from '../types';

interface Props {
  user: UserProfile;
  onLogin: () => void;
}

const Login: React.FC<Props> = ({ user, onLogin }) => {
  const [pinInput, setPinInput] = useState('');
  const [error, setError] = useState(false);

  const handlePinPress = (num: string) => {
    if (pinInput.length < 4) {
      const newVal = pinInput + num;
      setPinInput(newVal);
      if (newVal.length === 4) {
        if (newVal === user.pin) {
          onLogin();
        } else {
          setError(true);
          setTimeout(() => {
            setPinInput('');
            setError(false);
          }, 500);
        }
      }
    }
  };

  // If no PIN set, just show a "Start" button or auto-login
  if (!user?.pin) {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-slate-950 text-center">
        <div className="mx-auto h-24 w-24 bg-amber-500 rounded-full flex items-center justify-center text-5xl shadow-2xl mb-8 animate-bounce">
          🏏
        </div>
        <h1 className="text-4xl font-extrabold text-white mb-2">{user?.academyName || 'Dinda Academy'}</h1>
        <p className="text-slate-400 mb-12">Tap to start scoring your local matches!</p>
        <button
          onClick={onLogin}
          className="w-full max-w-xs py-5 bg-amber-500 text-slate-950 rounded-2xl text-xl font-black shadow-xl hover:scale-105 active:scale-95 transition-transform"
        >
          OPEN DASHBOARD
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-6 bg-slate-950">
      <div className="text-center mb-12">
          <div className="text-amber-500 text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white">Enter PIN</h2>
          <p className="text-slate-400">Academy: {user.academyName}</p>
      </div>

      <div className="flex gap-4 mb-12">
        {[0,1,2,3].map(i => (
          <div 
            key={i} 
            className={`w-4 h-4 rounded-full border-2 border-amber-500 transition-all duration-200 ${
              pinInput.length > i ? 'bg-amber-500 scale-125' : 'bg-transparent'
            } ${error ? 'border-red-500 bg-red-500 animate-pulse' : ''}`}
          />
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {['1','2','3','4','5','6','7','8','9','','0','C'].map((val, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (val === 'C') setPinInput('');
              else if (val) handlePinPress(val);
            }}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
              !val ? 'invisible' : 'bg-slate-800 text-white active:bg-amber-500 active:text-slate-950 transition-colors'
            }`}
          >
            {val}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Login;
