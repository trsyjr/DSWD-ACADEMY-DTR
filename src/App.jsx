import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AuthTabs from './components/AuthTabs';
import Dashboard from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true); // Added to prevent flash

  useEffect(() => {
    // 1. Check if user exists in storage on mount
    const savedUser = localStorage.getItem('dtr_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    // 2. We are done checking storage
    setIsInitializing(false);
  }, []);

  const handleAuthSuccess = (userData) => {
    localStorage.setItem('dtr_user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    // 1. Clear State
    setUser(null);
    // 2. Clear Storage
    localStorage.removeItem('dtr_user');
    // 3. Force a clean URL state (optional but helps with "back button" issues)
    window.location.hash = ''; 
  };

  // While checking localStorage, show nothing or a small loader
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