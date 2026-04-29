import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MdRadioButtonChecked, MdCoffee, MdRestaurant, 
  MdLogout, MdAccessTime, MdCheckCircle,
  MdBarChart, MdHistory, MdKeyboardArrowDown,
  MdRefresh, MdErrorOutline, MdFileDownload,
  MdTableChart, MdPictureAsPdf, MdDescription,
  MdWarning
} from 'react-icons/md';

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx-NDXH1Mc1jilVl1kSwEkWaKfQlfqPjdz2k-5eok8EK9rW1TS1CtL1IrU3ez-H7BONWA/exec';

const Dashboard = ({ user, onLogout }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dtrData, setDtrData] = useState([]);
  
  const [period, setPeriod] = useState(new Date().getDate() <= 15 ? "1st Half" : "2nd Half"); 
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showToast, setShowToast] = useState(null);
  const [errorToast, setErrorToast] = useState(null); 
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  // New state for custom UI popup
  const [confirmConfig, setConfirmConfig] = useState(null);

  const [exportPos, setExportPos] = useState({ top: 0, left: 0 });
  const [monthPos, setMonthPos] = useState({ top: 0, left: 0 });

  const exportRef = useRef(null);
  const monthRef = useRef(null);
  const exportBtnRef = useRef(null);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportRef.current && !exportRef.current.contains(event.target)) setIsExportOpen(false);
      if (monthRef.current && !monthRef.current.contains(event.target)) setIsMonthOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchDTR = useCallback(async () => {
    if (!user?.email) return;
    setRefreshing(true);
    try {
      const response = await fetch(`${SCRIPT_URL}?action=get_dtr&email=${encodeURIComponent(user.email)}&t=${Date.now()}`);
      const result = await response.json();
      if (result.success) {
        setDtrData(result.dtr || []);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    } finally {
      setRefreshing(false);
    }
  }, [user?.email]);

  useEffect(() => {
    const clockTimer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchDTR();
    return () => clearInterval(clockTimer);
  }, [fetchDTR]);

  // The actual logging logic extracted so it can be called after confirmation
  const executeAttendance = async (actionType) => {
    setLoading(true);
    setConfirmConfig(null);
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'log_dtr', email: user.email, type: actionType }),
      });

      const fetchSuccess = await fetchDTR();
      if (fetchSuccess) {
        setShowToast(actionType);
        setTimeout(() => setShowToast(null), 3000);
      }
    } catch (err) {
      setErrorToast("Sync Failed.");
      setTimeout(() => setErrorToast(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = (actionType) => {
    if (loading || !user?.email) return;
    
    const today = new Date();
    const todayStr = `${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getDate().toString().padStart(2, '0')}/${today.getFullYear()}`;
    const todayRecord = dtrData.find(row => row.Date === todayStr);

    // 1. Check for Pre-requisite
    if (actionType !== "Time In") {
      if (!todayRecord || !todayRecord.TimeIn || todayRecord.TimeIn === '--:--') {
        setErrorToast("Please Time In first");
        setTimeout(() => setErrorToast(null), 3000);
        return;
      }
    }

    // 2. Check for Duplicate to trigger Popup
    let alreadyLogged = false;
    if (todayRecord) {
      if (actionType === "Time In" && todayRecord.TimeIn && todayRecord.TimeIn !== '--:--') alreadyLogged = true;
      if (actionType === "Break Out" && todayRecord.BreakOut && todayRecord.BreakOut !== '--:--') alreadyLogged = true;
      if (actionType === "Break In" && todayRecord.BreakIn && todayRecord.BreakIn !== '--:--') alreadyLogged = true;
      if (actionType === "Time Out" && todayRecord.TimeOut && todayRecord.TimeOut !== '--:--') alreadyLogged = true;
    }

    if (alreadyLogged) {
      setConfirmConfig(actionType);
    } else {
      executeAttendance(actionType);
    }
  };

  // Remaining export functions...
  const filteredData = dtrData.filter(row => {
    if (!row.Date) return false;
    const [m, d] = row.Date.split('/');
    return parseInt(m) === selectedMonth && (period === "1st Half" ? parseInt(d) <= 15 : parseInt(d) > 15);
  });

  const totalHours = filteredData.reduce((acc, row) => {
    if (!row.Total || !row.Total.includes(':')) return acc;
    const parts = row.Total.split(':');
    return acc + parseInt(parts[0]) + (parseInt(parts[1]) / 60);
  }, 0);

  const exportToCSV = () => { /* Same as your original */ };
  const exportToXLSX = () => { /* Same as your original */ };

  const handleExportToggle = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setExportPos({ top: rect.bottom + window.scrollY + 10, left: rect.right - 200 });
    setIsExportOpen(!isExportOpen);
  };

  const handleMonthToggle = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMonthPos({ top: rect.bottom + window.scrollY + 10, left: rect.left });
    setIsMonthOpen(!isMonthOpen);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 min-h-screen bg-[#F8FAFC]">
      <style>{`
        @media print { .no-print { display: none !important; } .print-header { display: flex !important; } }
        .print-header { display: none; }
      `}</style>
      
      {/* CUSTOM UI CONFIRMATION POPUP */}
      <AnimatePresence>
        {confirmConfig && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm no-print">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center"
            >
              <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MdWarning className="text-3xl text-amber-500" />
              </div>
              <h2 className="text-xl font-black text-[#073763] uppercase italic mb-2">Already Logged</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide leading-relaxed mb-8">
                You have already recorded a <span className="text-[#073763]">{confirmConfig}</span> for today. Do you want to overwrite it with the current time?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setConfirmConfig(null)}
                  className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => executeAttendance(confirmConfig)}
                  className="flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-[#073763] shadow-lg shadow-blue-900/20 hover:bg-[#0a4a82] transition-colors"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showToast && (
          <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, x: '-50%' }} className="fixed bottom-10 left-1/2 z-50 flex items-center gap-3 px-6 py-4 bg-[#073763] text-white rounded-2xl shadow-2xl no-print">
            <MdCheckCircle className="text-xl text-emerald-400" />
            <p className="text-sm font-bold uppercase italic tracking-wider">{showToast} Success</p>
          </motion.div>
        )}
        {errorToast && (
          <motion.div initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, x: '-50%' }} className="fixed bottom-10 left-1/2 z-50 flex items-center gap-3 px-6 py-4 bg-red-600 text-white rounded-2xl shadow-2xl no-print">
            <MdErrorOutline className="text-xl text-white" />
            <p className="text-sm font-bold uppercase italic tracking-wider">{errorToast}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REST OF YOUR UI REMAINS EXACTLY THE SAME */}
      <div className="print-header">
        <div>
            <h1 className="text-2xl font-black text-[#073763] uppercase">Daily Time Record</h1>
            <p className="text-sm font-bold text-slate-500 uppercase">{user?.username} • {user?.email}</p>
        </div>
        <div className="text-right">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
            {months[selectedMonth-1]} {period} {new Date().getFullYear()}
            </p>
        </div>
      </div>

      <nav className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-2xl bg-[#073763] flex items-center justify-center text-white text-2xl font-black italic shadow-lg">
            {user?.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-xl font-black text-[#073763] uppercase italic">Welcome, {user?.username || 'User'}</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden sm:block">
            <p className="text-2xl font-black tabular-nums text-[#073763]">{currentTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          </div>
          <button onClick={onLogout} className="px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase hover:text-red-500 border border-slate-100 transition-colors">Log Out</button>
        </div>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 no-print">
        <div className="lg:col-span-7 bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100">
          <h3 className="text-[11px] font-black text-[#073763] uppercase tracking-[0.4em] mb-10 flex items-center gap-2"><MdAccessTime className="text-lg" /> Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ActionButton label="Time In" Icon={MdRadioButtonChecked} onClick={() => handleAttendance("Time In")} disabled={loading} color="#073763" />
            <ActionButton label="Break Out" Icon={MdCoffee} onClick={() => handleAttendance("Break Out")} disabled={loading} color="#64748b" />
            <ActionButton label="Break In" Icon={MdRestaurant} onClick={() => handleAttendance("Break In")} disabled={loading} color="#64748b" />
            <ActionButton label="Time Out" Icon={MdLogout} onClick={() => handleAttendance("Time Out")} disabled={loading} color="#ef4444" />
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#073763] rounded-[3rem] p-10 text-white shadow-2xl flex flex-col justify-between print-card">
          <div>
            <h3 className="text-[10px] font-black opacity-40 uppercase tracking-[0.4em] mb-6">Period Efficiency</h3>
            <p className="text-5xl font-black tracking-tighter">{totalHours.toFixed(1)} <span className="text-sm opacity-50 font-medium">hrs</span></p>
            <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest mt-1">Total for {months[selectedMonth-1]} ({period})</p>
          </div>
          <div className="pt-6 border-t border-white/10 mt-6 flex justify-between items-center">
            <div><p className="text-xl font-black">{filteredData.length}</p><p className="text-[8px] opacity-40 uppercase font-black">Days Logged</p></div>
            <MdBarChart className="text-4xl opacity-20" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden print:overflow-visible">
        <div className="p-10 border-b border-slate-50 flex flex-wrap justify-between items-center gap-8 no-print">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-slate-50 rounded-2xl"><MdHistory className="text-[#073763] text-xl" /></div>
            <div className="flex items-center gap-3">
               <h3 className="font-black text-xl tracking-tight uppercase italic text-[#073763]">Attendance History</h3>
               <motion.button onClick={fetchDTR} disabled={refreshing} animate={{ rotate: refreshing ? 360 : 0 }} transition={{ repeat: refreshing ? Infinity : 0, duration: 1, ease: "linear" }} className="p-2 bg-slate-50 text-[#073763] rounded-xl hover:bg-[#073763] hover:text-white transition-colors disabled:opacity-50">
                 <MdRefresh className="text-lg" />
               </motion.button>
             </div>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-100/50 p-2 rounded-[1.5rem]">
            <div className="relative" ref={monthRef}>
              <button onClick={handleMonthToggle} className="flex items-center gap-2 text-[10px] font-black uppercase px-4 py-2 text-[#073763] transition-opacity hover:opacity-70">
                {months[selectedMonth - 1]} <MdKeyboardArrowDown className={`transition-transform ${isMonthOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isMonthOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} 
                    style={{ position: 'fixed', top: monthPos.top, left: monthPos.left, zIndex: 9999 }}
                    className="bg-white border border-slate-100 shadow-2xl rounded-[1.5rem] p-3 grid grid-cols-3 gap-2 min-w-[240px]"
                  >
                    {months.map((m, i) => (
                      <button key={i} onClick={() => { setSelectedMonth(i + 1); setIsMonthOpen(false); }} className={`text-[9px] font-bold p-2 rounded-lg uppercase ${selectedMonth === i + 1 ? 'bg-[#073763] text-white' : 'hover:bg-slate-50 text-slate-400'}`}>{m}</button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl">
              <button onClick={() => setPeriod("1st Half")} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${period === "1st Half" ? 'bg-white shadow-sm text-[#073763]' : 'text-slate-400'}`}>1st Half</button>
              <button onClick={() => setPeriod("2nd Half")} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${period === "2nd Half" ? 'bg-white shadow-sm text-[#073763]' : 'text-slate-400'}`}>2nd Half</button>
            </div>
            
            <div className="relative border-l border-slate-200 pl-3 ml-2" ref={exportRef}>
              <button ref={exportBtnRef} onClick={handleExportToggle} className="flex items-center gap-2 px-4 py-2 bg-[#073763] text-white rounded-xl shadow-lg hover:shadow-blue-900/20 transition-all active:scale-95 group">
                <MdFileDownload className="text-base group-hover:translate-y-0.5 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-wider">Export</span>
              </button>
              
              <AnimatePresence>
                {isExportOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} 
                    style={{ position: 'fixed', top: exportPos.top, left: exportPos.left, zIndex: 9999 }}
                    className="bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-[2rem] p-3 min-w-[200px]"
                  >
                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] px-3 mb-2">Select Format</div>
                    <ExportItem icon={<MdTableChart className="text-emerald-500"/>} label="CSV Spreadsheet" sub="Basic Format" onClick={exportToCSV} />
                    <ExportItem icon={<MdDescription className="text-blue-500"/>} label="Excel Workbook" sub="Microsoft Office" onClick={exportToXLSX} />
                    <div className="h-px bg-slate-50 my-1"></div>
                    <ExportItem icon={<MdPictureAsPdf className="text-red-500"/>} label="PDF Document" sub="Print Ready" onClick={() => { setIsExportOpen(false); setTimeout(() => window.print(), 100); }} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto px-8 pb-8 print:overflow-visible">
          <table className="w-full text-left border-separate border-spacing-y-2 print:border-collapse print:border-spacing-0">
            <thead>
              <tr className="text-[9px] uppercase tracking-widest font-black text-slate-400 italic">
                <th className="p-4">Date</th><th className="p-4 text-[#073763]">Time In</th><th className="p-4">Break Out</th><th className="p-4">Break In</th><th className="p-4">Time Out</th><th className="p-4">Total</th><th className="p-4 text-right">+/-</th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {filteredData.length > 0 ? filteredData.map((row, i) => (
                <tr key={i} className="group hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-black text-slate-400 group-hover:text-[#073763]">{row.Date}</td>
                  <td className="p-4 text-[#073763] font-black">{row.TimeIn || '--:--'}</td>
                  <td className="p-4 text-slate-400">{row.BreakOut || '--:--'}</td>
                  <td className="p-4 text-slate-400">{row.BreakIn || '--:--'}</td>
                  <td className="p-4 text-red-500 font-black">{row.TimeOut || '--:--'}</td>
                  <td className="p-4 font-mono font-bold">{row.Total || '0:00'}</td>
                  <td className="p-4 text-right">
                    <span className={`px-3 py-1 rounded-lg font-black text-[10px] ${row.Diff?.includes('-') ? 'text-blue-600 bg-blue-50' : 'text-red-600 bg-red-50'}`}>{row.Diff || '0:00'}</span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="p-10 text-center text-slate-400 font-bold uppercase text-[10px] tracking-widest">No records found for this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ExportItem = ({ icon, label, sub, onClick }) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-2xl transition-colors text-left group">
    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl group-hover:bg-white transition-colors">{icon}</div>
    <div>
      <div className="text-[10px] font-black text-[#073763] uppercase tracking-tight">{label}</div>
      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{sub}</div>
    </div>
  </button>
);

const ActionButton = ({ label, Icon, onClick, disabled, color }) => (
  <motion.button whileHover={!disabled ? { y: -5, backgroundColor: '#fff' } : {}} whileTap={!disabled ? { scale: 0.95 } : {}} onClick={onClick} disabled={disabled} className="flex flex-col items-center justify-center p-6 rounded-[2rem] bg-slate-50 border border-slate-100 disabled:opacity-50 transition-all cursor-pointer">
    <Icon className="mb-3 text-3xl" style={{ color }} />
    <span className="text-[9px] font-black uppercase tracking-widest italic text-center text-slate-600">{disabled ? "Syncing..." : label}</span>
  </motion.button>
);

export default Dashboard;