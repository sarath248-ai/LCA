import React, { useMemo } from 'react';
import { 
  BarChart3, FileText, Upload, Bot, Settings, TrendingUp, 
  Activity, ChevronDown, ChevronRight, Plus, LogOut, 
  Database, Moon, Sun, Leaf, Zap, CheckCircle  // ADDED CheckCircle
} from 'lucide-react';
import { useApp } from '../context/AppContext';

const AppLayout = ({ children }) => {
  const { 
    darkMode, 
    setDarkMode, 
    user, 
    handleLogout, 
    selectedProject, 
    currentView,
    setCurrentView,
    sidebarExpanded,
    toggleSection,
    error,
    clearError
  } = useApp();

  // Memoized theme object for better performance
  const theme = useMemo(() => ({
    bg: darkMode ? 'bg-slate-900' : 'bg-slate-50',
    cardBg: darkMode ? 'bg-slate-800' : 'bg-white',
    text: darkMode ? 'text-slate-100' : 'text-slate-900',
    textMuted: darkMode ? 'text-slate-400' : 'text-slate-600',
    border: darkMode ? 'border-slate-700' : 'border-slate-200',
    hoverBg: darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50',
    inputBg: darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300',
    activeBg: darkMode ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-50 text-emerald-700',
    iconBg: darkMode ? 'bg-emerald-900' : 'bg-emerald-100',
    iconColor: darkMode ? 'text-emerald-400' : 'text-emerald-600',
  }), [darkMode]);

  return (
    <div className={`h-screen flex flex-col ${theme.bg}`}>
      {/* ERROR TOAST */}
      {error && (
        <div className="fixed top-4 right-4 z-50 w-96">
          <div className={`${darkMode ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4 shadow-lg`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <div className={`w-5 h-5 rounded-full ${darkMode ? 'bg-red-700' : 'bg-red-200'} flex items-center justify-center`}>
                    <span className={`text-xs font-bold ${darkMode ? 'text-red-200' : 'text-red-700'}`}>!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-medium ${darkMode ? 'text-red-200' : 'text-red-800'}`}>Error</h4>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{error}</p>
                </div>
              </div>
              <button
                onClick={clearError}
                className={`flex-shrink-0 ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
                aria-label="Dismiss error"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOPBAR */}
      <div className={`h-16 ${theme.cardBg} border-b ${theme.border} flex items-center justify-between px-6 flex-shrink-0`}>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Leaf className="w-6 h-6 text-emerald-600" />
            <span className={`text-xl font-bold ${theme.text}`}>EcoMetal LCA</span>
          </div>
          
          {/* PROJECT SELECTOR */}
          {selectedProject && (
            <div className="ml-8">
              <button 
                className={`flex items-center space-x-2 px-4 py-2 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'} rounded-lg ${theme.hoverBg} transition-colors`}
                onClick={() => setCurrentView('projects')}
                title="View all projects"
              >
                <Database className={`w-4 h-4 ${theme.textMuted}`} />
                <span className={`text-sm font-medium ${theme.text}`}>
                  {selectedProject.name || selectedProject}
                </span>
                <ChevronDown className={`w-4 h-4 ${theme.textMuted}`} />
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {/* THEME TOGGLE */}
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 ${theme.hoverBg} rounded-lg transition-colors`}
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? <Sun className={`w-5 h-5 ${theme.textMuted}`} /> : <Moon className={`w-5 h-5 ${theme.textMuted}`} />}
          </button>
          
          <button 
            className={`p-2 ${theme.hoverBg} rounded-lg transition-colors`}
            onClick={() => setCurrentView('settings')}
            title="Settings"
          >
            <Settings className={`w-5 h-5 ${theme.textMuted}`} />
          </button>
          
          {/* USER INFO */}
          {user && (
            <div className={`flex items-center space-x-3 px-3 py-2 ${theme.hoverBg} rounded-lg transition-colors cursor-pointer`}>
              <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-left">
                <div className={`text-sm font-medium ${theme.text}`}>{user.name || user.email.split('@')[0]}</div>
                <div className={`text-xs ${theme.textMuted}`}>{user.email}</div>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleLogout}
            className={`flex items-center space-x-2 px-3 py-2 ${theme.textMuted} ${theme.hoverBg} rounded-lg transition-colors`}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm hidden md:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <div className={`w-64 ${theme.cardBg} border-r ${theme.border} flex-shrink-0 overflow-y-auto`}>
          <nav className="p-4 space-y-1">
            {/* DASHBOARD */}
            <button 
              onClick={() => setCurrentView('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'dashboard' ? theme.activeBg : `${theme.textMuted} ${theme.hoverBg}`
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              <span className="font-medium">Dashboard</span>
            </button>

            {/* PROJECTS */}
            <button 
              onClick={() => setCurrentView('projects')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'projects' ? theme.activeBg : `${theme.textMuted} ${theme.hoverBg}`
              }`}
            >
              <Database className="w-5 h-5" />
              <span className="font-medium">Projects</span>
            </button>

            {/* PROCESS DATA */}
            <button 
              onClick={() => setCurrentView('process-data')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'process-data' ? theme.activeBg : `${theme.textMuted} ${theme.hoverBg}`
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="font-medium">Process Data</span>
            </button>

            {/* ANALYTICS GROUP */}
            <div>
              <button 
                onClick={() => toggleSection('analytics')}
                className={`w-full flex items-center justify-between px-4 py-3 ${theme.textMuted} ${theme.hoverBg} rounded-lg transition-colors`}
              >
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5" />
                  <span className="font-medium">Analytics</span>
                </div>
                {sidebarExpanded.analytics ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
              
              {sidebarExpanded.analytics && (
                <div className="ml-4 mt-1 space-y-1">
                  <button 
                    onClick={() => setCurrentView('emissions')}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                      currentView === 'emissions' ? theme.activeBg : `${theme.textMuted} ${theme.hoverBg}`
                    }`}
                  >
                    <span>Emissions</span>
                  </button>
                  <button 
                    onClick={() => setCurrentView('impact-summary')}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                      currentView === 'impact-summary' ? theme.activeBg : `${theme.textMuted} ${theme.hoverBg}`
                    }`}
                  >
                    <span>Impact Summary</span>
                  </button>
                  <button 
                    onClick={() => setCurrentView('hotspots')}
                    className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors ${
                      currentView === 'hotspots' ? theme.activeBg : `${theme.textMuted} ${theme.hoverBg}`
                    }`}
                  >
                    <span>Hotspots</span>
                  </button>
                </div>
              )}
            </div>

            {/* SCENARIOS */}
            <button 
              onClick={() => setCurrentView('scenarios')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'scenarios' ? theme.activeBg : `${theme.textMuted} ${theme.hoverBg}`
              }`}
            >
              <Zap className="w-5 h-5" />
              <span className="font-medium">Scenarios</span>
            </button>

            {/* OPTIMIZATION */}
            <button 
              onClick={() => setCurrentView('optimization')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'optimization' ? theme.activeBg : `${theme.textMuted} ${theme.hoverBg}`
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="font-medium">Optimization</span>
            </button>

            {/* REPORTS */}
            <button 
              onClick={() => setCurrentView('reports')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'reports' ? theme.activeBg : `${theme.textMuted} ${theme.hoverBg}`
              }`}
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Reports</span>
            </button>

            {/* AI ASSISTANT */}
            <button 
              onClick={() => setCurrentView('ai-assistant')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'ai-assistant' ? theme.activeBg : `${theme.textMuted} ${theme.hoverBg}`
              }`}
            >
              <Bot className="w-5 h-5" />
              <span className="font-medium">AI Assistant</span>
            </button>

            {/* UPLOADS */}
            <button 
              onClick={() => setCurrentView('uploads')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'uploads' ? theme.activeBg : `${theme.textMuted} ${theme.hoverBg}`
              }`}
            >
              <Upload className="w-5 h-5" />
              <span className="font-medium">Uploads</span>
            </button>

            {/* ISO COMPLIANCE */}
            <button 
              onClick={() => setCurrentView('iso-compliance')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                currentView === 'iso-compliance' ? theme.activeBg : `${theme.textMuted} ${theme.hoverBg}`
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">ISO Compliance</span>
            </button>
          </nav>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;