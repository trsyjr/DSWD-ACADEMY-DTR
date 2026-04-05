import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdPerson, 
  MdLock, 
  MdEmail, 
  MdArrowForward, 
  MdCheckCircle, 
  MdErrorOutline 
} from 'react-icons/md';

// Ensure these paths match your folder structure
import bgImage from '../assets/TABG.png';
import logoImage from '../assets/TALogo.png';

const BRAND_COLOR = "#073763";
// YOUR ACTUAL SCRIPT URL
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx-NDXH1Mc1jilVl1kSwEkWaKfQlfqPjdz2k-5eok8EK9rW1TS1CtL1IrU3ez-H7BONWA/exec';

const AuthTabs = ({ onAuthSuccess }) => {
  const [activeTab, setActiveTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleGSheetSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData(e.currentTarget);
    const payload = {
      action: activeTab,
      username: formData.get('username'),
      password: formData.get('password'),
      email: formData.get('email') || '',
    };

    try {
      if (activeTab === 'login') {
        // --- SECURE LOGIN (GET) ---
        // Fetching with GET allows us to parse the JSON response and verify the user
        const response = await fetch(
          `${SCRIPT_URL}?action=login&username=${encodeURIComponent(payload.username)}&password=${encodeURIComponent(payload.password)}`
        );
        const result = await response.json();

        if (result.success) {
          // Success: Pass the REAL data from the spreadsheet to the App state
          onAuthSuccess({
            username: result.user.username,
            email: result.user.email 
          });
        } else {
          // Fail: Spreadsheet found no match
          setMessage({ 
            type: 'error', 
            text: result.message || "Invalid Username or Password" 
          });
        }
      } else {
        // --- REGISTRATION (POST) ---
        // Registration uses POST with no-cors as we just need to send the data
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
        });

        setMessage({ type: 'success', text: 'Registration request sent!' });
        setTimeout(() => setActiveTab('login'), 2000);
        e.target.reset();
      }
    } catch (err) {
      console.error("Auth error:", err);
      setMessage({ 
        type: 'error', 
        text: "Connection error. Ensure Script is deployed to 'Anyone'." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-10">
      
      {/* Background Layer */}
      <div 
        className="fixed inset-0 z-[-1] bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{ backgroundImage: `url(${bgImage})` }} 
      />

      {/* Main Glassmorphism Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-[450px] bg-white rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.35)] px-8 md:px-12 py-12 md:py-16 flex flex-col items-center border border-white/20"
      >
        
        <motion.img 
          src={logoImage} 
          alt="Logo"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-24 h-24 mb-6 object-contain"
        />

        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter italic uppercase leading-none">
            DSWD <span className="text-[#073763]">Academy</span>
          </h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em] mt-3 opacity-60">
            DTR Management Portal
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="w-full flex bg-slate-100 p-1.5 rounded-2xl mb-8 border border-slate-200 shadow-inner">
          {['login', 'register'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => { setActiveTab(tab); setMessage({type:'', text:''}); }}
              className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-500 ease-out ${
                activeTab === tab 
                  ? 'bg-[#073763] text-white shadow-xl' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Auth Form */}
        <form onSubmit={handleGSheetSubmit} className="w-full space-y-5">
          
          {/* Username Input */}
          <div className="space-y-1.5 group">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Username</label>
            <div className="relative">
              <MdPerson className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-300 group-focus-within:text-[#073763] transition-colors" />
              <input 
                name="username"
                type="text" 
                required
                placeholder="Enter username"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#073763] focus:ring-4 focus:ring-[#073763]/5 outline-none text-slate-700 font-semibold transition-all"
              />
            </div>
          </div>

          {/* Registration Fields (Conditional) */}
          <AnimatePresence mode="wait">
            {activeTab === 'register' && (
              <motion.div 
                key="email"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1.5 overflow-hidden"
              >
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Email</label>
                <div className="relative">
                  <MdEmail className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-300" />
                  <input 
                    name="email"
                    type="email" 
                    required={activeTab === 'register'}
                    placeholder="name@dswd.gov.ph"
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#073763] outline-none text-slate-700 font-semibold transition-all"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password Input */}
          <div className="space-y-1.5 group">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <MdLock className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-slate-300 group-focus-within:text-[#073763] transition-colors" />
              <input 
                name="password"
                type="password" 
                required
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#073763] focus:ring-4 focus:ring-[#073763]/5 outline-none text-slate-700 font-semibold transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            disabled={loading}
            className="w-full py-5 text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-blue-900/10 mt-6 flex items-center justify-center gap-3 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ backgroundColor: BRAND_COLOR }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Validating...
              </span>
            ) : (
              <>
                {activeTab === 'login' ? "Access System" : "Create Account"}
                <MdArrowForward className="text-xl" />
              </>
            )}
          </motion.button>
        </form>

        {/* Status Messages */}
        <AnimatePresence>
          {message.text && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                message.type === 'error' ? 'text-red-500' : 'text-emerald-500'
              }`}
            >
              {message.type === 'error' ? <MdErrorOutline className="text-lg" /> : <MdCheckCircle className="text-lg" />}
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-12 text-slate-300 text-[8px] font-black uppercase tracking-[0.5em] select-none">
          Internal Access Only • 2026
        </p>
      </motion.div>
    </div>
  );
};

export default AuthTabs;