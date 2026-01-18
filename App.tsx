
import React, { useState, useEffect } from 'react';
import { db } from './db';
import { UserProfile, Match } from './types';
import Registration from './pages/Registration';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MatchSetup from './pages/MatchSetup';
import Scorer from './pages/Scorer';
import MatchHistory from './pages/MatchHistory';
import Rankings from './pages/Rankings';
import Settings from './pages/Settings';

enum View {
  REGISTRATION,
  LOGIN,
  DASHBOARD,
  MATCH_SETUP,
  SCORER,
  HISTORY,
  RANKINGS,
  SETTINGS
}

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.LOGIN);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  useEffect(() => {
    const data = db.getData();
    if (!data.user.isRegistered) {
      setView(View.REGISTRATION);
    } else {
      setUser(data.user);
      // Check for live match to resume
      const liveMatch = data.matches.find(m => m.status === 'live');
      if (liveMatch) {
          // Optional auto-resume or just keep it in history
      }
    }
  }, []);

  const handleRegister = (newUser: UserProfile) => {
    db.updateUser(newUser);
    setUser(newUser);
    setView(View.DASHBOARD);
  };

  const handleLogin = () => {
    setView(View.DASHBOARD);
  };

  const startMatchSetup = () => setView(View.MATCH_SETUP);
  const goToDashboard = () => setView(View.DASHBOARD);
  const goToHistory = () => setView(View.HISTORY);
  const goToRankings = () => setView(View.RANKINGS);
  const goToSettings = () => setView(View.SETTINGS);

  const startMatch = (match: Match) => {
    setActiveMatch(match);
    setView(View.SCORER);
  };

  const renderView = () => {
    switch (view) {
      case View.REGISTRATION:
        return <Registration onComplete={handleRegister} />;
      case View.LOGIN:
        return <Login user={user!} onLogin={handleLogin} />;
      case View.DASHBOARD:
        return <Dashboard onStartMatch={startMatchSetup} onNavigate={setView} />;
      case View.MATCH_SETUP:
        return <MatchSetup onCancel={goToDashboard} onStart={startMatch} />;
      case View.SCORER:
        return <Scorer match={activeMatch!} onFinish={goToDashboard} onUpdateMatch={(m) => {
            db.updateMatch(m);
            setActiveMatch(m);
        }} />;
      case View.HISTORY:
        return <MatchHistory onBack={goToDashboard} onSelectMatch={(m) => {
            setActiveMatch(m);
            setView(View.SCORER);
        }} />;
      case View.RANKINGS:
        return <Rankings onBack={goToDashboard} />;
      case View.SETTINGS:
        return <Settings onBack={goToDashboard} onUpdateUser={(u) => {
            setUser(u);
            db.updateUser(u);
        }} />;
      default:
        return <Dashboard onStartMatch={startMatchSetup} onNavigate={setView} />;
    }
  };

  return (
    <div className="h-full w-full bg-slate-900 text-slate-100 flex flex-col">
      {renderView()}
    </div>
  );
};

export default App;
export { View };
