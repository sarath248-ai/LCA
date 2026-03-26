import React, { useState, useMemo } from 'react';
import { Leaf, Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';

const Auth = () => {
  const { darkMode, setDarkMode, handleLogin, handleRegister, loading, error, clearError } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [formError, setFormError] = useState('');
  const [passwordsMatch, setPasswordsMatch] = useState(true);

  // Memoized theme object for better performance
  const theme = useMemo(() => ({
    gradient: darkMode ? 'from-slate-900 to-slate-800' : 'from-slate-50 to-slate-100',
    cardBg: darkMode ? 'bg-slate-800' : 'bg-white',
    text: darkMode ? 'text-slate-100' : 'text-slate-900',
    textMuted: darkMode ? 'text-slate-400' : 'text-slate-600',
    hoverBg: darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50',
    inputBg: darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300',
    iconBg: darkMode ? 'bg-emerald-900' : 'bg-emerald-100',
    iconColor: darkMode ? 'text-emerald-400' : 'text-emerald-600',
  }), [darkMode]);

  const handleFormToggle = () => {
    setIsLogin(!isLogin);
    clearError();
    setFormError('');
    setPasswordsMatch(true);
  };

  const validatePasswords = (password, confirmPassword) => {
    if (!isLogin && password !== confirmPassword) {
      setFormError('Passwords do not match');
      setPasswordsMatch(false);
      return false;
    }
    setFormError('');
    setPasswordsMatch(true);
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    
    if (!email || !password) {
      setFormError('Please fill in all required fields');
      return;
    }

    if (isLogin) {
      handleLogin(email, password);
    } else {
      const name = formData.get('name');
      const confirmPassword = formData.get('confirmPassword');
      
      // Validate passwords before submission
      if (!validatePasswords(password, confirmPassword)) {
        return;
      }
      
      if (!name) {
        setFormError('Please fill in all fields');
        return;
      }
      
      // Backend only accepts name, email, password
      handleRegister(name, email, password);
    }
  };

  const handlePasswordChange = (e) => {
    if (!isLogin) {
      const form = e.target.form;
      const password = form.querySelector('[name="password"]').value;
      const confirmPassword = form.querySelector('[name="confirmPassword"]').value;
      
      if (confirmPassword && password !== confirmPassword) {
        setFormError('Passwords do not match');
        setPasswordsMatch(false);
      } else {
        setFormError('');
        setPasswordsMatch(true);
      }
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${theme.gradient} flex items-center justify-center p-4`}>
      <div className={`${theme.cardBg} rounded-lg shadow-lg w-full max-w-md p-8 relative`}>
        {/* Theme Toggle */}
        <div className="absolute top-4 right-4">
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-lg ${theme.hoverBg} ${theme.textMuted}`}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 ${theme.iconBg} rounded-full mb-4`}>
            <Leaf className={`w-8 h-8 ${theme.iconColor}`} />
          </div>
          <h1 className={`text-2xl font-bold ${theme.text}`}>EcoMetal LCA</h1>
          <p className={`${theme.textMuted} mt-2`}>
            {isLogin ? 'Industrial Life Cycle Analysis Platform' : 'Create your account'}
          </p>
        </div>

        {/* Error Messages */}
        {(error || formError) && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error || formError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Full Name *
              </label>
              <input 
                type="text"
                name="name"
                className={`w-full px-4 py-2 border ${theme.inputBg} ${theme.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                placeholder="John Smith"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className={`block text-sm font-medium ${theme.text} mb-2`}>
              Email *
            </label>
            <input 
              type="email"
              name="email"
              className={`w-full px-4 py-2 border ${theme.inputBg} ${theme.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              placeholder="engineer@company.com"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.text} mb-2`}>
              Password *
            </label>
            <input 
              type="password" 
              name="password"
              className={`w-full px-4 py-2 border ${theme.inputBg} ${theme.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              placeholder="••••••••"
              required
              minLength={6}
              onChange={handlePasswordChange}
            />
          </div>

          {!isLogin && (
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>
                Confirm Password *
              </label>
              <input 
                type="password" 
                name="confirmPassword"
                className={`w-full px-4 py-2 border ${!passwordsMatch ? 'border-red-500' : theme.inputBg} ${theme.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                placeholder="••••••••"
                required={!isLogin}
                minLength={6}
                onChange={handlePasswordChange}
              />
              {!passwordsMatch && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading || (!isLogin && !passwordsMatch)}
            className={`w-full py-3 rounded-lg font-medium transition-colors ${
              loading || (!isLogin && !passwordsMatch)
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>

          <div className="text-center">
            <button 
              type="button"
              onClick={handleFormToggle}
              className="text-sm text-emerald-600 hover:text-emerald-700"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>

        {/* Demo Credentials Hint */}
        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className={`text-xs ${theme.textMuted} text-center`}>
            Demo credentials: <br />
            Email: demo@ecometal.com <br />
            Password: demo123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;