import React, { useEffect, useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Plus, AlertCircle, Upload, Bot, FileText, Zap, 
  TrendingUp, Settings, Trash2, BarChart3, Activity, 
  Database, ChevronDown, Download, Eye, X, MessageCircle,
  Send // ADDED: Send icon for AI Assistant
} from 'lucide-react';
import {
  getProjects,
  createProject,
  deleteProject,
  getEmissionsSummary,
  getEmissionsTrend,
  getImpactSummary,
  getHotspots,
  getOptimizationSuggestions,
  chatWithAI,
  chatWithAIEnhanced, // ADDED: Enhanced chat function
  getAvailableChatModels, // ADDED: Get available models
  uploadFile,
  downloadPdfReport,
  downloadExcelReport,
  createProcessData,
  getBatchesByProject,
  getBatchDetails,
  getBatchExplanation,
  getLCAMetrics,
  getLCAHotspots,
  getLCAImpacts,
  sensitivityAnalysis,
  getScenarioIntelligence,
  getUploads,
  deleteUpload,
  getProfile,
  updateProfile,
  // ADDED: New API functions for uploads enhancement
  downloadExcelTemplate,
  downloadCsvTemplate,
  processUploadedFile
} from '../api/api';
import ProcessDataForm from '../components/ProcessDataForm';
import CreateProjectModal from '../components/CreateProjectModal';
import ISOCompliance from './ISOCompliance'; // ADDED: ISO Compliance component

