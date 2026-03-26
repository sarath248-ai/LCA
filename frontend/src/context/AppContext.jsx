import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  loginUser as apiLogin, 
  registerUser as apiRegister 
} from '../api/api';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // ✅ ADDED
  const [sidebarExpanded, setSidebarExpanded] = useState({
    analytics: true,
    processData: false
  });
  const [selectedProject, setSelectedProject] = useState(() => {
    const saved = localStorage.getItem('selectedProject');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedBatch, setSelectedBatch] = useState(() => {
    const saved = localStorage.getItem('selectedBatch');
    return saved ? JSON.parse(saved) : null;
  });
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('projects');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist dark mode
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Persist user
  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('selectedProject');
      localStorage.removeItem('selectedBatch');
      localStorage.removeItem('projects');
      setSelectedProject(null);
      setSelectedBatch(null);
      setProjects([]);
    }
  }, [user]);

  // Clear errors and success on view change
  useEffect(() => {
    clearMessages();
  }, [currentView]);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        clearMessages();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const toggleSection = (section) => {
    setSidebarExpanded(prev => ({ 
      ...prev, 
      [section]: !prev[section] 
    }));
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  const clearError = () => {
    setError(null);
  };

  const clearSuccess = () => {
    setSuccess(null);
  };

  const setSuccessMessage = (message) => {
    setSuccess(message);
    setError(null); // Clear any existing error
  };

  const setErrorMessage = (message) => {
    setError(message);
    setSuccess(null); // Clear any existing success
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    clearMessages();
    
    try {
      const response = await apiLogin({ email, password });

      localStorage.setItem("access_token", response.access_token);

      setUser({
        email,
        name: email.split("@")[0],
      });

      setSuccessMessage("Login successful!");
      setCurrentView("dashboard");
    } catch (err) {
      setUser(null);
      setErrorMessage(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (name, email, password) => {
    setLoading(true);
    clearMessages();
    
    try {
      await apiRegister({ name, email, password });
      
      const loginResponse = await apiLogin({ email, password });
      
      localStorage.setItem("access_token", loginResponse.access_token);
      
      setUser({
        email,
        name: name,
      });
      
      setSuccessMessage("Registration successful! Welcome!");
      setCurrentView('dashboard');
      
    } catch (err) {
      setUser(null);
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    setUser(null);
    setSuccessMessage("Logged out successfully");
    setCurrentView('dashboard');
  };

  const addProject = (project) => {
    setProjects(prev => {
      const updatedProjects = [...prev, project];
      setSelectedProject(project);
      return updatedProjects;
    });
    setSuccessMessage(`Project "${project.name}" created successfully!`);
  };

  const updateProject = (projectId, updates) => {
    setProjects(prev => 
      prev.map(project => 
        project.id === projectId ? { ...project, ...updates } : project
      )
    );
    
    if (selectedProject && selectedProject.id === projectId) {
      setSelectedProject(prev => ({ ...prev, ...updates }));
    }
    setSuccessMessage(`Project updated successfully!`);
  };

  const deleteProject = (projectId) => {
    setProjects(prev => prev.filter(project => project.id !== projectId));
    
    if (selectedProject && selectedProject.id === projectId) {
      setSelectedProject(null);
    }
    if (selectedBatch && selectedBatch.project_id === projectId) {
      setSelectedBatch(null);
    }
    setSuccessMessage(`Project deleted successfully!`);
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const value = {
    // State
    currentView,
    darkMode,
    user,
    loading,
    error,
    success, // ✅ EXPOSED
    sidebarExpanded,
    selectedProject,
    selectedBatch,
    projects,
    
    // Setters
    setCurrentView,
    setDarkMode,
    setUser,
    setError,
    setSuccess, // ✅ EXPOSED
    setSidebarExpanded,
    setSelectedProject,
    setSelectedBatch,
    setProjects,
    
    // Actions
    toggleSection,
    handleLogin,
    handleRegister,
    handleLogout,
    clearError,
    clearSuccess,
    clearMessages, // ✅ EXPOSED
    setSuccessMessage, // ✅ EXPOSED
    setErrorMessage, // ✅ EXPOSED
    addProject,
    updateProject,
    deleteProject,
    toggleDarkMode,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContext;