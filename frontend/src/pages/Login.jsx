import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { KeyRound, Mail, Sparkles, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';

export default function Login() {
  const { login, error, loading } = useAuthStore();
  const { theme } = useSettingsStore();

  const [email, setEmail] = useState('admin@catermaster.com');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password.');
      return;
    }
    
    const success = await login(email, password);
    if (success) {
      toast.success('Successfully logged in!');
      // Navigate/refresh is handled by react router layout mounting
      window.location.href = '/dashboard';
    } else {
      toast.error(error || 'Invalid credentials.');
    }
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 overflow-hidden px-4">
      {/* Background Floating Circles */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 40, -20, 0],
            y: [0, -50, 30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute -top-20 -left-20 w-[300px] h-[300px] rounded-full bg-primary/20 blur-[80px]"
        />
        <motion.div
          animate={{
            x: [0, -60, 40, 0],
            y: [0, 60, -30, 0],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute -bottom-20 -right-20 w-[400px] h-[400px] rounded-full bg-secondary/20 blur-[100px]"
        />
      </div>

      {/* Login Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring', damping: 20 }}
        className="w-full max-w-[450px] p-8 rounded-premium glass-card shadow-2xl z-10 border border-slate-200/40 dark:border-slate-800"
      >
        {/* Branding header */}
        <div className="text-center mb-8">
          <img src={logoImg} alt="Maha's Kitchen Logo" className="mx-auto w-16 h-16 object-contain rounded-full shadow-premium mb-4 bg-white border border-slate-200 dark:border-slate-800" />
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Maha's Kitchen
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Digitize your catering business operations
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
            <div className="relative flex items-center">
              <Mail size={16} className="absolute left-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-xs focus:border-primary transition-all duration-200"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
              <a href="#" className="text-[10px] font-semibold text-primary dark:text-secondary hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative flex items-center">
              <KeyRound size={16} className="absolute left-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40 text-xs focus:border-primary transition-all duration-200"
              />
            </div>
          </div>

          {/* Remember me & submit */}
          <div className="flex items-center justify-between py-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-500 dark:text-slate-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
              />
              <span>Remember me</span>
            </label>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-secondary-hover text-white text-xs font-bold rounded-xl shadow-premium hover:shadow-premium-hover transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Log In to Dashboard'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