const Main = () => {
  const {
    currentView,
    user,
    darkMode,
    selectedProject,
    setSelectedProject,
    selectedBatch,
    setSelectedBatch,
    projects,
    setProjects,
    setCurrentView,
    setError, // Keep for compatibility but don't use for success
    setSuccessMessage, // ✅ ADDED: For success messages
    setErrorMessage,   // ✅ ADDED: For error messages
    setUser
  } = useApp();

  const [projectsLoading, setProjectsLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    kpis: [],
    trendData: [],
    impactSummary: null,
    hotspots: []
  });
  
  // Process Data State
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [batches, setBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState(null);
  
  // Analytics State
  const [emissionsData, setEmissionsData] = useState([]);
  const [emissionsLoading, setEmissionsLoading] = useState(false);
  const [impactSummaryData, setImpactSummaryData] = useState([]);
  const [impactSummaryLoading, setImpactSummaryLoading] = useState(false);
  const [hotspotsData, setHotspotsData] = useState([]);
  const [hotspotsLoading, setHotspotsLoading] = useState(false);
  
  // AI State
  const [aiMessage, setAiMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadsList, setUploadsList] = useState([]);
  const [uploadsLoading, setUploadsLoading] = useState(false);
  
  // Scenarios State
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioResults, setScenarioResults] = useState(null);
  const [showScenarioModal, setShowScenarioModal] = useState(false);
  const [scenarioIntelligenceData, setScenarioIntelligenceData] = useState(null);
  
  // Optimization State
  const [optimizationLoading, setOptimizationLoading] = useState(false);
  const [optimizationResults, setOptimizationResults] = useState(null);

  // Settings State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    company: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Project Modal State
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);

  // Uploads Enhanced State
  const [processingFileId, setProcessingFileId] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedFileForProcessing, setSelectedFileForProcessing] = useState(null);
  const [processingResult, setProcessingResult] = useState(null);

  // ADDED: Explanation Modal State
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [explanationData, setExplanationData] = useState(null);

  // ✅ FIXED: AI Assistant State moved to top level
  const [chatMode, setChatMode] = useState('context_aware');
  const [temperature, setTemperature] = useState(0.7);
  const [availableModels, setAvailableModels] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);

  const theme = {
    bg: darkMode ? 'bg-slate-900' : 'bg-slate-50',
    cardBg: darkMode ? 'bg-slate-800' : 'bg-white',
    text: darkMode ? 'text-slate-100' : 'text-slate-900',
    textMuted: darkMode ? 'text-slate-400' : 'text-slate-600',
    border: darkMode ? 'border-slate-700' : 'border-slate-200',
    hoverBg: darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-50',
    activeBg: darkMode ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-50 text-emerald-700',
    inputBg: darkMode ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300',
  };

  // ✅ FIXED: Load projects - Changed from user?.token to user
  useEffect(() => {
    const loadProjectsData = async () => {
      if (!user) return;

      try {
        setProjectsLoading(true);
        const data = await getProjects();
        setProjects(data || []);
      } catch (error) {
        console.error('Failed to load projects:', error);
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };
    
    loadProjectsData();
  }, [user, setProjects]);

  // ✅ FIXED: Load AI models when AI Assistant view is active
  useEffect(() => {
    if (currentView !== 'ai-assistant') return;

    const loadModels = async () => {
      try {
        const models = await getAvailableChatModels();
        setAvailableModels(models.modes);
      } catch (error) {
        console.error('Failed to load chat models:', error);
      }
    };

    loadModels();
  }, [currentView]);

  // Load batches when project changes
  const loadBatches = useCallback(async () => {
    if (!selectedProject?.id) {
      setBatches([]);
      return;
    }
    
    try {
      setBatchesLoading(true);
      const data = await getBatchesByProject(selectedProject.id);
      setBatches(data || []);
    } catch (error) {
      console.error('Failed to load batches:', error);
      setBatches([]);
    } finally {
      setBatchesLoading(false);
    }
  }, [selectedProject?.id]);

  useEffect(() => {
    loadBatches();
    setSelectedBatch(null);
    setSelectedBatchDetails(null);
  }, [selectedProject?.id, loadBatches, setSelectedBatch]);

  // Load dashboard data when batch is selected
  useEffect(() => {
    const loadDashboardAnalytics = async () => {
      if (!selectedBatch?.batch_id) return;
      
      try {
        setDashboardLoading(true);
        
        // Load batch-specific analytics
        const [hotspotsResponse, lcaMetrics] = await Promise.allSettled([
          getHotspots(selectedBatch.batch_id),
          getLCAMetrics(selectedBatch.batch_id)
        ]);

        const hotspots = hotspotsResponse.status === 'fulfilled' ? hotspotsResponse.value?.hotspots || [] : [];
        const metrics = lcaMetrics.status === 'fulfilled' ? lcaMetrics.value?.metrics : null;

        // Create KPIs from metrics
        const kpis = metrics ? [
          { label: 'Energy Intensity', value: metrics.energy_intensity_kwh_per_unit?.toFixed(2) || '0', unit: 'kWh/unit', change: 'N/A', trend: 'neutral' },
          { label: 'Water Intensity', value: metrics.water_intensity_l_per_unit?.toFixed(2) || '0', unit: 'L/unit', change: 'N/A', trend: 'neutral' },
          { label: 'Circularity Index', value: metrics.material_circularity_index?.toFixed(3) || '0', unit: 'index', change: 'N/A', trend: 'neutral' },
          { label: 'Resource Quality', value: metrics.resource_quality_index?.toFixed(2) || '0', unit: 'index', change: 'N/A', trend: 'neutral' }
        ] : getDefaultKPIs();

        // Generate trend data
        const trendData = Array.from({ length: 12 }, () => Math.floor(Math.random() * 30) + 70);

        setDashboardData({
          kpis,
          trendData,
          impactSummary: metrics,
          hotspots: hotspots.slice(0, 3)
        });
      } catch (error) {
        console.error('Failed to load dashboard analytics:', error);
        setDashboardData({
          kpis: getDefaultKPIs(),
          trendData: getDefaultTrendData(),
          impactSummary: null,
          hotspots: []
        });
      } finally {
        setDashboardLoading(false);
      }
    };

    loadDashboardAnalytics();
  }, [selectedBatch?.batch_id]);

  // Load profile data when settings view is active
  useEffect(() => {
    const loadProfile = async () => {
      if (currentView !== 'settings') return;
      try {
        const profile = await getProfile();
        setProfileData({
          name: profile.name || user.name || '',
          company: profile.company || ''
        });
      } catch (error) {
        console.error('Failed to load profile:', error);
      }
    };
    
    loadProfile();
  }, [currentView, user?.name]);

  // Load uploads when uploads view is active
  const loadUploads = useCallback(async () => {
    try {
      setUploadsLoading(true);
      const data = await getUploads();
      setUploadsList(data || []);
    } catch (error) {
      console.error('Failed to load uploads:', error);
      setUploadsList([]);
    } finally {
      setUploadsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentView === 'uploads') {
      loadUploads();
    }
  }, [currentView, loadUploads]);

  // Helper functions
  const getDefaultKPIs = () => [
    { label: 'Total CO₂', value: '2,456', unit: 'kg CO₂e', change: '+12%', trend: 'up' },
    { label: 'Energy Use', value: '12,340', unit: 'kWh', change: '+8%', trend: 'up' },
    { label: 'Water Use', value: '8,920', unit: 'L', change: '-3%', trend: 'down' },
    { label: 'Recycling Rate', value: '34', unit: '%', change: '+5%', trend: 'up' }
  ];

  const getDefaultTrendData = () => [65, 78, 82, 75, 88, 92, 85, 95, 88, 92, 98, 100];

  // ✅ FIXED: Handle create process data with correct success/error handling
  const handleCreateProcessData = async (formData) => {
    try {
      const response = await createProcessData(formData);
      loadBatches();
      setShowProcessForm(false);
      // ✅ Use setSuccessMessage for success
      setSuccessMessage(`Batch ${response.batch_id} created successfully!`);
    } catch (error) {
      console.error('Failed to create process data:', error);
      // ✅ Use setErrorMessage for errors
      setErrorMessage('Failed to create batch: ' + error.message);
    }
  };

  // Handle batch selection
  const handleSelectBatch = async (batch) => {
    setSelectedBatch(batch);
    try {
      const details = await getBatchDetails(batch.batch_id);
      setSelectedBatchDetails(details);
    } catch (error) {
      console.error('Failed to load batch details:', error);
    }
  };

  // Handle AI chat
  const handleSendAI = async (message = null) => {
    const msg = message || aiMessage;
    if (!msg.trim() || !selectedProject?.id) return;
    
    try {
      setAiLoading(true);
      const response = await chatWithAI(selectedProject.id, msg);
      setAiResponse(response.answer || response);
      if (!message) {
        setAiMessage('');
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setAiResponse('Error: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  // ✅ FIXED: Enhanced AI chat handler
  const handleSendEnhancedAI = async () => {
    const msg = aiMessage.trim();
    if (!msg || !selectedProject?.id || aiLoading) return;
    
    // Add user message to history
    const userMessage = {
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString()
    };
    
    setConversationHistory(prev => [...prev, userMessage]);
    setAiLoading(true);
    
    try {
      const response = await chatWithAIEnhanced(selectedProject.id, msg, chatMode, temperature);
      
      // Add AI response to history
      const aiMessageObj = {
        role: 'assistant',
        content: response.answer,
        mode: response.mode,
        model: response.model_used,
        timestamp: new Date().toISOString()
      };
      
      setConversationHistory(prev => [...prev, aiMessageObj]);
      setAiResponse(response.answer);
      setAiMessage('');
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setErrorMessage('Failed to get AI response: ' + error.message);
    } finally {
      setAiLoading(false);
    }
  };

  // ✅ FIXED: Clear conversation function
  const clearConversation = () => {
    setConversationHistory([]);
    setAiResponse('');
  };

  // Handle scenario intelligence
  const handleScenarioIntelligence = async () => {
    if (!selectedBatch?.batch_id) {
      setErrorMessage('Please select a batch first');
      return;
    }
    
    try {
      const intelligence = await getScenarioIntelligence(selectedBatch.batch_id);
      setScenarioIntelligenceData(intelligence);
      setShowScenarioModal(true);
    } catch (error) {
      console.error('Failed to get scenario intelligence:', error);
      setErrorMessage('Failed to get scenario intelligence: ' + error.message);
    }
  };

  // ✅ FIXED: Handle file upload with correct success/error handling
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      const result = await uploadFile(file);
      clearInterval(interval);
      setUploadProgress(100);
      
      // ✅ Use setSuccessMessage for success
      setSuccessMessage(`File uploaded successfully: ${result.filename}`);
      loadUploads();
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 1000);
      
    } catch (error) {
      console.error('Upload failed:', error);
      // ✅ Use setErrorMessage for errors
      setErrorMessage('Upload failed: ' + error.message);
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle report download
  const handleDownloadReport = async (type) => {
    if (!selectedBatch?.batch_id) {
      setErrorMessage('Please select a batch first');
      return;
    }
    
    try {
      let blob;
      if (type === 'pdf') {
        blob = await downloadPdfReport(selectedBatch.batch_id);
      } else {
        blob = await downloadExcelReport(selectedBatch.batch_id);
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_${selectedBatch.batch_id}_${new Date().toISOString().split('T')[0]}.${type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
      setErrorMessage('Failed to download report: ' + error.message);
    }
  };

  // Handle sensitivity analysis
  const handleSensitivityAnalysis = async () => {
    if (!selectedBatch?.batch_id) {
      setErrorMessage('Please select a batch first');
      return;
    }
    
    try {
      setScenarioLoading(true);
      const results = await sensitivityAnalysis(selectedBatch.batch_id);
      setScenarioResults(results);
    } catch (error) {
      console.error('Sensitivity analysis failed:', error);
      setErrorMessage('Sensitivity analysis failed: ' + error.message);
    } finally {
      setScenarioLoading(false);
    }
  };

  // Handle optimization
  const handleOptimization = async () => {
    if (!selectedBatch?.batch_id) {
      setErrorMessage('Please select a batch first');
      return;
    }
    
    try {
      setOptimizationLoading(true);
      const results = await getOptimizationSuggestions(selectedBatch.batch_id);
      setOptimizationResults(results);
    } catch (error) {
      console.error('Optimization failed:', error);
      setErrorMessage('Optimization failed: ' + error.message);
    } finally {
      setOptimizationLoading(false);
    }
  };

  // ✅ FIXED: Handle create project with correct success/error handling
  const handleCreateProject = async (projectData) => {
    try {
      const newProject = await createProject(projectData);
      setProjects(prev => [...prev, newProject]);
      setSelectedProject(newProject);
      setCurrentView('dashboard');
      // ✅ Use setSuccessMessage for success
      setSuccessMessage('Project created successfully!');
    } catch (error) {
      console.error('Failed to create project:', error);
      throw new Error(error.message || 'Failed to create project');
    }
  };

  // Handle delete project
  const handleDeleteProject = async (projectId, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await deleteProject(projectId);
      setProjects(prev => prev.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      setErrorMessage('Failed to delete project');
    }
  };

  // Handle delete upload
  const handleDeleteUpload = async (uploadId) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await deleteUpload(uploadId);
      loadUploads();
    } catch (error) {
      console.error('Delete failed:', error);
      setErrorMessage('Failed to delete file: ' + error.message);
    }
  };

  // ✅ FIXED: Handle save profile with correct success/error handling
  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true);
      await updateProfile(profileData);
      // Update user in context
      setUser(prev => ({
        ...prev,
        name: profileData.name
      }));
      // ✅ Use setSuccessMessage for success
      setSuccessMessage('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      setErrorMessage('Failed to save profile: ' + error.message);
    } finally {
      setSavingProfile(false);
    }
  };

  // ✅ FIXED: Handle download template with correct success/error handling
  const handleDownloadTemplate = async (type) => {
    try {
      if (type === 'excel') {
        const blob = await downloadExcelTemplate();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ecometal_process_data_template.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const text = await downloadCsvTemplate();
        const blob = new Blob([text], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ecometal_process_data_template.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
      
      // ✅ Use setSuccessMessage for success
      setSuccessMessage('Template downloaded successfully');
    } catch (error) {
      console.error('Template download failed:', error);
      setErrorMessage('Failed to download template: ' + error.message);
    }
  };
  
  // Handle process file
  const handleProcessFile = async (fileId) => {
    if (!selectedProject) {
      setErrorMessage('Please select a project first');
      return;
    }
    
    setSelectedFileForProcessing(fileId);
    setShowProcessModal(true);
  };
  
  // ✅ FIXED: Confirm file processing with correct success/error handling
  const confirmProcessFile = async () => {
    if (!selectedFileForProcessing || !selectedProject) return;
    
    try {
      setProcessingFileId(selectedFileForProcessing);
      const result = await processUploadedFile(
        selectedFileForProcessing, 
        selectedProject.id
      );
      
      setProcessingResult(result);
      // ✅ Use setSuccessMessage for success
      setSuccessMessage(`Successfully processed ${result.batches_created?.length || 0} batches`);
      loadUploads(); // Refresh uploads list
      
      // Show warnings if any
      if (result.warnings && result.warnings.length > 0) {
        setTimeout(() => {
          setErrorMessage(`Processing completed with ${result.warnings.length} warnings`);
        }, 2000);
      }
      
    } catch (error) {
      console.error('File processing failed:', error);
      setErrorMessage('Processing failed: ' + error.message);
    } finally {
      setProcessingFileId(null);
      setShowProcessModal(false);
      setSelectedFileForProcessing(null);
    }
  };

  // PROJECTS VIEW
  if (currentView === 'projects') {
    return (
      <div className="p-8">
        {showCreateProjectModal && (
          <CreateProjectModal
            onClose={() => setShowCreateProjectModal(false)}
            onCreate={handleCreateProject}
            darkMode={darkMode}
          />
        )}
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${theme.text}`}>Projects</h1>
            <p className={`${theme.textMuted} mt-1`}>Manage your life cycle analysis projects</p>
          </div>
          <button 
            onClick={() => setShowCreateProjectModal(true)}
            className="flex items-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New Project</span>
          </button>
        </div>

        {projectsLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map(project => (
              <div 
                key={project.id}
                className={`${theme.cardBg} rounded-lg border ${theme.border} p-6 hover:shadow-lg transition-shadow cursor-pointer group relative`}
                onClick={() => {
                  setSelectedProject(project);
                  setCurrentView('dashboard');
                }}
              >
                <button
                  onClick={(e) => handleDeleteProject(project.id, e)}
                  className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 bg-white dark:bg-slate-800 rounded-full shadow-md"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${theme.text} mb-1`}>{project.name}</h3>
                    <div className="space-y-1">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                      }`}>
                        Metal: {project.metal_type || 'Not specified'}
                      </span>
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {project.boundary || 'Cradle to Gate'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${theme.textMuted}`}>Created</span>
                    <span className={`text-sm font-medium ${theme.text}`}>
                      {project.created_at 
                        ? new Date(project.created_at).toLocaleDateString()
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className={`text-xs ${theme.textMuted}`}>
                    ID: {project.id?.substring(0, 8)}...
                  </div>
                </div>
              </div>
            ))}

            {/* EMPTY STATE CARD */}
            <div 
              className={`${darkMode ? 'bg-slate-800' : 'bg-slate-50'} rounded-lg border-2 border-dashed ${darkMode ? 'border-slate-600' : 'border-slate-300'} p-6 flex flex-col items-center justify-center text-center hover:border-slate-400 transition-colors cursor-pointer`}
              onClick={() => setShowCreateProjectModal(true)}
            >
              <Plus className={`w-12 h-12 ${theme.textMuted} mb-3`} />
              <h3 className={`text-lg font-medium ${theme.text} mb-1`}>Create New Project</h3>
              <p className={`text-sm ${theme.textMuted}`}>Start a new LCA analysis</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // PROCESS DATA VIEW
  if (currentView === 'process-data') {
    return (
      <>
        <div className="p-8">
          {showProcessForm && (
            <ProcessDataForm
              projectId={selectedProject?.id}
              onSubmit={handleCreateProcessData}
              onCancel={() => setShowProcessForm(false)}
              darkMode={darkMode}
            />
          )}
          
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className={`text-3xl font-bold ${theme.text}`}>Process Data</h1>
              <p className={`${theme.textMuted} mt-1`}>
                {selectedProject?.name ? `Batches for ${selectedProject.name}` : 'Select a project'}
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {selectedProject && (
                <button 
                  onClick={() => setShowProcessForm(true)}
                  className="flex items-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">New Batch</span>
                </button>
              )}
              {!selectedProject && (
                <button 
                  onClick={() => setCurrentView('projects')}
                  className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Database className="w-5 h-5" />
                  <span className="font-medium">Select Project</span>
                </button>
              )}
            </div>
          </div>

          {!selectedProject ? (
            <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-12 text-center`}>
              <AlertCircle className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
              <h3 className={`text-xl font-semibold ${theme.text} mb-2`}>No Project Selected</h3>
              <p className={`${theme.textMuted} mb-6`}>Please select a project to view process data</p>
              <button 
                onClick={() => setCurrentView('projects')}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Select Project
              </button>
            </div>
          ) : batchesLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
          ) : (
            <>
              {/* BATCHES LIST */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-semibold ${theme.text}`}>Production Batches</h2>
                  <span className={`text-sm ${theme.textMuted}`}>{batches.length} batches</span>
                </div>
                
                {batches.length === 0 ? (
                  <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-12 text-center`}>
                    <Database className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
                    <h3 className={`text-xl font-semibold ${theme.text} mb-2`}>No Batches Yet</h3>
                    <p className={`${theme.textMuted} mb-6`}>Create your first production batch</p>
                    <button 
                      onClick={() => setShowProcessForm(true)}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Create First Batch
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {batches.map(batch => (
                      <div 
                        key={batch.batch_id}
                        className={`${theme.cardBg} rounded-lg border ${theme.border} p-6 hover:shadow-lg transition-shadow cursor-pointer ${
                          selectedBatch?.batch_id === batch.batch_id ? 'ring-2 ring-emerald-500' : ''
                        }`}
                        onClick={() => handleSelectBatch(batch)}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className={`text-lg font-semibold ${theme.text} mb-1`}>{batch.batch_id}</h3>
                            <div className="space-y-1">
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {batch.material_type}
                              </span>
                              <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {batch.energy_source_type}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className={`text-xs ${theme.textMuted}`}>CO₂</span>
                              <div className={`text-sm font-medium ${theme.text}`}>
                                {batch.co2_emissions_kg ? `${batch.co2_emissions_kg.toFixed(1)} kg` : 'N/A'}
                              </div>
                            </div>
                            <div>
                              <span className={`text-xs ${theme.textMuted}`}>Production</span>
                              <div className={`text-sm font-medium ${theme.text}`}>
                                {batch.production_volume ? `${batch.production_volume} kg` : 'N/A'}
                              </div>
                            </div>
                          </div>
                          
                          <div className={`text-xs ${theme.textMuted} pt-2 border-t ${theme.border}`}>
                            Created: {new Date(batch.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* SELECTED BATCH DETAILS */}
              {selectedBatchDetails && (
                <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-xl font-semibold ${theme.text}`}>Batch Details: {selectedBatchDetails.batch_id}</h2>
                    <div className="flex space-x-2">
                      <button 
                        onClick={async () => {
                          try {
                            const explanation = await getBatchExplanation(selectedBatchDetails.batch_id);
                            setExplanationData(explanation);
                            setShowExplanationModal(true);
                          } catch (error) {
                            console.error('Failed to get explanation:', error);
                            setErrorMessage('Failed to get explanation: ' + error.message);
                          }
                        }}
                        className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Explain</span>
                      </button>
                      <button 
                        onClick={() => handleDownloadReport('pdf')}
                        className="flex items-center space-x-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                      <div className={`text-sm ${theme.textMuted} mb-1`}>CO₂ Emissions</div>
                      <div className={`text-2xl font-bold ${theme.text}`}>
                        {selectedBatchDetails.co2_emissions_kg?.toFixed(1) || '0'} kg
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                      <div className={`text-sm ${theme.textMuted} mb-1`}>Energy Intensity</div>
                      <div className={`text-2xl font-bold ${theme.text}`}>
                        {selectedBatchDetails.energy_intensity_kwh_per_ton?.toFixed(1) || '0'} kWh/t
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                      <div className={`text-sm ${theme.textMuted} mb-1`}>Carbon Intensity</div>
                      <div className={`text-2xl font-bold ${theme.text}`}>
                        {selectedBatchDetails.carbon_intensity_kg_per_ton?.toFixed(1) || '0'} kg/t
                      </div>
                    </div>
                    <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                      <div className={`text-sm ${theme.textMuted} mb-1`}>Recycling Efficiency</div>
                      <div className={`text-2xl font-bold ${theme.text}`}>
                        {selectedBatchDetails.recycling_efficiency_score?.toFixed(1) || '0'}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className={`font-medium ${theme.text} mb-2`}>Process Inputs</h3>
                      <div className={`text-sm ${theme.textMuted} space-y-1`}>
                        <div className="flex justify-between">
                          <span>Raw Material:</span>
                          <span className={theme.text}>{selectedBatchDetails.raw_material_quantity} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Energy:</span>
                          <span className={theme.text}>{selectedBatchDetails.energy_consumption_kwh} kWh</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Water:</span>
                          <span className={theme.text}>{selectedBatchDetails.water_consumption_liters} L</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recycling Rate:</span>
                          <span className={theme.text}>{selectedBatchDetails.recycling_rate_percentage}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className={`font-medium ${theme.text} mb-2`}>Additional Emissions</h3>
                      <div className={`text-sm ${theme.textMuted} space-y-1`}>
                        <div className="flex justify-between">
                          <span>SOx:</span>
                          <span className={theme.text}>{selectedBatchDetails.sox_emissions_kg?.toFixed(2) || '0'} kg</span>
                        </div>
                        <div className="flex justify-between">
                          <span>NOx:</span>
                          <span className={theme.text}>{selectedBatchDetails.nox_emissions_kg?.toFixed(2) || '0'} kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Explanation Modal */}
        {showExplanationModal && explanationData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${theme.cardBg} rounded-lg shadow-xl w-full max-w-2xl`}>
              <div className="p-6 border-b flex items-center justify-between">
                <h2 className={`text-xl font-bold ${theme.text}`}>SHAP Feature Importance</h2>
                <button
                  onClick={() => setShowExplanationModal(false)}
                  className={`p-2 ${theme.textMuted} hover:${darkMode ? 'bg-slate-700' : 'bg-slate-100'} rounded-lg`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <p className={`${theme.textMuted} mb-4`}>Top contributors to CO₂ emissions prediction:</p>
                <div className="space-y-3">
                  {explanationData.explanation?.slice(0, 10).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className={`font-medium ${theme.text}`}>{item.feature}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${item.contribution > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(Math.abs(item.contribution) / Math.max(...explanationData.explanation.map(e => Math.abs(e.contribution))) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${item.contribution > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {item.contribution > 0 ? '+' : ''}{item.contribution.toFixed(3)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // DASHBOARD VIEW
  if (currentView === 'dashboard') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${theme.text}`}>Dashboard Overview</h1>
              <p className={`${theme.textMuted} mt-1`}>
                {selectedProject?.name || 'Select a project to view dashboard'}
              </p>
              {selectedBatch && (
                <div className="flex items-center mt-2">
                  <span className={`text-sm ${theme.textMuted}`}>Active Batch:</span>
                  <span className={`text-sm font-medium ml-2 px-2 py-1 rounded ${darkMode ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                    {selectedBatch.batch_id}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {selectedProject && (
                <button 
                  onClick={() => setCurrentView('process-data')}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Activity className="w-4 h-4" />
                  <span>Manage Batches</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {!selectedProject ? (
          <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-12 text-center`}>
            <AlertCircle className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${theme.text} mb-2`}>No Project Selected</h3>
            <p className={`${theme.textMuted} mb-6`}>Please select or create a project to view the dashboard</p>
            <button 
              onClick={() => setCurrentView('projects')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Browse Projects
            </button>
          </div>
        ) : !selectedBatch ? (
          <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-12 text-center`}>
            <Database className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${theme.text} mb-2`}>No Batch Selected</h3>
            <p className={`${theme.textMuted} mb-6`}>Please select a batch to view analytics</p>
            <button 
              onClick={() => setCurrentView('process-data')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Select Batch
            </button>
          </div>
        ) : dashboardLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <>
            {/* KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {dashboardData.kpis.map((kpi, idx) => (
                <div key={idx} className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
                  <div className="flex items-start justify-between mb-4">
                    <span className={`text-sm font-medium ${theme.textMuted}`}>{kpi.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      kpi.trend === 'up' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' 
                      : kpi.trend === 'down' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
                    }`}>
                      {kpi.change}
                    </span>
                  </div>
                  <div className={`text-3xl font-bold ${theme.text} mb-1`}>{kpi.value}</div>
                  <div className={`text-sm ${theme.textMuted}`}>{kpi.unit}</div>
                </div>
              ))}
            </div>

            {/* TREND CHART */}
            <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6 mb-8`}>
              <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>Emissions Trend</h2>
              <div className="h-64 flex items-end justify-between space-x-2">
                {dashboardData.trendData.map((height, idx) => (
                  <div 
                    key={idx} 
                    className="flex-1 bg-emerald-500 rounded-t hover:bg-emerald-600 transition-colors" 
                    style={{ height: `${height}%` }}
                    title={`Value: ${height}`}
                  ></div>
                ))}
              </div>
              <div className={`flex justify-between mt-2 text-xs ${theme.textMuted}`}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                  .slice(0, dashboardData.trendData.length)
                  .map(month => (
                    <span key={month}>{month}</span>
                  ))
                }
              </div>
            </div>

            {/* HOTSPOTS SUMMARY */}
            {dashboardData.hotspots.length > 0 && (
              <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
                <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>Top Impact Hotspots</h2>
                <div className="space-y-3">
                  {dashboardData.hotspots.slice(0, 3).map((hotspot, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className={`text-sm ${theme.text}`}>{hotspot.parameter}</span>
                      <span className={`text-sm font-medium ${theme.textMuted}`}>
                        {hotspot.impact_kg?.toFixed(2) || hotspot.contribution} {hotspot.impact_kg ? 'kg' : '%'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // EMISSIONS VIEW
  if (currentView === 'emissions') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme.text}`}>Emissions Analysis</h1>
          <p className={`${theme.textMuted} mt-1`}>
            {selectedBatch ? `Detailed emissions for batch ${selectedBatch.batch_id}` : 'Select a batch'}
          </p>
        </div>

        {!selectedBatch ? (
          <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-12 text-center`}>
            <AlertCircle className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${theme.text} mb-2`}>No Batch Selected</h3>
            <p className={`${theme.textMuted} mb-6`}>Please select a batch to view emissions data</p>
            <button 
              onClick={() => setCurrentView('process-data')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Select Batch
            </button>
          </div>
        ) : emissionsLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : selectedBatchDetails ? (
          <>
            {/* EMISSIONS SUMMARY */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-sm font-medium ${theme.textMuted}`}>CO₂ Emissions</span>
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                </div>
                <div className={`text-3xl font-bold ${theme.text} mb-1`}>
                  {selectedBatchDetails.co2_emissions_kg?.toFixed(1) || '0'}
                </div>
                <div className={`text-sm ${theme.textMuted}`}>kg CO₂</div>
              </div>
              
              <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-sm font-medium ${theme.textMuted}`}>SOx Emissions</span>
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                </div>
                <div className={`text-3xl font-bold ${theme.text} mb-1`}>
                  {selectedBatchDetails.sox_emissions_kg?.toFixed(2) || '0'}
                </div>
                <div className={`text-sm ${theme.textMuted}`}>kg SOx</div>
              </div>
              
              <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <span className={`text-sm font-medium ${theme.textMuted}`}>NOx Emissions</span>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                </div>
                <div className={`text-3xl font-bold ${theme.text} mb-1`}>
                  {selectedBatchDetails.nox_emissions_kg?.toFixed(2) || '0'}
                </div>
                <div className={`text-sm ${theme.textMuted}`}>kg NOx</div>
              </div>
            </div>

            {/* DETAILED BREAKDOWN */}
            <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
              <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>Emissions Breakdown</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={theme.text}>Carbon Intensity</span>
                    <span className={`font-medium ${theme.text}`}>
                      {selectedBatchDetails.carbon_intensity_kg_per_ton?.toFixed(2) || '0'} kg/t
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full"
                      style={{ width: `${Math.min(selectedBatchDetails.carbon_intensity_kg_per_ton || 0, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={theme.text}>Energy Contribution</span>
                    <span className={`font-medium ${theme.text}`}>
                      {((selectedBatchDetails.energy_consumption_kwh || 0) / 10000 * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full"
                      style={{ width: `${Math.min((selectedBatchDetails.energy_consumption_kwh || 0) / 10000 * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    );
  }

  // HOTSPOTS VIEW
  if (currentView === 'hotspots') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme.text}`}>Hotspot Analysis</h1>
          <p className={`${theme.textMuted} mt-1`}>Identify key areas for improvement</p>
        </div>
        
        {!selectedBatch ? (
          <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-12 text-center`}>
            <AlertCircle className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${theme.text} mb-2`}>No Batch Selected</h3>
            <p className={`${theme.textMuted} mb-6`}>Please select a batch to view hotspots</p>
            <button 
              onClick={() => setCurrentView('process-data')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Select Batch
            </button>
          </div>
        ) : hotspotsLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <>
            <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6 mb-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${theme.text}`}>Environmental Hotspots</h2>
                <button 
                  onClick={async () => {
                    try {
                      const hotspots = await getHotspots(selectedBatch.batch_id);
                      setHotspotsData(hotspots.hotspots || []);
                    } catch (error) {
                      console.error('Failed to load hotspots:', error);
                    }
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Refresh
                </button>
              </div>
              
              <div className="space-y-4">
                {hotspotsData.length > 0 ? (
                  hotspotsData.map((hotspot, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border ${theme.border}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className={`font-medium ${theme.text}`}>{hotspot.parameter}</h4>
                          <span className={`text-sm ${theme.textMuted}`}>{hotspot.reason || 'High impact contributor'}</span>
                        </div>
                        <span className={`text-lg font-bold ${
                          hotspot.severity === 'HIGH' ? 'text-red-600' :
                          hotspot.severity === 'MEDIUM' ? 'text-orange-600' : 'text-yellow-600'
                        }`}>
                          {hotspot.score?.toFixed(2) || hotspot.impact_kg?.toFixed(2) || '0'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${
                          hotspot.severity === 'HIGH' ? 'text-red-500' :
                          hotspot.severity === 'MEDIUM' ? 'text-orange-500' : 'text-yellow-500'
                        }`}>
                          Severity: {hotspot.severity}
                        </span>
                        <span className={`text-xs ${theme.textMuted}`}>
                          Contribution: {hotspot.direction || 'increase'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className={theme.textMuted}>No hotspot data available</p>
                    <button 
                      onClick={async () => {
                        try {
                          const hotspots = await getHotspots(selectedBatch.batch_id);
                          setHotspotsData(hotspots.hotspots || []);
                        } catch (error) {
                          console.error('Failed to load hotspots:', error);
                        }
                      }}
                      className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Load Hotspots
                    </button>
                  </div>
                )}
              </div>
            </div>

            {hotspotsData.length > 0 && (
              <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
                <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>Recommendations</h3>
                <div className="space-y-3">
                  {hotspotsData.slice(0, 3).map((hotspot, idx) => (
                    <div key={idx} className={`p-4 rounded-lg ${
                      hotspot.severity === 'HIGH' ? (darkMode ? 'bg-red-900/30' : 'bg-red-50') :
                      hotspot.severity === 'MEDIUM' ? (darkMode ? 'bg-orange-900/30' : 'bg-orange-50') :
                      (darkMode ? 'bg-blue-900/30' : 'bg-blue-50')
                    } border ${
                      hotspot.severity === 'HIGH' ? (darkMode ? 'border-red-800' : 'border-red-200') :
                      hotspot.severity === 'MEDIUM' ? (darkMode ? 'border-orange-800' : 'border-orange-200') :
                      (darkMode ? 'border-blue-800' : 'border-blue-200')
                    }`}>
                      <h4 className={`font-medium ${
                        hotspot.severity === 'HIGH' ? (darkMode ? 'text-red-300' : 'text-red-700') :
                        hotspot.severity === 'MEDIUM' ? (darkMode ? 'text-orange-300' : 'text-orange-700') :
                        (darkMode ? 'text-blue-300' : 'text-blue-700')
                      } mb-1`}>
                        {hotspot.parameter.replace(/_/g, ' ').toUpperCase()}
                      </h4>
                      <p className={`text-sm ${theme.textMuted}`}>
                        {hotspot.severity === 'HIGH' ? 'High priority - Immediate action recommended' :
                         hotspot.severity === 'MEDIUM' ? 'Medium priority - Consider optimization' :
                         'Low priority - Monitor regularly'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // IMPACT SUMMARY VIEW
  if (currentView === 'impact-summary') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme.text}`}>Impact Summary</h1>
          <p className={`${theme.textMuted} mt-1`}>LCA impact category breakdown</p>
        </div>
        
        {!selectedBatch ? (
          <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-12 text-center`}>
            <AlertCircle className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${theme.text} mb-2`}>No Batch Selected</h3>
            <p className={`${theme.textMuted} mb-6`}>Please select a batch to view impact summary</p>
            <button 
              onClick={() => setCurrentView('process-data')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Select Batch
            </button>
          </div>
        ) : impactSummaryLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <>
            <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6 mb-6`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${theme.text}`}>Impact Category Analysis</h2>
                <button 
                  onClick={async () => {
                    try {
                      const impacts = await getLCAImpacts(selectedBatch.batch_id);
                      setImpactSummaryData([
                        { category: 'Global Warming', value: impacts.impacts?.global_warming_kg_co2 || 0, unit: 'kg CO₂e', contribution: 42 },
                        { category: 'Energy Intensity', value: impacts.impacts?.energy_intensity_kwh_per_ton || 0, unit: 'kWh/t', contribution: 28 },
                        { category: 'Water Intensity', value: impacts.impacts?.water_intensity_l_per_ton || 0, unit: 'L/t', contribution: 18 },
                        { category: 'Circularity Index', value: impacts.impacts?.material_circularity_index || 0, unit: 'index', contribution: 12 },
                      ]);
                    } catch (error) {
                      console.error('Failed to load impacts:', error);
                    }
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Load Impacts
                </button>
              </div>
              
              <div className="space-y-4">
                {impactSummaryData.length > 0 ? (
                  impactSummaryData.map((impact, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${theme.text}`}>{impact.category}</span>
                        <span className={`text-sm ${theme.textMuted}`}>
                          {typeof impact.value === 'number' ? impact.value.toLocaleString() : impact.value} {impact.unit}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${impact.contribution}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm ${theme.textMuted}`}>{impact.contribution}%</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className={theme.textMuted}>No impact data available</p>
                    <button 
                      onClick={async () => {
                        try {
                          const impacts = await getLCAImpacts(selectedBatch.batch_id);
                          setImpactSummaryData([
                            { category: 'Global Warming', value: impacts.impacts?.global_warming_kg_co2 || 2456, unit: 'kg CO₂e', contribution: 42 },
                            { category: 'Energy Intensity', value: impacts.impacts?.energy_intensity_kwh_per_ton || 12340, unit: 'kWh/t', contribution: 28 },
                            { category: 'Water Intensity', value: impacts.impacts?.water_intensity_l_per_ton || 8920, unit: 'L/t', contribution: 18 },
                            { category: 'Circularity Index', value: impacts.impacts?.material_circularity_index || 0.34, unit: 'index', contribution: 12 },
                          ]);
                        } catch (error) {
                          console.error('Failed to load impacts:', error);
                        }
                      }}
                      className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Load Impact Data
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
              <h3 className={`text-lg font-semibold ${theme.text} mb-4`}>Impact Categories Explained</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <h4 className={`font-medium ${theme.text} mb-2`}>Global Warming</h4>
                  <p className={`text-sm ${theme.textMuted}`}>Measures contribution to climate change through greenhouse gas emissions</p>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <h4 className={`font-medium ${theme.text} mb-2`}>Energy Intensity</h4>
                  <p className={`text-sm ${theme.textMuted}`}>Total energy consumption per unit of production</p>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <h4 className={`font-medium ${theme.text} mb-2`}>Water Intensity</h4>
                  <p className={`text-sm ${theme.textMuted}`}>Freshwater consumption per unit of production</p>
                </div>
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                  <h4 className={`font-medium ${theme.text} mb-2`}>Circularity Index</h4>
                  <p className={`text-sm ${theme.textMuted}`}>Measure of material reuse and recycling efficiency</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // SCENARIOS VIEW
  if (currentView === 'scenarios') {
    return (
      <>
        <div className="p-8">
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${theme.text}`}>Scenarios</h1>
            <p className={`${theme.textMuted} mt-1`}>Simulate different scenarios and analyze impacts</p>
          </div>
          
          {!selectedBatch ? (
            <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-12 text-center`}>
              <AlertCircle className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
              <h3 className={`text-xl font-semibold ${theme.text} mb-2`}>No Batch Selected</h3>
              <p className={`${theme.textMuted} mb-6`}>Please select a batch to run scenarios</p>
              <button 
                onClick={() => setCurrentView('process-data')}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Select Batch
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
                <Zap className="w-12 h-12 text-emerald-600 mb-4" />
                <h2 className={`text-lg font-semibold ${theme.text} mb-2`}>Sensitivity Analysis</h2>
                <p className={`${theme.textMuted} mb-4`}>Analyze how changes in process parameters affect emissions</p>
                
                <button 
                  onClick={handleSensitivityAnalysis}
                  disabled={scenarioLoading}
                  className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {scenarioLoading ? 'Analyzing...' : 'Run Sensitivity Analysis'}
                </button>
                
                {scenarioResults && (
                  <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                    <h3 className={`font-medium ${theme.text} mb-2`}>Results:</h3>
                    <div className="space-y-2">
                      {scenarioResults.sensitivity?.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className={`text-sm ${theme.text}`}>{item.parameter}</span>
                          <span className={`text-sm ${item.delta_percent > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {item.delta_percent > 0 ? '+' : ''}{item.delta_percent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
                <TrendingUp className="w-12 h-12 text-blue-600 mb-4" />
                <h2 className={`text-lg font-semibold ${theme.text} mb-2`}>Scenario Intelligence</h2>
                <p className={`${theme.textMuted} mb-4`}>Get AI-powered insights for scenario planning</p>
                
                <button 
                  onClick={handleScenarioIntelligence}
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Get Scenario Insights
                </button>
                
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <h3 className={`font-medium ${theme.text} mb-2`}>Common Scenarios:</h3>
                  <ul className={`text-sm ${theme.textMuted} space-y-1`}>
                    <li>• Increase recycling rate by 20%</li>
                    <li>• Switch to renewable energy</li>
                    <li>• Reduce energy consumption by 15%</li>
                    <li>• Improve material efficiency</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scenario Intelligence Modal */}
        {showScenarioModal && scenarioIntelligenceData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${theme.cardBg} rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden`}>
              <div className="p-6 border-b flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-bold ${theme.text}`}>Scenario Intelligence</h2>
                  <p className={`text-sm ${theme.textMuted}`}>Decision insights for batch {selectedBatch?.batch_id}</p>
                </div>
                <button
                  onClick={() => setShowScenarioModal(false)}
                  className={`p-2 ${theme.textMuted} hover:${darkMode ? 'bg-slate-700' : 'bg-slate-100'} rounded-lg`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-medium ${theme.text}`}>Base CO₂ Emissions</span>
                    <span className={`text-xl font-bold ${theme.text}`}>
                      {scenarioIntelligenceData.scenario_intelligence?.base_co2?.toFixed(1) || '0'} kg
                    </span>
                  </div>
                </div>
                
                <h3 className={`font-medium ${theme.text} mb-3`}>Key Decision Levers:</h3>
                <div className="space-y-3">
                  {scenarioIntelligenceData.scenario_intelligence?.decision_levers?.map((lever, idx) => (
                    <div key={idx} className={`p-4 border rounded-lg ${
                      lever.priority === 'HIGH' ? (darkMode ? 'border-red-800 bg-red-900/20' : 'border-red-200 bg-red-50') :
                      lever.priority === 'MEDIUM' ? (darkMode ? 'border-orange-800 bg-orange-900/20' : 'border-orange-200 bg-orange-50') :
                      (darkMode ? 'border-blue-800 bg-blue-900/20' : 'border-blue-200 bg-blue-50')
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${theme.text}`}>{lever.parameter}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          lever.priority === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300' :
                          lever.priority === 'MEDIUM' ? 'bg-orange-100 text-orange-700 dark:bg-orange-800 dark:text-orange-300' :
                          'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300'
                        }`}>
                          {lever.priority} Priority
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${theme.textMuted}`}>Impact: {lever.impact_percent}%</span>
                        <span className={`text-sm ${
                          lever.direction === 'increase' ? 'text-red-600' : 'text-emerald-600'
                        }`}>
                          {lever.direction === 'increase' ? 'Increases emissions' : 'Reduces emissions'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // OPTIMIZATION VIEW
  if (currentView === 'optimization') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme.text}`}>Optimization</h1>
          <p className={`${theme.textMuted} mt-1`}>Find opportunities to reduce environmental impact</p>
        </div>
        
        {!selectedBatch ? (
          <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-12 text-center`}>
            <AlertCircle className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${theme.text} mb-2`}>No Batch Selected</h3>
            <p className={`${theme.textMuted} mb-6`}>Please select a batch for optimization</p>
            <button 
              onClick={() => setCurrentView('process-data')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Select Batch
            </button>
          </div>
        ) : (
          <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className={`text-lg font-semibold ${theme.text}`}>Optimization Suggestions</h2>
                <p className={`${theme.textMuted}`}>AI-powered recommendations for process improvement</p>
              </div>
              <button 
                onClick={handleOptimization}
                disabled={optimizationLoading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {optimizationLoading ? 'Generating...' : 'Generate Suggestions'}
              </button>
            </div>
            
            {optimizationResults ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
                    <div className={`text-sm ${theme.textMuted} mb-1`}>Original CO₂</div>
                    <div className={`text-2xl font-bold ${theme.text}`}>
                      {optimizationResults.Original_CO2_kg} kg
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50'}`}>
                    <div className={`text-sm ${theme.textMuted} mb-1`}>Optimized CO₂</div>
                    <div className={`text-2xl font-bold ${theme.text}`}>
                      {optimizationResults.Optimized_CO2_kg} kg
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`font-medium ${theme.text}`}>Reduction Potential</span>
                    <span className={`font-bold ${theme.text}`}>
                      {optimizationResults.Reduction_Percent}%
                    </span>
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">
                    You could save {optimizationResults.Reduction_kg} kg CO₂
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className={`font-medium ${theme.text} mb-3`}>Recommendations:</h3>
                  <div className="space-y-3">
                    {optimizationResults.Suggestions?.map((suggestion, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-medium ${theme.text}`}>{suggestion.parameter}</span>
                          <span className={`text-sm ${theme.textMuted}`}>Save {suggestion.impact_kg} kg CO₂</span>
                        </div>
                        <p className={`text-sm ${theme.textMuted}`}>{suggestion.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-16 h-16 text-emerald-600 mx-auto mb-4 opacity-50" />
                <p className={theme.textMuted}>Generate optimization suggestions for this batch</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // REPORTS VIEW
  if (currentView === 'reports') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme.text}`}>Reports</h1>
          <p className={`${theme.textMuted} mt-1`}>Generate and download project reports</p>
        </div>

        {!selectedBatch ? (
          <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-12 text-center`}>
            <AlertCircle className={`w-16 h-16 ${theme.textMuted} mx-auto mb-4`} />
            <h3 className={`text-xl font-semibold ${theme.text} mb-2`}>No Batch Selected</h3>
            <p className={`${theme.textMuted} mb-6`}>Please select a batch to generate reports</p>
            <button 
              onClick={() => setCurrentView('process-data')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Select Batch
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
                <FileText className="w-12 h-12 text-emerald-600 mb-4" />
                <h3 className={`text-lg font-semibold ${theme.text} mb-2`}>PDF Report</h3>
                <p className={`${theme.textMuted} mb-4`}>Comprehensive report with charts and analysis</p>
                <button 
                  onClick={() => handleDownloadReport('pdf')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Download PDF
                </button>
              </div>

              <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
                <FileText className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className={`text-lg font-semibold ${theme.text} mb-2`}>Excel Data</h3>
                <p className={`${theme.textMuted} mb-4`}>Raw data and calculations in spreadsheet format</p>
                <button 
                  onClick={() => handleDownloadReport('excel')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Excel
                </button>
              </div>
            </div>

            <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
              <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>Report History</h2>
              {selectedBatchDetails && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <span className={`font-medium ${theme.text}`}>Batch {selectedBatch.batch_id}</span>
                      <p className={`text-sm ${theme.textMuted}`}>Created: {new Date(selectedBatchDetails.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className={`font-medium ${theme.text}`}>{selectedBatchDetails.co2_emissions_kg?.toFixed(1)} kg CO₂</div>
                      <p className={`text-sm ${theme.textMuted}`}>Production: {selectedBatchDetails.production_volume} kg</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // AI ASSISTANT VIEW - ENHANCED VERSION
  if (currentView === 'ai-assistant') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${theme.text}`}>AI Assistant</h1>
              <p className={`${theme.textMuted} mt-1`}>Multi-model AI support with prompt chaining</p>
            </div>
            <button
              onClick={clearConversation}
              className={`px-4 py-2 text-sm border ${theme.border} rounded-lg ${theme.hoverBg} ${theme.text} transition-colors`}
            >
              Clear Chat
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Control Panel */}
          <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
            <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>Chat Settings</h2>
            
            <div className="space-y-4">
              {/* Mode Selection */}
              <div>
                <label className={`block text-sm font-medium ${theme.text} mb-2`}>AI Mode</label>
                <div className="space-y-2">
                  {availableModels ? (
                    Object.entries(availableModels).map(([modeKey, modeInfo]) => (
                      <button
                        key={modeKey}
                        onClick={() => setChatMode(modeKey)}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          chatMode === modeKey
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                            : `${theme.border} ${theme.hoverBg}`
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${theme.text}`}>
                            {modeKey.replace('_', ' ').toUpperCase()}
                          </span>
                          {chatMode === modeKey && (
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          )}
                        </div>
                        <p className={`text-xs ${theme.textMuted} mt-1`}>{modeInfo.description}</p>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                      <p className={`text-xs ${theme.textMuted}`}>Loading models...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Temperature Control */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-sm font-medium ${theme.text}`}>Creativity</label>
                  <span className={`text-sm ${theme.textMuted}`}>{temperature.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span>Precise</span>
                  <span>Balanced</span>
                  <span>Creative</span>
                </div>
              </div>

              {/* Model Info */}
              {availableModels && chatMode && (
                <div className={`p-3 rounded-lg ${
                  darkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                } border ${
                  darkMode ? 'border-blue-800' : 'border-blue-200'
                }`}>
                  <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
                    ACTIVE MODEL
                  </div>
                  <div className={`text-sm font-medium ${theme.text}`}>
                    {availableModels[chatMode]?.model?.split('/').pop() || 'Unknown'}
                  </div>
                  <div className={`text-xs ${theme.textMuted} mt-1`}>
                    Best for: {availableModels[chatMode]?.best_for || 'General queries'}
                  </div>
                </div>
              )}

              {/* Quick Questions */}
              <div>
                <h3 className={`text-sm font-medium ${theme.text} mb-2`}>Quick Questions</h3>
                <div className="space-y-2">
                  {[
                    "What are my top emission sources?",
                    "Suggest 3 quick optimizations",
                    "Explain carbon intensity",
                    "Compare with industry average"
                  ].map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAiMessage(question);
                        // Auto-send quick questions in quick_action mode
                        if (chatMode === 'quick_action') {
                          setTimeout(() => handleSendEnhancedAI(), 100);
                        }
                      }}
                      className={`w-full text-left p-2 text-sm rounded border ${theme.border} ${theme.hoverBg} ${theme.text} transition-colors`}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Panel */}
          <div className={`lg:col-span-3 ${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
            <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>
              Chat with AI Assistant
              {selectedProject && (
                <span className={`text-sm font-normal ${theme.textMuted} ml-2`}>
                  • {selectedProject.name}
                </span>
              )}
            </h2>
            
            {/* Conversation History */}
            <div className="mb-6 h-[400px] overflow-y-auto p-4 border rounded-lg bg-slate-50 dark:bg-slate-900 space-y-4">
              {conversationHistory.length === 0 ? (
                <div className="text-center py-12">
                  <Bot className={`w-12 h-12 ${theme.textMuted} mx-auto mb-4 opacity-50`} />
                  <p className={`${theme.textMuted}`}>
                    Start a conversation about your project data, optimization, or LCA concepts
                  </p>
                  <p className={`text-xs ${theme.textMuted} mt-2`}>
                    Select a mode above to customize the AI's response style
                  </p>
                </div>
              ) : (
                conversationHistory.map((message, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium opacity-75">
                          {message.role === 'user' ? 'You' : 'AI Assistant'}
                        </span>
                        {message.role === 'assistant' && (
                          <span className="text-xs opacity-75">
                            {message.mode?.replace('_', ' ') || 'AI'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <div className="text-xs opacity-50 mt-2 text-right">
                        {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <div className="flex space-x-2">
              <input
                type="text"
                value={aiMessage}
                onChange={(e) => setAiMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendEnhancedAI()}
                placeholder={`Ask about ${
                  chatMode === 'quick_action' ? 'quick actions...' :
                  chatMode === 'explainer' ? 'LCA concepts...' :
                  chatMode === 'advanced_reasoning' ? 'advanced analysis...' :
                  'your project data...'
                }`}
                className={`flex-1 px-4 py-2 border ${theme.inputBg} ${theme.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                disabled={aiLoading}
              />
              <button
                onClick={handleSendEnhancedAI}
                disabled={aiLoading || !aiMessage.trim()}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {aiLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </div>

            {/* Response Info */}
            {aiResponse && (
              <div className={`mt-4 p-3 rounded-lg border ${theme.border} text-sm`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className={`font-medium ${theme.text}`}>Response Details:</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      darkMode ? 'bg-slate-700' : 'bg-slate-100'
                    }`}>
                      {chatMode.replace('_', ' ')}
                    </span>
                  </div>
                  {availableModels && chatMode && (
                    <span className={`text-xs ${theme.textMuted}`}>
                      Model: {availableModels[chatMode]?.model?.split('/').pop() || 'Unknown'}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // UPLOADS VIEW - ENHANCED VERSION
  if (currentView === 'uploads') {
    return (
      <>
        <div className="p-8">
          <div className="mb-8">
            <h1 className={`text-3xl font-bold ${theme.text}`}>Uploads</h1>
            <p className={`${theme.textMuted} mt-1`}>Upload process data, reports, and other files</p>
          </div>

          {/* Template Downloads */}
          <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6 mb-6`}>
            <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>Download Templates</h2>
            <p className={`${theme.textMuted} mb-4`}>Download standardized templates to ensure correct formatting</p>
            
            <div className="flex space-x-3">
              <button 
                onClick={() => handleDownloadTemplate('excel')}
                className="flex items-center space-x-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Excel Template (.xlsx)</span>
              </button>
              
              <button 
                onClick={() => handleDownloadTemplate('csv')}
                className="flex items-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>CSV Template (.csv)</span>
              </button>
            </div>
            
            <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-slate-700' : 'bg-slate-50'}`}>
              <h3 className={`text-sm font-medium ${theme.text} mb-2`}>Template Features:</h3>
              <ul className={`text-sm ${theme.textMuted} space-y-1 list-disc list-inside`}>
                <li>Pre-configured columns with correct data types</li>
                <li>Example data for reference</li>
                <li>Column descriptions as comments</li>
                <li>Compatible with Excel, Google Sheets, and other tools</li>
              </ul>
            </div>
          </div>

          {/* Upload New File */}
          <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6 mb-6`}>
            <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>Upload New File</h2>
            
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
              <Upload className={`w-12 h-12 ${theme.textMuted} mx-auto mb-4`} />
              <p className={`${theme.textMuted} mb-4`}>Drag and drop files here, or click to browse</p>
              
              <input
                type="file"
                id="file-upload"
                onChange={handleFileUpload}
                className="hidden"
                disabled={uploading}
                accept=".csv,.xlsx,.xls,.pdf"
              />
              <label htmlFor="file-upload">
                <div className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors inline-block cursor-pointer">
                  Browse Files
                </div>
              </label>
              
              <p className={`text-xs ${theme.textMuted} mt-4`}>Supported: CSV, Excel (Max 50MB)</p>
            </div>

            {uploading && (
              <div className="mt-6">
                <div className="flex justify-between mb-1">
                  <span className={`text-sm ${theme.text}`}>Uploading...</span>
                  <span className={`text-sm ${theme.textMuted}`}>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Uploaded Files List */}
          <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${theme.text}`}>Uploaded Files</h2>
              <div className="flex items-center space-x-3">
                {!selectedProject && (
                  <span className={`text-sm ${theme.textMuted}`}>Select a project to process files</span>
                )}
                <button 
                  onClick={loadUploads}
                  disabled={uploadsLoading}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {uploadsLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
            
            {uploadsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
            ) : uploadsList.length === 0 ? (
              <div className="text-center py-8">
                <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className={theme.textMuted}>No files uploaded yet</p>
                <p className={`text-sm ${theme.textMuted} mt-2`}>Upload a file or download a template to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {uploadsList.map((file) => (
                  <div key={file.id} className={`p-4 border rounded-lg ${
                    file.status === 'processed' 
                      ? darkMode ? 'border-emerald-800 bg-emerald-900/20' : 'border-emerald-200 bg-emerald-50'
                      : theme.border
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded ${
                          file.content_type.includes('excel') || file.content_type.includes('csv')
                            ? 'bg-emerald-100 dark:bg-emerald-900'
                            : 'bg-blue-100 dark:bg-blue-900'
                        }`}>
                          <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`font-medium ${theme.text}`}>{file.original_filename}</span>
                            {file.status === 'processed' && (
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                darkMode ? 'bg-emerald-800 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                Processed
                              </span>
                            )}
                          </div>
                          <div className={`text-xs ${theme.textMuted} mt-1`}>
                            Uploaded: {new Date(file.uploaded_at).toLocaleDateString()} • 
                            {(file.size / 1024).toFixed(1)} KB • {file.content_type}
                          </div>
                          {file.rows_processed !== null && (
                            <div className={`text-xs ${
                              darkMode ? 'text-emerald-400' : 'text-emerald-600'
                            } mt-1`}>
                              {file.rows_processed} batches processed
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {file.status !== 'processed' && 
                         (file.content_type.includes('excel') || file.content_type.includes('csv')) && (
                          <button
                            onClick={() => handleProcessFile(file.id)}
                            disabled={!selectedProject || processingFileId === file.id}
                            className={`px-3 py-1 text-sm rounded transition-colors ${
                              !selectedProject || processingFileId === file.id
                                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {processingFileId === file.id ? 'Processing...' : 'Process'}
                          </button>
                        )}
                        
                        <button 
                          onClick={() => handleDeleteUpload(file.id)}
                          className="p-2 text-red-500 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Process File Modal */}
        {showProcessModal && selectedFileForProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${theme.cardBg} rounded-lg shadow-xl w-full max-w-md`}>
              <div className="p-6 border-b">
                <h2 className={`text-xl font-bold ${theme.text}`}>Process File</h2>
                <p className={`text-sm ${theme.textMuted} mt-1`}>Import data from file into project</p>
              </div>
              
              <div className="p-6">
                {selectedProject ? (
                  <div>
                    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <h3 className={`font-medium ${theme.text} mb-2`}>Processing Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className={theme.textMuted}>Project:</span>
                          <span className={theme.text}>{selectedProject.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={theme.textMuted}>Metal Type:</span>
                          <span className={theme.text}>{selectedProject.metal_type}</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className={`${theme.text} mb-6`}>
                      This will extract process data from the file and create new batches in your project.
                      Existing batches with duplicate IDs will be skipped.
                    </p>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowProcessModal(false);
                          setSelectedFileForProcessing(null);
                        }}
                        className="px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmProcessFile}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Start Processing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className={theme.text}>No project selected</p>
                    <p className={`text-sm ${theme.textMuted} mt-2`}>
                      Please select a project before processing files
                    </p>
                    <button
                      onClick={() => {
                        setShowProcessModal(false);
                        setCurrentView('projects');
                      }}
                      className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      Select Project
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // ISO COMPLIANCE VIEW
  if (currentView === 'iso-compliance') {
    return <ISOCompliance />;
  }

  // SETTINGS VIEW
  if (currentView === 'settings') {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme.text}`}>Settings</h1>
          <p className={`${theme.textMuted} mt-1`}>Manage your account and application preferences</p>
        </div>
        
        <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-6 mb-6`}>
          <h2 className={`text-lg font-semibold ${theme.text} mb-4`}>Account Settings</h2>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>Name</label>
              <input 
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({...prev, name: e.target.value}))}
                className={`w-full px-4 py-2 border ${theme.inputBg} ${theme.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>Email</label>
              <input 
                type="email"
                value={user?.email || ''}
                disabled
                className={`w-full px-4 py-2 border ${theme.inputBg} ${theme.text} rounded-lg bg-slate-100 dark:bg-slate-700 cursor-not-allowed`}
              />
              <p className={`text-xs ${theme.textMuted} mt-1`}>Email cannot be changed</p>
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme.text} mb-2`}>Company</label>
              <input 
                type="text"
                value={profileData.company}
                onChange={(e) => setProfileData(prev => ({...prev, company: e.target.value}))}
                placeholder="Your company name"
                className={`w-full px-4 py-2 border ${theme.inputBg} ${theme.text} rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
            </div>
            <button 
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT VIEW
  return (
    <div className="p-8">
      <div className={`${theme.cardBg} rounded-lg border ${theme.border} p-12 text-center`}>
        <h2 className={`text-2xl font-bold ${theme.text} mb-4`}>View Not Implemented</h2>
        <p className={`${theme.textMuted} mb-6`}>The {currentView} view is under development</p>
        <button 
          onClick={() => setCurrentView('dashboard')}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Main;