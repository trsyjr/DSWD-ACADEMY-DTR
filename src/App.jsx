import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthTabs from './components/AuthTabs';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('dtr_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsInitializing(false);
  }, []);

  const handleAuthSuccess = (userData) => {
    localStorage.setItem('dtr_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('dtr_user');
    window.location.hash = ''; 
  };

  if (isInitializing) return null;

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div 
            key="auth"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full min-h-screen flex items-center justify-center"
          >
            <AuthTabs onAuthSuccess={handleAuthSuccess} />
          </motion.div>
        ) : (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full min-h-screen bg-[#f8fafc]"
          >
            <Dashboard user={user} onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}